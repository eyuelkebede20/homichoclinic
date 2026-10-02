"use server";

import { createSafeAction } from "@/lib/safe-action";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getECYearsOfService } from "@/lib/ethiopian-calendar";

function calculateDiscount(permanentSinceStr: string | null): number {
  const yearsOfService = getECYearsOfService(permanentSinceStr);
  
  if (yearsOfService >= 20) return 100;
  if (yearsOfService >= 15) return 75;
  if (yearsOfService >= 10) return 65;
  if (yearsOfService >= 6) return 55;
  return 50;
}

const csvImportSchema = z.object({
  csvText: z.string().min(1, "CSV text cannot be empty"),
});

export const importPatientsCSV = createSafeAction({
  schema: csvImportSchema,
  requiredPermission: PERMISSIONS.USER_MANAGE, // Only admins can bulk import
  handler: async (data) => {
    // Basic CSV parser
    const lines = data.csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) throw new Error("CSV must contain headers and at least one row.");

    // Detect if the file uses tabs (often used when saving Unicode/Amharic from Excel)
    const delimiter = lines[0].includes('\t') ? '\t' : ',';

    // Parse headers
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());
    
    // Validate that we found at least some expected headers
    const hasKnownHeader = headers.some(h => 
      ['firstname', 'first name', 'first_name', 'name', 'fullname', 'full name', 'phone', 'contact', 'salutation', 'department', 'since', 'permanent', 'c_m', 'emergencycontact', 'emergencymobile', 'emergency contact', 'emergency mobile', 'primarymobile', 'gov_id', 'yob'].includes(h)
    );
    if (!hasKnownHeader) {
      throw new Error(`Could not recognize columns in the file. Found headers: ${headers.slice(0, 3).join(', ')}... Please use the sample file format.`);
    }
    
    // Map of phone numbers to Primary Patient IDs (so we can link dependents instantly)
    const phoneToPatientId = new Map<string, string>();
    
    let createdCount = 0;
    const errors: string[] = [];

    // First pass: We want to insert all Primary Staff Members first
    const staffRows = [];
    const dependentRows = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values = line.split(delimiter).map(v => v.trim());
      
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });

      const rel = (row["relationship"] || row["role"] || "").toLowerCase();
      const hasPrimaryPhone = !!(row["primaryphone"] || row["familyphone"]);
      
      if (rel === "staff" || rel === "primary" || rel === "employee" || (!rel && !hasPrimaryPhone)) {
        staffRows.push(row);
      } else {
        dependentRows.push(row);
      }
    }

    // Function to process a single row
    async function processRow(row: Record<string, string>, isDependent: boolean) {
      let firstName = row["firstname"] || row["first name"] || row["first_name"] || row["name"] || row["fullname"] || row["full name"];
      let lastName = row["lastname"] || row["last name"] || row["last_name"];
      const phone = row["phone"] || row["contact"] || row["contactnumber"] || row["primaryphone"] || row["primarymobile"];
      const finalPhone = phone || "-";
      const dobStr = row["dob"] || row["dateofbirth"] || row["yob"];
      const gender = row["gender"] || "-";
      const rawDiscount = parseInt(row["discount"] || "0", 10);
      const relationship = row["relationship"] || row["role"];
      const primaryPhone = row["primaryphone"] || row["familyphone"] || row["primarymobile"];
      const promoCode = row["promocode"] || row["promo_code"];
      const employeeId = row["employeeid"] || row["employee id"] || row["employee_id"] || row["gov_id"] || row["govid"];
      
      const salutation = row["salutation"] || row["title"] || "-";
      const department = row["department"] || row["dept"] || "-";
      
      let permanentSince = row["permanentsince"] || row["since"] || row["permanent"];
      if (!permanentSince || permanentSince.trim() === "") {
        permanentSince = "NaN";
      }
      
      const c_m = row["c_m"] || row["c/m"] || row["cm"] || "-";
      const emergencyContact = row["emergencycontact"] || row["emergency contact"] || "-";
      const emergencyMobile = row["emergencymobile"] || row["emergency mobile"] || "-";

      if (firstName && !lastName && firstName.includes(' ')) {
        const parts = firstName.split(' ');
        firstName = parts[0];
        lastName = parts.slice(1).join(' ');
      }

      if (!firstName) firstName = "-";
      if (!lastName) lastName = "-";

      let yob = dobStr ? dobStr.trim() : "-";
      if (yob !== "-") {
        const num = parseInt(yob, 10);
        if (!isNaN(num) && num < 200) {
          yob = (2019 - num).toString();
        }
      }

      let primaryPatientId = null;
      if (isDependent && primaryPhone) {
        if (phoneToPatientId.has(primaryPhone)) {
          primaryPatientId = phoneToPatientId.get(primaryPhone);
        } else {
          const existingPrimary = await prisma.patient.findFirst({
            where: { contactNumber: primaryPhone }
          });
          if (existingPrimary) {
            primaryPatientId = existingPrimary.id;
            phoneToPatientId.set(primaryPhone, existingPrimary.id);
          } else {
            errors.push(`Could not find primary staff for dependent ${firstName} ${lastName} (Phone: ${primaryPhone})`);
          }
        }
      }

      let computedDiscount = 0;
      if (!isNaN(rawDiscount) && rawDiscount > 0) {
        computedDiscount = rawDiscount;
      } else if (c_m.toLowerCase().startsWith("m")) {
        computedDiscount = 100;
      } else if (isDependent) {
        computedDiscount = 95; 
      } else {
        computedDiscount = calculateDiscount(permanentSince); 
      }

      const existing = await prisma.patient.findFirst({
        where: { firstName, lastName, contactNumber: finalPhone }
      });

      if (!existing) {
        const newPat = await prisma.patient.create({
          data: {
            firstName,
            lastName,
            contactNumber: finalPhone,
            gender: gender,
            yob: yob,
            discountPercent: computedDiscount,
            relationship: relationship || (isDependent ? "Dependent" : "Staff"),
            primaryPatientId: primaryPatientId,
            promoCode: promoCode || "-",
            employeeId: employeeId || null,
            salutation: salutation,
            department: department,
            permanentSince: permanentSince,
            c_m: c_m,
            emergencyContact: emergencyContact,
            emergencyMobile: emergencyMobile
          }
        });
        createdCount++;
        
        if (finalPhone !== "-") {
          phoneToPatientId.set(finalPhone, newPat.id);
        }
      } else {
        errors.push(`Skipped duplicate patient: ${firstName} ${lastName} (Phone: ${finalPhone})`);
      }
    }

    // Process staff first
    for (const row of staffRows) {
      await processRow(row, false);
    }

    // Process dependents next so they can link to staff
    for (const row of dependentRows) {
      await processRow(row, true);
    }

    revalidatePath("/patients");
    revalidatePath("/admin");

    return { created: createdCount, errors };
  }
});
