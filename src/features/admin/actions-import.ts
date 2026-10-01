"use server";

import { createSafeAction } from "@/lib/safe-action";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

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

      const rel = (row["relationship"] || row["role"] || "staff").toLowerCase();
      if (rel === "staff" || rel === "primary" || rel === "employee") {
        staffRows.push(row);
      } else {
        dependentRows.push(row);
      }
    }

    // Function to process a single row
    async function processRow(row: Record<string, string>, isDependent: boolean) {
      let firstName = row["firstname"] || row["first name"] || row["first_name"] || row["name"];
      let lastName = row["lastname"] || row["last name"] || row["last_name"];
      const phone = row["phone"] || row["contact"] || row["contactnumber"];
      const dobStr = row["dob"] || row["dateofbirth"];
      const gender = row["gender"];
      const discount = parseInt(row["discount"] || "0", 10);
      const relationship = row["relationship"] || row["role"];
      const primaryPhone = row["primaryphone"] || row["familyphone"];

      if (firstName && !lastName && firstName.includes(' ')) {
        const parts = firstName.split(' ');
        firstName = parts[0];
        lastName = parts.slice(1).join(' ');
      }

      if (!firstName && !lastName) {
        errors.push(`Skipped row (missing name): ${JSON.stringify(row)}`);
        return;
      }
      
      if (!firstName) firstName = "Unknown";
      if (!lastName) lastName = "Unknown";

      let dob = null;
      if (dobStr) {
        const parsed = new Date(dobStr);
        if (!isNaN(parsed.getTime())) dob = parsed;
      }

      let primaryPatientId = null;
      if (isDependent && primaryPhone) {
        // Try to find the primary patient ID from our local map
        if (phoneToPatientId.has(primaryPhone)) {
          primaryPatientId = phoneToPatientId.get(primaryPhone);
        } else {
          // Look up in database
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

      // Check if patient already exists (by name + phone to prevent duplicates)
      const existing = await prisma.patient.findFirst({
        where: { firstName, lastName, contactNumber: phone || undefined }
      });

      if (!existing) {
        const newPat = await prisma.patient.create({
          data: {
            firstName,
            lastName,
            contactNumber: phone,
            gender: gender || null,
            dateOfBirth: dob,
            discountPercent: isNaN(discount) ? 0 : discount,
            relationship: relationship || (isDependent ? "Dependent" : "Staff"),
            primaryPatientId: primaryPatientId
          }
        });
        createdCount++;
        
        if (phone) {
          phoneToPatientId.set(phone, newPat.id);
        }
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
