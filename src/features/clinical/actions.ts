"use server";

import { createSafeAction } from "@/lib/safe-action";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { visitCreateSchema, visitUpdateSchema, medicalRecordCreateSchema, labRequestSchema, labResultSchema, prescriptionCreateSchema } from "./schemas";
import { revalidatePath } from "next/cache";

export const createVisit = createSafeAction({
  schema: visitCreateSchema,
  requiredPermission: PERMISSIONS.VISIT_CREATE,
  handler: async (data, ctx) => {
    const visit = await prisma.visit.create({
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        notes: data.notes,
        status: data.status,
        visitDate: data.visitDate ? new Date(data.visitDate) : new Date(),
      },
    });

    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.VISIT_CREATE,
      resourceId: visit.id,
      newValue: { patientId: visit.patientId, status: visit.status },
    });

    revalidatePath(`/patients/${data.patientId}`);
    return visit;
  },
});

export const createMedicalRecord = createSafeAction({
  schema: medicalRecordCreateSchema,
  requiredPermission: PERMISSIONS.HISTORY_WRITE,
  handler: async (data, ctx) => {
    const originalDate = data.originalDate ? new Date(data.originalDate) : null;

    const record = await prisma.medicalRecord.create({
      data: {
        patientId: data.patientId,
        source: data.source,
        originalDate: originalDate,
        attachments: data.attachments,
        content: data.content,
        enteredById: ctx.userId,
      },
    });

    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.HISTORY_WRITE,
      resourceId: record.id,
      newValue: { patientId: record.patientId, source: record.source },
    });

    revalidatePath(`/patients/${data.patientId}`);
    return record;
  },
});

export const requestLabTest = createSafeAction({
  schema: labRequestSchema,
  requiredPermission: PERMISSIONS.LAB_REQUEST,
  handler: async (data, ctx) => {
    // createMany is not always available with SQLite, but we are on Postgres so it's fine.
    const requests = await prisma.labRequest.createManyAndReturn({
      data: data.testIds.map(testId => ({
        patientId: data.patientId,
        testId: testId,
        requestedBy: ctx.userId,
        status: "requested",
      })),
    });

    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.LAB_REQUEST,
      resourceId: data.patientId,
      newValue: { testCount: data.testIds.length },
    });

    revalidatePath(`/patients/${data.patientId}`);
    revalidatePath(`/laboratory`);
    return requests;
  },
});

export const submitLabResult = createSafeAction({
  schema: labResultSchema,
  requiredPermission: PERMISSIONS.LAB_RESULT,
  handler: async (data, ctx) => {
    const result = await prisma.$transaction(async (tx) => {
      // Create the result
      const labResult = await tx.labResult.create({
        data: {
          requestId: data.requestId,
          findings: data.findings,
          enteredBy: ctx.userId,
        },
      });

      // Update the request status
      await tx.labRequest.update({
        where: { id: data.requestId },
        data: { status: "completed" },
      });

      return labResult;
    });

    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.LAB_RESULT,
      resourceId: result.id,
      newValue: { requestId: data.requestId },
    });

    revalidatePath(`/laboratory`);
    return result;
  },
});

export const createPrescription = createSafeAction({
  schema: prescriptionCreateSchema,
  requiredPermission: PERMISSIONS.PRESCRIPTION_CREATE,
  handler: async (data, ctx) => {
    const rx = await prisma.prescription.create({
      data: {
        patientId: data.patientId,
        doctorId: ctx.userId,
        items: {
          create: data.items.map(item => ({
            drugId: item.drugId,
            quantity: item.quantity,
            instructions: item.instructions,
          }))
        }
      },
    });

    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.PRESCRIPTION_CREATE,
      resourceId: rx.id,
      newValue: { itemsCount: data.items.length },
    });

    revalidatePath(`/patients/${data.patientId}`);
    revalidatePath("/pharmacy");
    return rx;
  }
});

export const updateVisitStatus = createSafeAction({
  schema: visitUpdateSchema,
  requiredPermission: PERMISSIONS.VISIT_UPDATE,
  handler: async (data, ctx) => {
    const visit = await prisma.visit.update({
      where: { id: data.visitId },
      data: { status: data.status },
    });

    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.VISIT_UPDATE,
      resourceId: visit.id,
      newValue: { status: data.status },
    });

    revalidatePath("/visits");
    return visit;
  }
});
