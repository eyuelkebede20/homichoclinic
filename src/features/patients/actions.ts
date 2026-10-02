"use server";

import { createSafeAction } from "@/lib/safe-action";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { patientCreateSchema, patientUpdateSchema, discountUpdateSchema } from "./schemas";
import { revalidatePath } from "next/cache";

export const createPatient = createSafeAction({
  schema: patientCreateSchema,
  requiredPermission: PERMISSIONS.PATIENT_CREATE,
  handler: async (data, ctx) => {
    const dob = data.dob || null;
    
    let permanentSince = data.permanentSince || "2019-01-01";
    let pDate = new Date(permanentSince);
    if (isNaN(pDate.getTime())) {
      pDate = new Date("2019-01-01");
      permanentSince = "2019-01-01";
    }
    
    let discountPercent = 0;
    if (data.patientType === "Soldier") {
      discountPercent = 100;
    } else if (data.patientType === "Civilian Family") {
      discountPercent = 95;
    } else {
      const now = new Date();
      let yearsOfService = now.getFullYear() - pDate.getFullYear();
      const m = now.getMonth() - pDate.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < pDate.getDate())) {
        yearsOfService--;
      }
      yearsOfService = Math.max(0, yearsOfService);

      if (yearsOfService >= 20) discountPercent = 100;
      else if (yearsOfService >= 15) discountPercent = 75;
      else if (yearsOfService >= 10) discountPercent = 65;
      else if (yearsOfService >= 6) discountPercent = 55;
      else discountPercent = 50;
    }

    const user = await prisma.user.findUnique({ where: { id: ctx.userId } });

    const newPatient = await prisma.patient.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        dob: dob,
        gender: data.gender,
        contactNumber: data.contactNumber,
        patientType: data.patientType || "Civilian Staff",
        militaryId: data.militaryId,
        rank: data.rank,
        division: data.division,
        permanentSince: permanentSince,
        discountPercent: discountPercent,
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
    const user = await prisma.user.findUnique({ where: { id: ctx.userId } });
    const existingPatient = await prisma.patient.findUnique({ where: { id: data.patientId } });
    if (!existingPatient) throw new Error("Patient not found.");

    if (user?.role !== "Admin") {
      if (user?.role === "Receptionist") {
        if (new Date().getTime() - existingPatient.createdAt.getTime() >= 86400000) {
          throw new Error("Access Denied: Receptionists can only modify patient data within 24 hours of creation.");
        }
      } else {
        throw new Error("Access Denied: You do not have permission to modify patient demographics.");
      }
    }

    const dob = data.dob || null;
    let permanentSince = data.permanentSince || "2019-01-01";
    let pDate = new Date(permanentSince);
    if (isNaN(pDate.getTime())) {
      pDate = new Date("2019-01-01");
      permanentSince = "2019-01-01";
    }
    
    // Recalculate discount based on patient type and new hire date
    let discountPercent = existingPatient.discountPercent;
    if (existingPatient.patientType === "Soldier") {
      discountPercent = 100;
    } else if (existingPatient.patientType === "Civilian Family") {
      discountPercent = 95;
    } else {
      const now = new Date();
      let yearsOfService = now.getFullYear() - pDate.getFullYear();
      const m = now.getMonth() - pDate.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < pDate.getDate())) {
        yearsOfService--;
      }
      yearsOfService = Math.max(0, yearsOfService);

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
        dob: dob,
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
