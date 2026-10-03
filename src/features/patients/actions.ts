"use server";

import { createSafeAction } from "@/lib/safe-action";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { patientCreateSchema, patientUpdateSchema, discountUpdateSchema } from "./schemas";
import { revalidatePath } from "next/cache";
import { getECYearsOfService } from "@/lib/ethiopian-calendar";

export const createPatient = createSafeAction({
  schema: patientCreateSchema,
  requiredPermission: PERMISSIONS.PATIENT_CREATE,
  handler: async (data, ctx) => {
    
    // Duplicate Detection Logic
    if (data.contactNumber || (data.firstName && data.lastName && data.yob)) {
      const duplicateConditions = [];
      if (data.contactNumber && data.contactNumber.trim() !== "") {
        duplicateConditions.push({ contactNumber: data.contactNumber.trim() });
      }
      if (data.firstName && data.lastName && data.yob) {
        duplicateConditions.push({
          firstName: { equals: data.firstName.trim(), mode: "insensitive" as const },
          lastName: { equals: data.lastName.trim(), mode: "insensitive" as const },
          yob: data.yob
        });
      }
      
      if (duplicateConditions.length > 0) {
        const existing = await prisma.patient.findFirst({
          where: { OR: duplicateConditions }
        });
        if (existing) {
          throw new Error(`A patient with this Phone Number or exact Name+yob already exists (ID: ${existing.id}).`);
        }
      }
    }

    const yob = data.yob || null;
    
    let permanentSince = data.permanentSince;
    if (!permanentSince || permanentSince.trim() === "") {
      permanentSince = "NaN";
    }
    
    let discountPercent = 0;
    let resolvedPrimaryId = data.primaryPatientId || null;

    if (data.patientType === "Soldier") {
      discountPercent = 100;
    } else if (data.patientType === "Civilian Family") {
      // Resolve staff by phone, militaryId, or employeeId
      if (data.staffSearchStr && !resolvedPrimaryId) {
        const primary = await prisma.patient.findFirst({
          where: {
            OR: [
              { contactNumber: data.staffSearchStr.trim() },
              { militaryId: data.staffSearchStr.trim() },
              { employeeId: data.staffSearchStr.trim() }
            ]
          }
        });
        if (!primary) {
          throw new Error("Could not find a staff member with that Phone Number or ID. Please verify.");
        }
        resolvedPrimaryId = primary.id;
      }

      // If they are family, we can inherit the exact discount of the primary patient
      if (resolvedPrimaryId) {
        const primary = await prisma.patient.findUnique({ where: { id: resolvedPrimaryId } });
        discountPercent = primary ? primary.discountPercent : 95; // fallback
      } else {
        discountPercent = 95;
      }
    } else {
      const yearsOfService = getECYearsOfService(permanentSince);

      if (yearsOfService >= 20) discountPercent = 100;
      else if (yearsOfService >= 15) discountPercent = 75;
      else if (yearsOfService >= 10) discountPercent = 65;
      else if (yearsOfService >= 6) discountPercent = 55;
      else discountPercent = 50;
    }

    

    const newPatient = await prisma.patient.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        yob: yob,
        gender: data.gender,
        contactNumber: data.contactNumber,
        patientType: data.patientType || "Civilian Staff",
        militaryId: data.militaryId,
        rank: data.rank,
        division: data.division,
        permanentSince: permanentSince,
        discountPercent: discountPercent,
        primaryPatientId: resolvedPrimaryId,
        relationship: data.relationship || null,
      },
    });

    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.PATIENT_CREATE,
      resourceId: newPatient.id,
      newValue: { id: newPatient.id, name: `${newPatient.firstName} ${newPatient.lastName}` },
    });

    revalidatePath("/patients");
    return newPatient;
  },
});

export const updatePatient = createSafeAction({
  schema: patientUpdateSchema,
  requiredPermission: PERMISSIONS.PATIENT_CREATE,
  handler: async (data, ctx) => {
    
    const existingPatient = await prisma.patient.findUnique({ where: { id: data.patientId } });
    if (!existingPatient) throw new Error("Patient not found.");

    if (ctx.role !== "Admin") {
      if (ctx.role === "Receptionist") {
        const isTimeExpired = new Date().getTime() - existingPatient.createdAt.getTime() >= 86400000;
        const isNanSince = !existingPatient.permanentSince || existingPatient.permanentSince === "NaN";
        if (isTimeExpired && !isNanSince) {
          throw new Error("Access Denied: Receptionists can only modify patient data within 24 hours of creation unless 'Since' is invalid.");
        }
      } else {
        throw new Error("Access Denied: You do not have permission to modify patient demographics.");
      }
    }

    const yob = data.yob || null;
    let permanentSince = data.permanentSince;
    if (!permanentSince || permanentSince.trim() === "") {
      permanentSince = "NaN";
    }
    
    // Recalculate discount based on patient type and new hire date
    let discountPercent = existingPatient.discountPercent;
    if (existingPatient.patientType === "Soldier") {
      discountPercent = 100;
    } else if (existingPatient.patientType === "Civilian Family") {
      discountPercent = 95;
    } else {
      const yearsOfService = getECYearsOfService(permanentSince);

      if (yearsOfService >= 20) discountPercent = 100;
      else if (yearsOfService >= 15) discountPercent = 75;
      else if (yearsOfService >= 10) discountPercent = 65;
      else if (yearsOfService >= 6) discountPercent = 55;
      else discountPercent = 50;
    }

    const updatedPatient = await prisma.patient.update({
      where: { id: data.patientId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        yob: yob,
        gender: data.gender,
        contactNumber: data.contactNumber,
        permanentSince: permanentSince,
        discountPercent: discountPercent,
      },
    });

    await logAudit({
      actorId: ctx.userId,
      action: "PATIENT_UPDATE",
      resourceId: updatedPatient.id,
      newValue: { id: updatedPatient.id, name: `${updatedPatient.firstName} ${updatedPatient.lastName}` },
    });

    revalidatePath(`/patients/${updatedPatient.id}`);
    revalidatePath("/patients");
    return updatedPatient;
  },
});

export const updateDiscount = createSafeAction({
  schema: discountUpdateSchema,
  requiredPermission: PERMISSIONS.DISCOUNT_UPDATE,
  handler: async (data, ctx) => {
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
    });

    if (!patient) {
      throw new Error("Patient not found");
    }

    if (patient.discountPercent === data.discountPercent) {
      return patient; // No change
    }

    const oldDiscount = patient.discountPercent;
    
    const updatedPatient = await prisma.patient.update({
      where: { id: data.patientId },
      data: { discountPercent: data.discountPercent },
    });

    // Write audit record for the discount change
    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.DISCOUNT_UPDATE,
      resourceId: patient.id,
      oldValue: { discountPercent: oldDiscount },
      newValue: { discountPercent: data.discountPercent },
      reason: data.reason || "Manager discount override",
    });

    revalidatePath(`/patients/${patient.id}`);
    return updatedPatient;
  },
});

export const searchPatientsFast = createSafeAction({
  schema: z.object({ query: z.string().optional() }),
  requiredPermission: PERMISSIONS.PATIENT_READ,
  handler: async (data, ctx) => {
    const term = (data.query || "").trim();
    
    if (!term) {
      // Return 8 most recent patients as recommendations
      return await prisma.patient.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          contactNumber: true,
          dateOfBirth: true
        }
      });
    }

    return await prisma.patient.findMany({
      where: {
        OR: [
          { firstName: { startsWith: term, mode: "insensitive" } },
          { lastName: { startsWith: term, mode: "insensitive" } },
          { contactNumber: { startsWith: term } }
        ]
      },
      take: 8,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        contactNumber: true,
        dateOfBirth: true
      }
    });
  }
});
    return patients;
  }
});
