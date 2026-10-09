"use server";

import { createSafeAction } from "@/lib/safe-action";
import { z } from "zod";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { patientCreateSchema, patientUpdateSchema, discountUpdateSchema } from "./schemas";
import { revalidatePath } from "next/cache";
import { getYearsOfService } from "@/lib/date-utils";

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
    let discountPercent = 0;
    let resolvedPrimaryId = data.primaryPatientId || null;
    let salutation: string | null = null;
    let department: string | null = null;
    let c_m: string | null = null;

    if (data.patientType === "Soldier") {
      discountPercent = 100;
      salutation = data.rank || null;
      department = data.division || null;
      c_m = "M";

      // Parse permanentSince from militaryId if possible
      if (data.militaryId && data.militaryId.length >= 2) {
        // Strip the last 2 digits
        const lastPart = data.militaryId.slice(-2);
        const yearVal = parseInt(lastPart, 10);
        if (!isNaN(yearVal)) {
          // If the date is <50 then 20**, if it is >50 then 19**
          if (yearVal < 50) {
            permanentSince = `20${lastPart}`;
          } else {
            permanentSince = `19${lastPart}`;
          }
        }
      }
    } else if (data.patientType === "Civilian Family" || data.patientType === "Soldier Family") {
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
        discountPercent = data.patientType === "Soldier Family" ? 100 : (primary ? primary.discountPercent : 95); // fallback
      } else {
        discountPercent = data.patientType === "Soldier Family" ? 100 : 95;
      }
    } else {
      if (!permanentSince || permanentSince.trim() === "") {
        permanentSince = "NaN";
      }
      const yearsOfService = getYearsOfService(permanentSince);

      if (yearsOfService >= 20) discountPercent = 100;
      else if (yearsOfService >= 15) discountPercent = 75;
      else if (yearsOfService >= 10) discountPercent = 65;
      else if (yearsOfService >= 6) discountPercent = 55;
      else discountPercent = 50;
    }

    if (!permanentSince || permanentSince.trim() === "") {
      permanentSince = "NaN";
    }

    const autoPilotSetting = await prisma.systemSetting.findUnique({
      where: { key: "registrationAutoPilot" }
    });
    const isAutoPilot = autoPilotSetting?.value === "true";

    let status = "APPROVED";
    // If reception creates a staff/soldier/family patient with paperwork, it goes to PENDING (unless auto pilot is on)
    if (
      !isAutoPilot &&
      ctx.role === "Reception" && 
      data.hasPaperwork && 
      ["Soldier", "Civilian Staff", "Civilian Family"].includes(data.patientType || "")
    ) {
      status = "PENDING";
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
        salutation,
        department,
        c_m,
        status,
        hasPaperwork: data.hasPaperwork || false,
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
      if (ctx.role === "Reception") {
        const isTimeExpired = new Date().getTime() - existingPatient.createdAt.getTime() >= 86400000;
        const isNanSince = !existingPatient.permanentSince || existingPatient.permanentSince === "NaN";
        if (isTimeExpired && !isNanSince) {
          throw new Error("Access Denied: Reception can only modify patient data within 24 hours of creation unless 'Since' is invalid.");
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
    let resolvedPrimaryId = existingPatient.primaryPatientId;
    let newRelationship = existingPatient.relationship;

    if (existingPatient.patientType === "Soldier") {
      discountPercent = 100;
    } else if (existingPatient.patientType === "Civilian Family" || existingPatient.patientType === "Soldier Family") {
      if (data.staffSearchStr != null) {
        const searchStr = data.staffSearchStr.trim();
        if (searchStr === "" || searchStr === "UNLINK") {
          resolvedPrimaryId = null;
          newRelationship = null;
          discountPercent = existingPatient.patientType === "Soldier Family" ? 100 : 95; // default fallback when unlinked
        } else {
          const primary = await prisma.patient.findFirst({
            where: {
              OR: [
                { contactNumber: searchStr },
                { militaryId: searchStr },
                { employeeId: searchStr }
              ]
            }
          });
          if (!primary) {
            throw new Error("Could not find a staff member with that Phone Number or ID. Please verify.");
          }
          resolvedPrimaryId = primary.id;
          newRelationship = data.relationship || "Other";
          discountPercent = existingPatient.patientType === "Soldier Family" ? 100 : primary.discountPercent;
        }
      } else {
        // Just retain existing link, inherit discount again just in case primary changed
        if (resolvedPrimaryId) {
          const primary = await prisma.patient.findUnique({ where: { id: resolvedPrimaryId } });
          discountPercent = existingPatient.patientType === "Soldier Family" ? 100 : (primary ? primary.discountPercent : 95);
        } else {
          discountPercent = existingPatient.patientType === "Soldier Family" ? 100 : 95;
        }
      }
    } else {
      const yearsOfService = getYearsOfService(permanentSince);

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
        primaryPatientId: resolvedPrimaryId,
        relationship: newRelationship,
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
          yob: true
        }
      });
    }

    return await prisma.patient.findMany({
      where: {
        OR: [
          { firstName: { contains: term, mode: "insensitive" } },
          { lastName: { contains: term, mode: "insensitive" } },
          { contactNumber: { contains: term, mode: "insensitive" } },
          { employeeId: { contains: term, mode: "insensitive" } },
          { militaryId: { contains: term, mode: "insensitive" } },
          { id: { contains: term, mode: "insensitive" } }
        ]
      },
      take: 8,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        contactNumber: true,
        yob: true
      }
    });
  }
});

export const approvePatient = createSafeAction({
  schema: z.object({ patientId: z.string() }),
  requiredPermission: PERMISSIONS.PATIENT_CREATE, 
  handler: async (data, ctx) => {
    if (ctx.role !== "Admin" && ctx.role !== "Manager") {
      throw new Error("Only Managers and Admins can approve patient registrations.");
    }

    const patient = await prisma.patient.update({
      where: { id: data.patientId },
      data: { status: "APPROVED" }
    });

    await logAudit({
      actorId: ctx.userId,
      action: "PATIENT_APPROVE",
      resourceId: patient.id,
      newValue: { status: "APPROVED" }
    });

    revalidatePath("/patients");
    revalidatePath(`/patients/${patient.id}`);
    
    return patient;
  }
});
