"use server";

import { prisma } from "@/lib/prisma";
import { PERMISSIONS, ROLE_PERMISSIONS } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

function calculateDiscount(hiredYearEC: number | null): number {
  if (!hiredYearEC) return 0;
  // Basic default logic: If hired earlier than 2010 EC, give some discount.
  // The user can configure this later or edit the person.
  // Let's say: base discount of 10% for everyone, plus 2% per year of service (assuming current EC year is 2018).
  const currentECYear = 2018; // Approx 2026 GC
  const yearsOfService = Math.max(0, currentECYear - hiredYearEC);
  
  if (yearsOfService >= 10) return 50; // Max 50% for 10+ years
  if (yearsOfService >= 5) return 25;  // 25% for 5+ years
  return 10; // Default 10% for staff
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

  // Skip header if present
  let startIndex = 0;
  if (lines[0].toLowerCase().includes("name") || lines[0].toLowerCase().includes("id")) {
    startIndex = 1;
  }

  let importedCount = 0;
  let errorCount = 0;

  // Pass 1: Import Staff (with EmployeeID)
  for (let i = startIndex; i < lines.length; i++) {
    const columns = lines[i].split(',').map(c => c.trim());
    if (columns.length < 2) continue; // Skip invalid lines
    
    const employeeId = columns[1];
    if (!employeeId || employeeId.length === 0) continue; // Skip dependents for now

    const fullName = columns[0];
    const hiredYearStr = columns.length >= 3 ? columns[2] : null;
    const phone = columns.length >= 4 ? columns[3] : null;

    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || "Unknown";
    const lastName = nameParts.slice(1).join(' ') || "Unknown";
    
    const hiredYearEC = hiredYearStr ? parseInt(hiredYearStr, 10) : null;
    const computedDiscount = calculateDiscount(hiredYearEC);

    try {
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
        }
      });
      importedCount++;
    } catch (err) {
      console.error("Failed to import staff row:", lines[i], err);
      errorCount++;
    }
  }

  // Pass 2: Import Dependents (no EmployeeID, linked by Phone)
  for (let i = startIndex; i < lines.length; i++) {
    const columns = lines[i].split(',').map(c => c.trim());
    if (columns.length < 2) continue;
    
    const employeeId = columns[1];
    if (employeeId && employeeId.length > 0) continue; // Skip staff

    const fullName = columns[0];
    const phone = columns.length >= 4 ? columns[3] : (columns.length >= 2 && columns[1].length > 6 ? columns[1] : null); // If col 1 was used as phone fallback
    
    // If no phone, we can't link them reliably via CSV, but we still import them as standalone patients
    let primaryPatientId = null;
    if (phone && phone.length > 0) {
      const staffMember = await prisma.patient.findFirst({
        where: { contactNumber: phone, relationship: "Staff" }
      });
      if (staffMember) {
        primaryPatientId = staffMember.id;
      }
    }

    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || "Unknown";
    const lastName = nameParts.slice(1).join(' ') || "Unknown";

    try {
      await prisma.patient.create({
        data: {
          firstName,
          lastName,
          contactNumber: phone || null,
          relationship: primaryPatientId ? "Dependent" : "Patient",
          primaryPatientId
        }
      });
      importedCount++;
    } catch (err) {
      console.error("Failed to import dependent row:", lines[i], err);
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
