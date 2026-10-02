"use server";

import { z } from "zod";
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
    let assignedRoom = 1;

    // If a doctor is selected, try to get their active OPD room
    if (data.doctorId) {
      const doc = await prisma.user.findUnique({ where: { id: data.doctorId } });
      if (doc?.currentOpdRoom) {
        assignedRoom = doc.currentOpdRoom;
      }
    } else {
      // True Load Balancing: Assign to the active OPD room with the fewest queued patients
      const opdSetting = await prisma.systemSetting.findUnique({ where: { key: "activeOpdRooms" } });
      const opdRoomCount = parseInt(opdSetting?.value || "1", 10) || 1;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get count of currently waiting/in-progress patients per room
      const activeVisits = await prisma.visit.groupBy({
        by: ['opdRoom'],
        where: {
          visitDate: { gte: today },
          status: { in: ["scheduled", "in_progress"] },
          opdRoom: { not: null, lte: opdRoomCount }
        },
        _count: { id: true }
      });

      // Initialize queue depth for all valid rooms (1 to opdRoomCount) to 0
      const roomLoads = Array.from({ length: opdRoomCount }, (_, i) => ({ room: i + 1, count: 0 }));
      
      // Populate actual queue depths
      for (const v of activeVisits) {
        if (v.opdRoom) {
          const idx = v.opdRoom - 1;
          if (idx >= 0 && idx < opdRoomCount) {
            roomLoads[idx].count = v._count.id;
          }
        }
      }
      
      // Sort rooms by count (ascending) to find the least busy one
      roomLoads.sort((a, b) => a.count - b.count);
      
      assignedRoom = roomLoads[0].room;
    }

    const visit = await prisma.visit.create({
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        notes: data.notes,
        status: data.status,
        opdRoom: assignedRoom,
        visitDate: data.visitDate ? new Date(data.visitDate) : new Date(),
      },
    });

    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.VISIT_CREATE,
      resourceId: visit.id,
      newValue: { patientId: visit.patientId, opdRoom: assignedRoom },
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

export const saveOpdCount = createSafeAction({
  schema: z.object({ count: z.string() }),
  requiredPermission: PERMISSIONS.VISIT_CREATE, // Receptionist needs this
  handler: async (data, _ctx) => {
    const setting = await prisma.systemSetting.upsert({
      where: { key: "activeOpdRooms" },
      update: { value: data.count },
      create: { key: "activeOpdRooms", value: data.count }
    });
    
    revalidatePath("/visits");
    return setting;
  }
});

export const updateDoctorOpd = createSafeAction({
  schema: z.object({ room: z.number().nullable() }),
  requiredPermission: PERMISSIONS.VISIT_READ,
  handler: async (data, ctx) => {
    const user = await prisma.user.update({
      where: { id: ctx.userId },
      data: { currentOpdRoom: data.room },
    });
    return user;
  }
});

export const cancelLabRequest = createSafeAction({
  schema: z.object({ requestId: z.string() }),
  requiredPermission: PERMISSIONS.LAB_REQUEST,
  handler: async (data, ctx) => {
    const req = await prisma.labRequest.findUnique({ where: { id: data.requestId } });
    if (!req) throw new Error("Lab request not found");
    if (req.status === "completed") throw new Error("Cannot cancel a completed lab request");

    const updated = await prisma.labRequest.update({
      where: { id: data.requestId },
      data: { status: "cancelled" }
    });

    await logAudit({
      actorId: ctx.userId,
      action: "CANCEL_LAB_REQUEST",
      resourceId: updated.id,
      newValue: { status: "cancelled" },
    });

    revalidatePath("/laboratory");
    return updated;
  }
});


export const toggleAdmissionStatus = createSafeAction({
  schema: z.object({ patientId: z.string(), currentStatus: z.string() }),
  requiredPermission: PERMISSIONS.HISTORY_WRITE, // Doctors can do this
  handler: async (data, ctx) => {
    const newStatus = data.currentStatus === "Inpatient" ? "Outpatient" : "Inpatient";
    const pat = await prisma.patient.update({
      where: { id: data.patientId },
      data: { admissionStatus: newStatus }
    });
    
    await logAudit({ actorId: ctx.userId, action: "PATIENT_ADMISSION_TOGGLE", resourceId: pat.id, newValue: newStatus });
    revalidatePath(`/patients/${pat.id}`);
    return { status: pat.admissionStatus };
  }
});

export const addClinicalNote = createSafeAction({
  schema: z.object({ patientId: z.string(), content: z.string() }),
  requiredPermission: PERMISSIONS.HISTORY_WRITE,
  handler: async (data, ctx) => {
    const record = await prisma.medicalRecord.create({
      data: {
        patientId: data.patientId,
        content: data.content,
        source: "system",
        enteredById: ctx.userId
      }
    });
    await logAudit({ actorId: ctx.userId, action: "CLINICAL_NOTE_ADD", resourceId: record.id });
    revalidatePath(`/patients/${data.patientId}`);
    return record;
  }
});
