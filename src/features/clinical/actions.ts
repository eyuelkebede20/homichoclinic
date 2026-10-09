"use server";

import { z } from "zod";
import { createSafeAction } from "@/lib/safe-action";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { visitCreateSchema, visitUpdateSchema, medicalRecordCreateSchema, labRequestSchema, labResultSchema, prescriptionCreateSchema, vitalsUpdateSchema } from "./schemas";
import { revalidatePath } from "next/cache";
import { getStartOfDayLocal } from "@/lib/date-utils";

export const createVisit = createSafeAction({
  schema: visitCreateSchema,
  requiredPermission: PERMISSIONS.VISIT_CREATE,
  handler: async (data, ctx) => {
    // 1. Prevent multiple active visits for the same patient
    const existingActiveVisit = await prisma.visit.findFirst({
      where: {
        patientId: data.patientId,
        status: { in: ["scheduled", "in_progress"] }
      }
    });

    if (existingActiveVisit) {
      throw new Error("This patient is already currently admitted in the queue. Complete or cancel their active visit first.");
    }

    let assignedRoom = 1;

    // If a doctor is selected, try to get their active OPD room
    if (data.doctorId) {
      const doc = await prisma.user.findUnique({ where: { id: data.doctorId } });
      if (doc?.currentOpdRoom) {
        assignedRoom = doc.currentOpdRoom;
      }
    } else {
      // True Load Balancing: Assign to the active OPD room with the fewest queued patients
      const opdSettingList = await prisma.systemSetting.findUnique({ where: { key: "activeOpdRoomsList" } });
      let activeOpds = [1, 2, 3];
      if (opdSettingList && opdSettingList.value) {
        try { activeOpds = JSON.parse(opdSettingList.value); } catch(e) {}
      }
      if (activeOpds.length === 0) activeOpds = [1];

      const today = getStartOfDayLocal();

      // Get count of currently waiting/in-progress patients per room
      const activeVisits = await prisma.visit.groupBy({
        by: ['opdRoom'],
        where: {
          visitDate: { gte: today },
          status: { in: ["scheduled", "in_progress"] },
          opdRoom: { in: activeOpds }
        },
        _count: { id: true }
      });

      // Initialize queue depth for all valid rooms
      const roomLoads = activeOpds.map(room => ({ room, count: 0 }));
      
      // Populate actual queue depths
      for (const v of activeVisits) {
        if (v.opdRoom) {
          const idx = roomLoads.findIndex(r => r.room === v.opdRoom);
          if (idx >= 0) roomLoads[idx].count = v._count.id;
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
    const status = data.isUrgent ? "urgent" : "requested";
    const requests = await prisma.labRequest.createManyAndReturn({
      data: data.testIds.map(testId => ({
        patientId: data.patientId,
        testId: testId,
        requestedBy: ctx.userId,
        status: status,
      })),
    });

    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.LAB_REQUEST,
      resourceId: data.patientId,
      newValue: { testCount: data.testIds.length, isUrgent: !!data.isUrgent },
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

    const labReq = await prisma.labRequest.findUnique({ where: { id: data.requestId }});
    if (labReq) {
      const { autoBillUnbilledItems } = await import("@/features/dataencoder/actions");
      await autoBillUnbilledItems(labReq.patientId, ctx.userId);
    }

    revalidatePath(`/laboratory`);
    return result;
  },
});

export const createPrescription = createSafeAction({
  schema: prescriptionCreateSchema,
  requiredPermission: PERMISSIONS.PRESCRIPTION_CREATE,
  handler: async (data, ctx) => {
    for (const item of data.items) {
      const drug = await prisma.drug.findUnique({
        where: { id: item.drugId },
        include: { batches: true }
      });
      if (!drug) {
        throw new Error(`Drug not found.`);
      }
      const totalStock = drug.batches.reduce((sum, b) => sum + b.quantity, 0);
      if (totalStock < item.quantity) {
        throw new Error(`Insufficient stock for ${drug.name}. Available: ${totalStock}, Requested: ${item.quantity}.`);
      }
    }

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
  handler: async (data, ctx) => {
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
    revalidatePath("/", "layout"); 
    return user;
  }
});



export const toggleAdmissionStatus = createSafeAction({
  schema: z.object({ patientId: z.string(), currentStatus: z.string().nullable().optional() }),
  requiredPermission: PERMISSIONS.HISTORY_WRITE, // Doctors can do this
  handler: async (data, ctx) => {
    const current = data.currentStatus || "Outpatient";
    const newStatus = current === "Inpatient" ? "Outpatient" : "Inpatient";
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
  schema: z.object({ 
    patientId: z.string(), 
    content: z.string().optional().default("SOAP Entry"),
    bp: z.string().nullable().optional(),
    heartRate: z.coerce.number().nullable().optional(),
    temp: z.coerce.number().nullable().optional(),
    weight: z.coerce.number().nullable().optional(),
    subjective: z.string().nullable().optional(),
    objective: z.string().nullable().optional(),
    assessment: z.string().nullable().optional(),
    plan: z.string().nullable().optional(),
  }),
  requiredPermission: PERMISSIONS.HISTORY_WRITE,
  handler: async (data, ctx) => {
    const record = await prisma.medicalRecord.create({
      data: {
        patientId: data.patientId,
        content: data.content || "SOAP Entry",
        bp: data.bp || null,
        heartRate: data.heartRate || null,
        temp: data.temp || null,
        weight: data.weight || null,
        subjective: data.subjective || null,
        objective: data.objective || null,
        assessment: data.assessment || null,
        plan: data.plan || null,
        source: "system",
        enteredById: ctx.userId
      }
    });
    await logAudit({ actorId: ctx.userId, action: "CLINICAL_NOTE_ADD", resourceId: record.id });
    revalidatePath(`/patients/${data.patientId}`);
    return record;
  }
});

export const dismissLabResult = createSafeAction({
  schema: z.object({ resultId: z.string() }),
  requiredPermission: PERMISSIONS.HISTORY_WRITE,
  handler: async (data, ctx) => {
    const result = await prisma.labResult.update({
      where: { id: data.resultId },
      data: { isReadByDoctor: true }
    });
    revalidatePath("/dashboard");
    return result;
  }
});
export const updateVisitVitals = createSafeAction({
  schema: vitalsUpdateSchema,
  requiredPermission: PERMISSIONS.VISIT_UPDATE,
  handler: async (data, ctx) => {
    const visit = await prisma.visit.update({
      where: { id: data.visitId },
      data: { vitals: data.vitals as any },
    });
    revalidatePath("/dashboard");
    return visit;
  }
});
export const toggleOpdRoom = createSafeAction({
  schema: z.object({ rooms: z.array(z.number()) }),
  requiredPermission: PERMISSIONS.VISIT_CREATE, // Receptionist needs this
  handler: async (data, ctx) => {
    const setting = await prisma.systemSetting.upsert({
      where: { key: "activeOpdRoomsList" },
      update: { value: JSON.stringify(data.rooms) },
      create: { key: "activeOpdRoomsList", value: JSON.stringify(data.rooms) }
    });
    revalidatePath("/dashboard");
    return setting;
  }
});
export const enterLabResult = createSafeAction({
  schema: labResultSchema,
  requiredPermission: PERMISSIONS.LAB_RESULT,
  handler: async (data, ctx) => {
    // 1. Create the result
    const result = await prisma.labResult.create({
      data: {
        requestId: data.requestId,
        findings: data.findings,
        enteredBy: ctx.userId
      }
    });

    // 2. Mark request as completed
    const labReq = await prisma.labRequest.update({
      where: { id: data.requestId },
      data: { status: "completed" }
    });

    const { autoBillUnbilledItems } = await import("@/features/dataencoder/actions");
    await autoBillUnbilledItems(labReq.patientId, ctx.userId);

    revalidatePath("/dashboard");
    revalidatePath("/patients");
    return result;
  }
});
export const dispensePrescription = createSafeAction({
  schema: z.object({ prescriptionId: z.string().min(1) }),
  requiredPermission: PERMISSIONS.PRESCRIPTION_DISPENSE, // Or DISPENSE if exists
  handler: async (data, ctx) => {
    // We should use a transaction to deduct stock (FEFO)
    const prescription = await prisma.prescription.findUnique({
      where: { id: data.prescriptionId },
      include: { items: true }
    });

    if (!prescription || prescription.status === "dispensed") {
      throw new Error("Prescription not found or already dispensed");
    }

    await prisma.$transaction(async (tx) => {
      for (const item of prescription.items) {
        let remainingToDeduct = item.quantity;
        
        // Find batches ordered by expiryDate ascending (FEFO)
        const batches = await tx.stockBatch.findMany({
          where: { drugId: item.drugId, quantity: { gt: 0 } },
          orderBy: { expiryDate: "asc" }
        });

        for (const batch of batches) {
          if (remainingToDeduct <= 0) break;

          const toDeduct = Math.min(batch.quantity, remainingToDeduct);
          
          await tx.stockBatch.update({
            where: { id: batch.id },
            data: { quantity: batch.quantity - toDeduct }
          });

          await tx.stockMovement.create({
            data: {
              batchId: batch.id,
              type: "dispense",
              quantity: -toDeduct,
              reason: "Prescription " + prescription.id,
              actorId: ctx.userId
            }
          });

          remainingToDeduct -= toDeduct;
        }

        if (remainingToDeduct > 0) {
          throw new Error("Insufficient stock for drug ID " + item.drugId);
        }
      }

      await tx.prescription.update({
        where: { id: prescription.id },
        data: { status: "dispensed" }
      });
    });

    const { autoBillUnbilledItems } = await import("@/features/dataencoder/actions");
    await autoBillUnbilledItems(prescription.patientId, ctx.userId);

    revalidatePath("/dashboard");
    return { success: true };
  }
});
export const generateCreditCharge = createSafeAction({
  schema: z.object({ visitId: z.string().min(1) }),
  requiredPermission: PERMISSIONS.VISIT_READ, // Or INVOICE_CREATE
  handler: async (data, ctx) => {
    // 1. Get Visit with related items to bill
    const visit = await prisma.visit.findUnique({
      where: { id: data.visitId },
      include: {
        patient: true,
        
      }
    });
    
    if (!visit || visit.invoiceId) {
      throw new Error("Visit not found or already billed");
    }

    // Also get prescriptions made today for this patient (since prescriptions don't link strictly to visit directly)
    const today = getStartOfDayLocal();
    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: visit.patientId, createdAt: { gte: today }, status: "dispensed" },
      include: { items: { include: { drug: true } } }
    });

    const items: { description: string, quantity: number, unitPrice: number, isDiscountable: boolean }[] = [];

    // Consultation Fee
    items.push({ description: "Consultation Fee", quantity: 1, unitPrice: 15000, isDiscountable: true });

    // Lab Tests
    const labRequests = await prisma.labRequest.findMany({
        where: { patientId: visit.patientId, createdAt: { gte: today }, invoiceId: null },
        include: { test: true }
      });
      for (const req of labRequests) {
      if (req.test) {
        items.push({ description: "Lab: " + req.test.name, quantity: 1, unitPrice: req.test.price, isDiscountable: true });
      }
    }

    // Drugs
    for (const p of prescriptions) {
      for (const item of p.items) {
        if (item.drug) {
          // Check if it already has an invoiceId? Usually one per day
          items.push({ description: "Drug: " + item.drug.name, quantity: item.quantity, unitPrice: item.drug.price, isDiscountable: true });
        }
      }
    }

    const discountPercent = visit.patient.discountPercent || 0;
    
    let subtotal = 0;
    let total = 0;

    for (const item of items) {
      const lineTotal = item.quantity * item.unitPrice;
      subtotal += lineTotal;
      if (item.isDiscountable && discountPercent > 0) {
        total += Math.round(lineTotal * (1 - discountPercent / 100));
      } else {
        total += lineTotal;
      }
    }

    await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          patientId: visit.patientId,
          discountPercentApplied: discountPercent,
          subtotal,
          total,
          status: "sent_to_finance", // Sent directly to finance
          items: {
            create: items
          }
        }
      });

      await tx.visit.update({
        where: { id: visit.id },
        data: { invoiceId: invoice.id }
      });
      
      // Update requests
      await tx.labRequest.updateMany({
        where: { id: { in: labRequests.map(r => r.id) } },
        data: { invoiceId: invoice.id }
      });

      // Update prescription items
      const pItemIds = prescriptions.flatMap(p => p.items.map(i => i.id));
      if (pItemIds.length > 0) {
        await tx.prescriptionItem.updateMany({
          where: { id: { in: pItemIds } },
          data: { invoiceId: invoice.id }
        });
      }
    });

    revalidatePath("/dashboard");
    return { success: true };
  }
});


export const undoDenyVisitBilling = createSafeAction({
  schema: z.object({ visitId: z.string() }),
  requiredPermission: PERMISSIONS.VISIT_UPDATE,
  handler: async (data, ctx) => {
    const visit = await prisma.visit.update({
      where: { id: data.visitId },
      data: { status: "scheduled" },
    });
    revalidatePath("/billing");
    revalidatePath("/visits");
    return visit;
  },
});





const referralSchema = z.object({
  patientId: z.string(),
  type: z.string(),
  destination: z.string(),
  reason: z.string()
});

export const saveReferral = createSafeAction({
  schema: referralSchema,
  requiredPermission: PERMISSIONS.HISTORY_WRITE,
  handler: async (data, ctx) => {
    let dests: string[] = [];
    const setting = await prisma.systemSetting.findUnique({ where: { key: "referral_destinations" } });
    if (setting) {
      try { dests = JSON.parse(setting.value); } catch(e) {}
    }
    
    if (!dests.includes(data.destination.trim()) && data.destination.trim() !== "") {
      dests.push(data.destination.trim());
      await prisma.systemSetting.upsert({
        where: { key: "referral_destinations" },
        update: { value: JSON.stringify(dests) },
        create: { key: "referral_destinations", value: JSON.stringify(dests) }
      });
    }

    const record = await prisma.medicalRecord.create({
      data: {
        patientId: data.patientId,
        enteredById: ctx.userId,
        content: `REFERRAL ISSUED\nType: ${data.type}\nDestination: ${data.destination}\nReason/Findings: ${data.reason}`,
      }
    });

    await logAudit({
      actorId: ctx.userId,
      action: "referral:create",
      resourceId: record.id,
      newValue: { destination: data.destination, type: data.type }
    });

    revalidatePath(`/patients/${data.patientId}`);
    return record;
  }
});
