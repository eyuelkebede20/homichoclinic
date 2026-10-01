"use server";

import { prisma } from "@/lib/prisma";
import { PERMISSIONS, ROLE_PERMISSIONS } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

function calculateDiscount(hiredYearEC: number | null): number {
  if (!hiredYearEC) return 50; // Default for 0 years
  
  const d = new Date();
  const currentECYear = (d.getMonth() + 1 < 9 || (d.getMonth() + 1 === 9 && d.getDate() < 11)) ? d.getFullYear() - 8 : d.getFullYear() - 7;
  const yearsOfService = Math.max(0, currentECYear - hiredYearEC);
  
  if (yearsOfService >= 20) return 100;
  if (yearsOfService >= 15) return 75;
  if (yearsOfService >= 10) return 65;
  if (yearsOfService >= 6) return 55;
  return 50; // 0-5 yrs
}

export async function importPatientsFromCSV(csvText: string, userId: string, role: string) {
  // 1. Verify permissions
  const userPermissions = ROLE_PERMISSIONS[role] || [];
  if (!userPermissions.includes(PERMISSIONS.USER_MANAGE) && role !== "Admin" && role !== "Manager") {
    return { error: "You do not have permission to import patients." };
  }

  // 2. Parse CSV
  // Expected format: FullName, EmployeeID, HiredYearEC, PrimaryPhone
  const lines = csvText.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
  
  if (lines.length === 0) {
    return { error: "The CSV file is empty." };
  }

  // Detect delimiter
  const delimiter = lines[0].includes('\t') ? '\t' : ',';

  // Skip header if present
  let startIndex = 0;
  if (lines[0].toLowerCase().includes("name") || lines[0].toLowerCase().includes("id") || lines[0].toLowerCase().includes("phone")) {
    startIndex = 1;
  } else {
    // If we can't find a standard header, let's assume it's data without header, but it's risky.
    // Actually, if it's completely alien, maybe warn them. But we'll just parse from row 0.
  }

  let importedCount = 0;
  let errorCount = 0;

  // Process rows
  for (let i = startIndex; i < lines.length; i++) {
    const columns = lines[i].split(delimiter).map(c => c.trim());
    if (columns.length === 0 || columns.join('').trim() === '') continue; // Skip completely empty lines

    const fullName = columns[0] || "Unknown";
    const employeeId = columns.length >= 2 ? columns[1] : null;
    const hiredYearStr = columns.length >= 3 ? columns[2] : null;
    const phone = columns.length >= 4 ? columns[3] : null;

    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || "Unknown";
    const lastName = nameParts.slice(1).join(' ') || "Unknown";
    
    const hiredYearEC = hiredYearStr ? parseInt(hiredYearStr, 10) : null;
    const computedDiscount = calculateDiscount(hiredYearEC);

    try {
      if (employeeId && employeeId.length > 0) {
        // Import Staff
        await prisma.patient.upsert({
          where: { employeeId },
          update: {
            firstName,
            lastName,
            hiredYearEC: isNaN(hiredYearEC as number) ? null : hiredYearEC,
            discountPercent: isNaN(hiredYearEC as number) ? 0 : computedDiscount,
            relationship: "Staff",
            contactNumber: phone || null,
          },
          create: {
            firstName,
            lastName,
            employeeId,
            hiredYearEC: isNaN(hiredYearEC as number) ? null : hiredYearEC,
            discountPercent: isNaN(hiredYearEC as number) ? 0 : computedDiscount,
            relationship: "Staff",
            contactNumber: phone || null,
            patientType: "Civilian Staff",
          }
        });
      } else {
        // Import Dependent / Generic Patient
        let primaryPatientId = null;
        if (phone && phone.length > 0) {
          const staffMember = await prisma.patient.findFirst({
            where: { contactNumber: phone, relationship: "Staff" }
          });
          if (staffMember) {
            primaryPatientId = staffMember.id;
          }
        }

        await prisma.patient.create({
          data: {
            firstName,
            lastName,
            contactNumber: phone || null,
            relationship: primaryPatientId ? "Civilian Family" : "Patient",
            patientType: primaryPatientId ? "Civilian Family" : "Guest",
            discountPercent: primaryPatientId ? 95 : 0,
            primaryPatientId
          }
        });
      }
      importedCount++;
    } catch (err) {
      console.error("Failed to import row:", lines[i], err);
      errorCount++;
    }
  }

  await logAudit({
    actorId: userId,
    action: "patient:import",
    newValue: JSON.stringify({ importedCount, errorCount }),
    reason: `Bulk imported staff patients from CSV.`,
  });

  revalidatePath("/patients");
  return { success: `Successfully imported ${importedCount} patients. ${errorCount > 0 ? `Failed to import ${errorCount} rows.` : ''}` };
}
