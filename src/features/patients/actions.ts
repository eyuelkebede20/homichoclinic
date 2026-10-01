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
    let dob = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    if (dob) {
      const year = dob.getFullYear();
      if (year < 1900 || year > 2100) dob = null;
    }
    
    let discountPercent = 0;
    if (data.patientType === "Soldier") {
      discountPercent = 100;
    } else if (data.patientType === "Civilian Family") {
      discountPercent = 95;
    } else if ((data.patientType === "Civilian Staff" || !data.patientType) && data.hiredYearEC) {
      const d = new Date();
      const currentECYear = (d.getMonth() + 1 < 9 || (d.getMonth() + 1 === 9 && d.getDate() < 11)) ? d.getFullYear() - 8 : d.getFullYear() - 7;
      const yearsOfService = Math.max(0, currentECYear - data.hiredYearEC);
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
        dateOfBirth: dob,
        gender: data.gender,
        contactNumber: data.contactNumber,
        patientType: data.patientType || "Civilian Staff",
        militaryId: data.militaryId,
        rank: data.rank,
        division: data.division,
        hiredYearEC: data.hiredYearEC,
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
    // Only Admin can update patient data
    const user = await prisma.user.findUnique({ where: { id: ctx.userId } });
    if (user?.role !== "Admin") {
      throw new Error("Access Denied: Only Admins can modify patient demographics.");
    }

    let dob = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    if (dob) {
      const year = dob.getFullYear();
      if (year < 1900 || year > 2100) dob = null;
    }
    
    const updatedPatient = await prisma.patient.update({
      where: { id: data.patientId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: dob,
        gender: data.gender,
        contactNumber: data.contactNumber,
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
