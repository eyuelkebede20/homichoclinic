"use server";

import { z } from "zod";
import { createSafeAction } from "@/lib/safe-action";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { visitCreateSchema, visitUpdateSchema, medicalRecordCreateSchema, labRequestSchema, labResultSchema, prescriptionCreateSchema, vitalsUpdateSchema } from "./schemas";
import { revalidatePath } from "next/cache";
import { getStartOfDayLocal, parseEthiopianDateString, ethiopianToGregorian } from "@/lib/date-utils";
import { isHematologyTest, isStoolTest, isUrineTest } from "./types/lab-panels";
import { ClinicDisease, DEFAULT_CLINIC_DISEASES, DEFAULT_MOST_PICKED_DISEASES, getSuggestedMedicinesForDisease } from "./types/diseases";

/**
 * Automatically resets active visits in OPD queue that have reached 1 day (>= 24 hours or past 1 day).
 * Resets opdRoom to null, marks status as cancelled, and frees the patient.
 */
export async function autoResetExpiredOpdVisits(patientId?: string) {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const startOfToday = getStartOfDayLocal();

  const staleWhere: any = {
    status: { in: ["scheduled", "in_progress"] },
    OR: [
      { visitDate: { lt: startOfToday } },
      { visitDate: { lte: oneDayAgo } },
      { createdAt: { lte: oneDayAgo } },
    ],
  };

  if (patientId) {
    staleWhere.patientId = patientId;
  }

  const result = await prisma.visit.updateMany({
    where: staleWhere,
    data: {
      opdRoom: null, // Reset to null as requested
      status: "cancelled",
      notes: "Auto-reset: 1-day OPD timeout reached (reset to null)",
    },
  });

  return result.count;
}

export const createVisit = createSafeAction({
  schema: visitCreateSchema,
  requiredPermission: PERMISSIONS.VISIT_CREATE,
  handler: async (data, ctx) => {
    // 1. Auto-reset any stale visits for this patient that reached 1 day (reset to null)
    await autoResetExpiredOpdVisits(data.patientId);

    const today = getStartOfDayLocal();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 2. Prevent multiple active visits for the same patient today (< 1 day old)
    const existingActiveVisit = await prisma.visit.findFirst({
      where: {
        patientId: data.patientId,
        status: { in: ["scheduled", "in_progress"] },
        opdRoom: { not: null },
        visitDate: { gte: today, gt: oneDayAgo },
      },
    });

    if (existingActiveVisit) {
      throw new Error(`This patient is already currently admitted in today's queue (OPD ${existingActiveVisit.opdRoom || 1}). Complete or deactivate their active visit first.`);
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
    revalidatePath("/dashboard");
    revalidatePath("/patients");
    revalidatePath("/visits");
    return visit;
  },
});

export const createMedicalRecord = createSafeAction({
  schema: medicalRecordCreateSchema,
  requiredPermission: PERMISSIONS.HISTORY_WRITE,
  handler: async (data, ctx) => {
    let originalDate: Date | null = null;
    if (data.originalDate) {
      const parsedEth = parseEthiopianDateString(data.originalDate);
      if (parsedEth) {
        originalDate = ethiopianToGregorian(parsedEth.year, parsedEth.month, parsedEth.day);
      } else {
        const d = new Date(data.originalDate);
        if (!isNaN(d.getTime())) originalDate = d;
      }
    }

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

    // 1. Fetch all selected tests
    const selectedTests = await prisma.labTest.findMany({
      where: { id: { in: data.testIds } },
    });

    const finalTestIds: string[] = [];

    // Helper: Group tests by panel
    const hematologyTests = selectedTests.filter(t => isHematologyTest(t.name));
    const stoolTests = selectedTests.filter(t => isStoolTest(t.name));
    const urineTests = selectedTests.filter(t => isUrineTest(t.name));
    const otherTests = selectedTests.filter(t => !isHematologyTest(t.name) && !isStoolTest(t.name) && !isUrineTest(t.name));

    // Handle Hematology: If sub-tests are chosen, combine into ONE request
    if (hematologyTests.length > 0) {
      const fullTest = hematologyTests.find(t => t.name.toLowerCase() === "hematology" || !t.name.includes("-"));
      if (fullTest) {
        finalTestIds.push(fullTest.id);
      } else {
        const subNames = hematologyTests.map(t => t.name.replace(/^Hematology\s*-\s*/i, "").trim());
        const combinedName = subNames.length === 1 ? `Hematology - ${subNames[0]}` : `Hematology (${subNames.join(", ")})`;
        const combinedPrice = hematologyTests.reduce((sum, t) => sum + t.price, 0);
        let testRec = await prisma.labTest.findFirst({
          where: { name: { equals: combinedName, mode: "insensitive" } },
        });
        if (!testRec) {
          testRec = await prisma.labTest.create({
            data: {
              name: combinedName,
              price: combinedPrice,
              description: `Combined Hematology sub-tests: ${subNames.join(", ")}`,
              isOperational: false,
            },
          });
        }
        finalTestIds.push(testRec.id);
      }
    }

    // Handle Stool: If sub-tests are chosen, combine into ONE request
    if (stoolTests.length > 0) {
      const fullTest = stoolTests.find(t => t.name.toLowerCase() === "stool examination" || !t.name.includes("-"));
      if (fullTest) {
        finalTestIds.push(fullTest.id);
      } else {
        const subNames = stoolTests.map(t => t.name.replace(/^Stool\s*-\s*/i, "").trim());
        const combinedName = subNames.length === 1 ? `Stool - ${subNames[0]}` : `Stool Examination (${subNames.join(", ")})`;
        const combinedPrice = stoolTests.reduce((sum, t) => sum + t.price, 0);
        let testRec = await prisma.labTest.findFirst({
          where: { name: { equals: combinedName, mode: "insensitive" } },
        });
        if (!testRec) {
          testRec = await prisma.labTest.create({
            data: {
              name: combinedName,
              price: combinedPrice,
              description: `Combined Stool sub-tests: ${subNames.join(", ")}`,
              isOperational: false,
            },
          });
        }
        finalTestIds.push(testRec.id);
      }
    }

    // Handle Urine: If sub-tests are chosen, combine into ONE request
    if (urineTests.length > 0) {
      const fullTest = urineTests.find(t => t.name.toLowerCase() === "urine examination" || !t.name.includes("-"));
      if (fullTest) {
        finalTestIds.push(fullTest.id);
      } else {
        const subNames = urineTests.map(t => t.name.replace(/^Urine\s*-\s*/i, "").trim());
        const combinedName = subNames.length === 1 ? `Urine - ${subNames[0]}` : `Urine Examination (${subNames.join(", ")})`;
        const combinedPrice = urineTests.reduce((sum, t) => sum + t.price, 0);
        let testRec = await prisma.labTest.findFirst({
          where: { name: { equals: combinedName, mode: "insensitive" } },
        });
        if (!testRec) {
          testRec = await prisma.labTest.create({
            data: {
              name: combinedName,
              price: combinedPrice,
              description: `Combined Urine sub-tests: ${subNames.join(", ")}`,
              isOperational: false,
            },
          });
        }
        finalTestIds.push(testRec.id);
      }
    }

    // Handle Other Tests
    for (const ot of otherTests) {
      finalTestIds.push(ot.id);
    }

    const requests = await prisma.labRequest.createManyAndReturn({
      data: finalTestIds.map(testId => ({
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
      newValue: { testCount: finalTestIds.length, isUrgent: !!data.isUrgent },
    });

    revalidatePath(`/patients/${data.patientId}`);
    revalidatePath(`/laboratory`);
    revalidatePath(`/dashboard`);
    return requests;
  },
});

export const submitLabResult = createSafeAction({
  schema: labResultSchema,
  requiredPermission: PERMISSIONS.LAB_RESULT,
  handler: async (data, ctx) => {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the primary result
      const labResult = await tx.labResult.create({
        data: {
          requestId: data.requestId,
          findings: data.findings,
          enteredBy: ctx.userId,
        },
      });

      // 2. Update the primary request status
      await tx.labRequest.update({
        where: { id: data.requestId },
        data: { status: "completed" },
      });

      // 3. If there are linked/grouped requests, complete them as well
      if (data.linkedRequestIds && data.linkedRequestIds.length > 0) {
        for (const linkedId of data.linkedRequestIds) {
          if (linkedId !== data.requestId) {
            const existingRes = await tx.labResult.findUnique({ where: { requestId: linkedId } });
            if (!existingRes) {
              await tx.labResult.create({
                data: {
                  requestId: linkedId,
                  findings: data.findings,
                  enteredBy: ctx.userId,
                },
              });
            }
            await tx.labRequest.update({
              where: { id: linkedId },
              data: { status: "completed" },
            });
          }
        }
      }

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
    revalidatePath(`/dashboard`);
    revalidatePath(`/patients`);
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
    revalidatePath("/dashboard");
    revalidatePath("/patients");
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

export async function getClinicDiseases(): Promise<ClinicDisease[]> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "clinicDiseasesList" },
    });
    if (setting?.value) {
      const parsed = JSON.parse(setting.value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((d: any) => ({
          ...d,
          recommendedMedicines: d.recommendedMedicines || getSuggestedMedicinesForDisease(d.name, d.category),
        }));
      }
    }
    const withMeds = DEFAULT_CLINIC_DISEASES.map((d) => ({
      ...d,
      recommendedMedicines: d.recommendedMedicines || getSuggestedMedicinesForDisease(d.name, d.category),
    }));
    await prisma.systemSetting.upsert({
      where: { key: "clinicDiseasesList" },
      update: { value: JSON.stringify(withMeds) },
      create: { key: "clinicDiseasesList", value: JSON.stringify(withMeds) },
    });
    return withMeds;
  } catch (err) {
    console.error("Error fetching clinic diseases:", err);
    return DEFAULT_CLINIC_DISEASES.map((d) => ({
      ...d,
      recommendedMedicines: d.recommendedMedicines || getSuggestedMedicinesForDisease(d.name, d.category),
    }));
  }
}

export type TopDiagnosedDisease = {
  id?: string;
  name: string;
  code?: string;
  category: string;
  amharic?: string;
  count: number;
  percentage?: number;
  recommendedMedicines?: string;
};

export async function getTopDiagnosedDiseases(limit: number = 20): Promise<TopDiagnosedDisease[]> {
  try {
    const [records, catalog] = await Promise.all([
      prisma.medicalRecord.findMany({
        where: {
          deletedAt: null,
          assessment: { not: null },
        },
        select: { assessment: true },
        take: 1000,
      }),
      getClinicDiseases(),
    ]);

    const counts = new Map<string, number>();
    let totalDiagnosesCount = 0;

    for (const r of records) {
      if (!r.assessment) continue;
      const diags = r.assessment.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
      for (const diag of diags) {
        // Clean off code prefix like "[A09] Acute Gastroenteritis" -> "Acute Gastroenteritis"
        const cleanName = diag.replace(/^\[[^\]]+\]\s*/, "").trim();
        if (cleanName.length < 2) continue;
        const key = cleanName.toLowerCase();
        counts.set(key, (counts.get(key) || 0) + 1);
        totalDiagnosesCount++;
      }
    }

    const scoredList: TopDiagnosedDisease[] = [];
    const usedNames = new Set<string>();

    for (const disease of catalog) {
      const c = counts.get(disease.name.toLowerCase()) || 0;
      if (c > 0) {
        scoredList.push({
          id: disease.id,
          name: disease.name,
          code: disease.code,
          category: disease.category,
          amharic: disease.amharic,
          count: c,
          percentage: totalDiagnosesCount > 0 ? Math.round((c / totalDiagnosesCount) * 1000) / 10 : 0,
          recommendedMedicines: disease.recommendedMedicines || getSuggestedMedicinesForDisease(disease.name, disease.category),
        });
        usedNames.add(disease.name.toLowerCase());
      }
    }

    scoredList.sort((a, b) => b.count - a.count);

    // If fewer than limit, supplement from default most picked primary care diseases
    if (scoredList.length < limit) {
      for (const common of DEFAULT_MOST_PICKED_DISEASES) {
        if (!usedNames.has(common.name.toLowerCase())) {
          scoredList.push({
            id: common.id,
            name: common.name,
            code: common.code,
            category: common.category,
            amharic: common.amharic,
            count: 0,
            percentage: 0,
            recommendedMedicines: common.recommendedMedicines || getSuggestedMedicinesForDisease(common.name, common.category),
          });
          usedNames.add(common.name.toLowerCase());
          if (scoredList.length >= limit) break;
        }
      }
    }

    return scoredList.slice(0, limit);
  } catch (err) {
    console.error("Error fetching top diagnosed diseases:", err);
    return DEFAULT_MOST_PICKED_DISEASES.map((d) => ({
      id: d.id,
      name: d.name,
      code: d.code,
      category: d.category,
      amharic: d.amharic,
      count: 0,
      percentage: 0,
      recommendedMedicines: d.recommendedMedicines || getSuggestedMedicinesForDisease(d.name, d.category),
    })).slice(0, limit);
  }
}

export type DiseaseMedicineProtocol = {
  diseaseId?: string;
  diseaseName: string;
  code?: string;
  category: string;
  amharic?: string;
  caseCount: number;
  percentage: number;
  recommendedMedicines: string;
  parsedMedicines: {
    rawText: string;
    genericName: string;
    dosageInstructions: string;
    inventoryDrug: {
      id: string;
      name: string;
      unit: string | null;
      price: number;
      amountInStock: number | null;
    } | null;
    estimatedRequiredUnits: number;
    stockStatus: "in_stock" | "low_stock" | "out_of_stock";
  }[];
};

export async function getTopDiseasesMedicineProtocols(limit: number = 10): Promise<DiseaseMedicineProtocol[]> {
  try {
    const [topDiseases, allDrugs] = await Promise.all([
      getTopDiagnosedDiseases(limit),
      prisma.drug.findMany({
        where: { deletedAt: null, isOperational: true },
        select: { id: true, name: true, unit: true, price: true, amountInStock: true },
      }),
    ]);

    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

    const protocols: DiseaseMedicineProtocol[] = topDiseases.map((dis) => {
      const recMeds = dis.recommendedMedicines || getSuggestedMedicinesForDisease(dis.name, dis.category);
      const rawItems = recMeds.split(/[;,]/).map((s) => s.trim()).filter(Boolean);

      const parsedMedicines = rawItems.map((item) => {
        const matchParens = item.match(/^(.*?)\s*\((.*?)\)$/);
        const genericName = matchParens ? matchParens[1].trim() : item.split(" - ")[0].trim();
        const dosageInstructions = matchParens ? matchParens[2].trim() : item.split(" - ")[1]?.trim() || "As directed by physician";

        const firstToken = genericName.split(" ")[0].toLowerCase();
        const matchedDrug = allDrugs.find((d) => {
          const dn = d.name.toLowerCase();
          return dn.includes(firstToken) || normalize(d.name).includes(normalize(firstToken));
        }) || null;

        const estUnitsPerCase = firstToken.includes("paracetamol") || firstToken.includes("ors") ? 10 : 21;
        const totalEstimatedUnits = Math.max(1, dis.count || 1) * estUnitsPerCase;

        let stockStatus: "in_stock" | "low_stock" | "out_of_stock" = "out_of_stock";
        if (matchedDrug && matchedDrug.amountInStock !== null) {
          if (matchedDrug.amountInStock <= 0) {
            stockStatus = "out_of_stock";
          } else if (matchedDrug.amountInStock < totalEstimatedUnits) {
            stockStatus = "low_stock";
          } else {
            stockStatus = "in_stock";
          }
        }

        return {
          rawText: item,
          genericName,
          dosageInstructions,
          inventoryDrug: matchedDrug,
          estimatedRequiredUnits: totalEstimatedUnits,
          stockStatus,
        };
      });

      return {
        diseaseId: dis.id,
        diseaseName: dis.name,
        code: dis.code,
        category: dis.category,
        amharic: dis.amharic,
        caseCount: dis.count,
        percentage: dis.percentage || 0,
        recommendedMedicines: recMeds,
        parsedMedicines,
      };
    });

    return protocols;
  } catch (err) {
    console.error("Error generating top diseases medicine protocols:", err);
    return [];
  }
}

export const addClinicDisease = createSafeAction({
  schema: z.object({
    name: z.string().min(2, "Disease name is required"),
    category: z.string().optional().default("General"),
    amharic: z.string().optional(),
    code: z.string().optional(),
    recommendedMedicines: z.string().optional(),
  }),
  requiredPermission: PERMISSIONS.HISTORY_WRITE,
  handler: async (data, ctx) => {
    const diseases = await getClinicDiseases();
    const trimmed = data.name.trim();

    const existing = diseases.find(
      (d) => d.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      return { disease: existing, diseases };
    }

    const newDisease: ClinicDisease = {
      id: `dis-${Date.now()}`,
      name: trimmed,
      category: data.category?.trim() || "General",
      amharic: data.amharic?.trim() || undefined,
      code: data.code?.trim() || undefined,
      recommendedMedicines: data.recommendedMedicines?.trim() || getSuggestedMedicinesForDisease(trimmed, data.category?.trim()),
    };

    const updated = [newDisease, ...diseases];

    await prisma.systemSetting.upsert({
      where: { key: "clinicDiseasesList" },
      update: { value: JSON.stringify(updated) },
      create: { key: "clinicDiseasesList", value: JSON.stringify(updated) },
    });

    await logAudit({
      actorId: ctx.userId,
      action: "CLINIC_DISEASE_ADD",
      resourceId: newDisease.id,
      newValue: newDisease,
    });

    return { disease: newDisease, diseases: updated };
  },
});

export const importDiseasesCSV = createSafeAction({
  schema: z.object({
    csvText: z.string(),
    mode: z.enum(["merge", "replace"]).optional().default("merge"),
  }),
  requiredPermission: PERMISSIONS.HISTORY_WRITE,
  handler: async (data, ctx) => {
    const rawLines = data.csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (rawLines.length === 0) {
      throw new Error("Uploaded file is empty.");
    }
    if (rawLines.length === 1) {
      throw new Error("Uploaded file contains headers but no disease records.");
    }

    // Auto-detect delimiter from first line (handles standard CSV, semicolon-delimited Excel, or tab TSV)
    const firstLine = rawLines[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semiCount = (firstLine.match(/;/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const delimiter = semiCount > commaCount && semiCount > tabCount ? ";" : (tabCount > commaCount ? "\t" : ",");

    // Helper to parse line with quote support and dynamic delimiter
    const parseLine = (text: string): string[] => {
      const parts: string[] = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
          if (inQuotes && text[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === delimiter && !inQuotes) {
          parts.push(cur.trim());
          cur = "";
        } else {
          cur += c;
        }
      }
      parts.push(cur.trim());
      return parts;
    };

    const headerParts = parseLine(rawLines[0]);
    const cleanHeader = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

    let codeIdx = -1;
    let nameIdx = -1;
    let catIdx = -1;
    let amhIdx = -1;
    let medIdx = -1;

    headerParts.forEach((h, idx) => {
      const cleaned = cleanHeader(h);
      if (
        cleaned === "diseasecode" ||
        cleaned === "code" ||
        cleaned === "icd" ||
        cleaned === "icd10" ||
        cleaned.includes("code") ||
        cleaned.includes("icd")
      ) {
        codeIdx = idx;
      } else if (
        cleaned === "diseasename" ||
        cleaned === "disease" ||
        cleaned === "name" ||
        cleaned === "diagnosis" ||
        cleaned.includes("disease") ||
        cleaned.includes("diagnosis") ||
        cleaned.includes("condition")
      ) {
        nameIdx = idx;
      } else if (
        cleaned === "category" ||
        cleaned === "type" ||
        cleaned === "group" ||
        cleaned.includes("categor") ||
        cleaned.includes("department")
      ) {
        catIdx = idx;
      } else if (
        cleaned === "amharic" ||
        cleaned === "amharicname" ||
        cleaned === "translation" ||
        cleaned === "amh" ||
        cleaned.includes("amharic") ||
        cleaned.includes("local") ||
        h.includes("የህመም")
      ) {
        amhIdx = idx;
      } else if (
        cleaned.includes("medicine") ||
        cleaned.includes("medication") ||
        cleaned.includes("drug") ||
        cleaned.includes("treatment") ||
        cleaned.includes("rx") ||
        h.includes("መድኃኒት")
      ) {
        medIdx = idx;
      }
    });

    // Fallbacks if header wasn't labeled strictly
    if (nameIdx === -1) {
      if (codeIdx === 0 && headerParts.length >= 2) {
        nameIdx = 1;
      } else if (codeIdx === 1) {
        nameIdx = 0;
      } else if (headerParts.length >= 2) {
        codeIdx = 0;
        nameIdx = 1;
        catIdx = headerParts.length > 2 ? 2 : -1;
        amhIdx = headerParts.length > 3 ? 3 : -1;
        medIdx = headerParts.length > 4 ? 4 : -1;
      } else {
        nameIdx = 0;
      }
    }
    if (codeIdx === -1 && nameIdx === 1) {
      codeIdx = 0;
    }

    const currentList = data.mode === "replace" ? [] : await getClinicDiseases();
    const workingList = [...currentList];
    let createdCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    for (let i = 1; i < rawLines.length; i++) {
      const line = rawLines[i];
      if (!line) continue;
      const cols = parseLine(line);
      const name = nameIdx !== -1 && cols[nameIdx] ? cols[nameIdx].replace(/^["']|["']$/g, "").trim() : "";
      const code = codeIdx !== -1 && cols[codeIdx] ? cols[codeIdx].replace(/^["']|["']$/g, "").trim() : undefined;
      const cat = catIdx !== -1 && cols[catIdx] ? cols[catIdx].replace(/^["']|["']$/g, "").trim() : "General";
      const amh = amhIdx !== -1 && cols[amhIdx] ? cols[amhIdx].replace(/^["']|["']$/g, "").trim() : undefined;
      const med = medIdx !== -1 && cols[medIdx] ? cols[medIdx].replace(/^["']|["']$/g, "").trim() : undefined;

      if (!name || name.length < 2) {
        continue;
      }

      const matchIdx = workingList.findIndex((item) => {
        if (code && item.code && item.code.toLowerCase() === code.toLowerCase()) return true;
        return item.name.toLowerCase() === name.toLowerCase();
      });

      if (matchIdx !== -1) {
        workingList[matchIdx] = {
          ...workingList[matchIdx],
          name: name || workingList[matchIdx].name,
          code: code || workingList[matchIdx].code,
          category: cat || workingList[matchIdx].category,
          amharic: amh || workingList[matchIdx].amharic,
          recommendedMedicines: med || workingList[matchIdx].recommendedMedicines || getSuggestedMedicinesForDisease(name, cat),
        };
        updatedCount++;
      } else {
        workingList.push({
          id: `dis-${Date.now()}-${i}`,
          name,
          code: code || undefined,
          category: cat || "General",
          amharic: amh || undefined,
          recommendedMedicines: med || getSuggestedMedicinesForDisease(name, cat),
        });
        createdCount++;
      }
    }

    if (createdCount === 0 && updatedCount === 0) {
      throw new Error("No valid disease entries could be parsed from the file. Please check column headers.");
    }

    await prisma.systemSetting.upsert({
      where: { key: "clinicDiseasesList" },
      update: { value: JSON.stringify(workingList) },
      create: { key: "clinicDiseasesList", value: JSON.stringify(workingList) },
    });

    await logAudit({
      actorId: ctx.userId,
      action: "CLINIC_DISEASE_IMPORT",
      newValue: { created: createdCount, updated: updatedCount, total: workingList.length, mode: data.mode },
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { created: createdCount, updated: updatedCount, total: workingList.length, errors };
  },
});

export const deleteClinicDisease = createSafeAction({
  schema: z.object({ id: z.string() }),
  requiredPermission: PERMISSIONS.HISTORY_WRITE,
  handler: async (data, ctx) => {
    const list = await getClinicDiseases();
    const filtered = list.filter((d) => d.id !== data.id);
    await prisma.systemSetting.upsert({
      where: { key: "clinicDiseasesList" },
      update: { value: JSON.stringify(filtered) },
      create: { key: "clinicDiseasesList", value: JSON.stringify(filtered) },
    });
    await logAudit({
      actorId: ctx.userId,
      action: "CLINIC_DISEASE_DELETE",
      resourceId: data.id,
    });
    revalidatePath("/admin");
    return { success: true, remaining: filtered.length };
  },
});

export const resetClinicDiseasesToDefault = createSafeAction({
  schema: z.object({}).optional(),
  requiredPermission: PERMISSIONS.HISTORY_WRITE,
  handler: async (_data, ctx) => {
    await prisma.systemSetting.upsert({
      where: { key: "clinicDiseasesList" },
      update: { value: JSON.stringify(DEFAULT_CLINIC_DISEASES) },
      create: { key: "clinicDiseasesList", value: JSON.stringify(DEFAULT_CLINIC_DISEASES) },
    });
    await logAudit({
      actorId: ctx.userId,
      action: "CLINIC_DISEASE_RESET",
      newValue: { count: DEFAULT_CLINIC_DISEASES.length },
    });
    revalidatePath("/admin");
    return { success: true, count: DEFAULT_CLINIC_DISEASES.length };
  },
});

export const clearClinicDiseases = createSafeAction({
  schema: z.object({}).optional(),
  requiredPermission: PERMISSIONS.HISTORY_WRITE,
  handler: async (_data, ctx) => {
    await prisma.systemSetting.upsert({
      where: { key: "clinicDiseasesList" },
      update: { value: JSON.stringify([]) },
      create: { key: "clinicDiseasesList", value: JSON.stringify([]) },
    });
    await logAudit({
      actorId: ctx.userId,
      action: "CLINIC_DISEASE_CLEAR",
    });
    revalidatePath("/admin");
    return { success: true, count: 0 };
  },
});

export const dismissLabResult = createSafeAction({
  schema: z.object({
    resultId: z.string(),
    finalDiagnosis: z.string().optional(),
    selectedDiseases: z.array(
      z.object({
        id: z.string().optional(),
        name: z.string(),
        code: z.string().optional(),
        category: z.string().optional(),
        amharic: z.string().optional(),
      })
    ).optional(),
    practitionerName: z.string().optional(),
    notes: z.string().optional(),
    completeVisit: z.boolean().optional(),
  }),
  requiredPermission: PERMISSIONS.HISTORY_WRITE,
  handler: async (data, ctx) => {
    const result = await prisma.labResult.update({
      where: { id: data.resultId },
      data: { isReadByDoctor: true },
      include: {
        request: {
          include: { patient: true, test: true },
        },
      },
    });

    let diag = data.finalDiagnosis?.trim() || "";
    if (data.selectedDiseases && data.selectedDiseases.length > 0) {
      diag = data.selectedDiseases
        .map((d) => (d.code ? `[${d.code}] ${d.name}` : d.name))
        .join("; ");
    }

    if (diag && result.request?.patientId) {
      const patientId = result.request.patientId;

      let practitioner = data.practitionerName?.trim();
      if (!practitioner) {
        const doc = await prisma.user.findUnique({
          where: { id: ctx.userId },
          select: { name: true, role: true },
        });
        practitioner = doc?.name ? (doc.name.startsWith("Dr.") ? doc.name : `Dr. ${doc.name}`) : "Attending Doctor";
      }

      await prisma.medicalRecord.create({
        data: {
          patientId,
          source: "system",
          bp: null,
          heartRate: null,
          temp: null,
          weight: null,
          subjective: `Post-investigation review: ${result.request.test?.name || "Lab Investigation"}`,
          objective: `Lab Findings: ${result.findings}`,
          assessment: diag,
          plan: data.notes?.trim() || "Confirmed upon doctor review of diagnostic findings.",
          content: `Diagnosed Generalized Diseases: ${diag}\nAttending Practitioner: ${practitioner}${data.notes?.trim() ? `\nClinical Notes: ${data.notes.trim()}` : ""}`,
          enteredById: ctx.userId,
        },
      });

      if (data.completeVisit !== false) {
        const today = getStartOfDayLocal();
        const activeVisit = await prisma.visit.findFirst({
          where: {
            patientId,
            status: { in: ["scheduled", "in_progress"] },
            visitDate: { gte: today },
            deletedAt: null,
          },
        });

        if (activeVisit) {
          await prisma.visit.update({
            where: { id: activeVisit.id },
            data: {
              status: "completed",
              notes: (activeVisit.notes ? activeVisit.notes + " | " : "") + `Final Diagnosis: ${diag} (Attending: ${practitioner})`,
            },
          });
        }
      }

      await logAudit({
        actorId: ctx.userId,
        action: "LAB_RESULT_REVIEWED_WITH_DIAGNOSIS",
        resourceId: result.id,
        newValue: { finalDiagnosis: diag, practitioner, notes: data.notes },
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/visits");
    revalidatePath("/admin/admitted-report");
    if (result.request?.patientId) {
      revalidatePath(`/patients/${result.request.patientId}`);
    }
    return result;
  },
});

export const completeVisitWithDiagnosis = createSafeAction({
  schema: z.object({
    visitId: z.string(),
    patientId: z.string(),
    finalDiagnosis: z.string().optional(),
    selectedDiseases: z.array(
      z.object({
        id: z.string().optional(),
        name: z.string(),
        code: z.string().optional(),
        category: z.string().optional(),
        amharic: z.string().optional(),
      })
    ).optional(),
    practitionerName: z.string().optional(),
    notes: z.string().optional(),
  }),
  requiredPermission: PERMISSIONS.VISIT_UPDATE,
  handler: async (data, ctx) => {
    let diag = data.finalDiagnosis?.trim() || "";
    if (data.selectedDiseases && data.selectedDiseases.length > 0) {
      diag = data.selectedDiseases
        .map((d) => (d.code ? `[${d.code}] ${d.name}` : d.name))
        .join("; ");
    }

    if (!diag) {
      throw new Error("At least one diagnosed generalized disease must be selected.");
    }

    let practitioner = data.practitionerName?.trim();
    if (!practitioner) {
      const doc = await prisma.user.findUnique({
        where: { id: ctx.userId },
        select: { name: true, role: true },
      });
      practitioner = doc?.name ? (doc.name.startsWith("Dr.") ? doc.name : `Dr. ${doc.name}`) : "Attending Doctor";
    }

    const existingVisit = await prisma.visit.findUnique({
      where: { id: data.visitId },
    });

    const visit = await prisma.visit.update({
      where: { id: data.visitId },
      data: {
        status: "completed",
        notes: (existingVisit?.notes ? existingVisit.notes + " | " : "") + `Final Diagnosis: ${diag} (Attending: ${practitioner})`,
      },
    });

    await prisma.medicalRecord.create({
      data: {
        patientId: data.patientId,
        source: "system",
        assessment: diag,
        plan: data.notes?.trim() || "Consultation concluded and marked completed.",
        content: `Diagnosed Generalized Diseases: ${diag}\nAttending Practitioner: ${practitioner}${data.notes?.trim() ? ` — Notes: ${data.notes.trim()}` : ""}`,
        enteredById: ctx.userId,
      },
    });

    await logAudit({
      actorId: ctx.userId,
      action: "VISIT_COMPLETED_WITH_DIAGNOSIS",
      resourceId: visit.id,
      newValue: { finalDiagnosis: diag, practitioner, notes: data.notes },
    });

    revalidatePath("/dashboard");
    revalidatePath("/visits");
    revalidatePath(`/patients/${data.patientId}`);
    revalidatePath("/admin/admitted-report");

    return visit;
  },
});

export const toggleLabResultReadStatus = createSafeAction({
  schema: z.object({ resultId: z.string(), isRead: z.boolean() }),
  requiredPermission: PERMISSIONS.HISTORY_WRITE,
  handler: async (data, ctx) => {
    const result = await prisma.labResult.update({
      where: { id: data.resultId },
      data: { isReadByDoctor: data.isRead },
      include: { request: true },
    });
    revalidatePath("/dashboard");
    if (result.request?.patientId) {
      revalidatePath(`/patients/${result.request.patientId}`);
    }
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

export const resetOpdQueue = createSafeAction({
  schema: z.object({
    opdRoom: z.number().optional().nullable(),
    clearWaitingToday: z.boolean().optional(),
  }),
  requiredPermission: PERMISSIONS.VISIT_CREATE,
  handler: async (data, ctx) => {
    const today = getStartOfDayLocal();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 1. Cancel ALL stale un-attended visits from past days (< today or >= 24h)
    const staleWhere: any = {
      status: { in: ["scheduled", "in_progress"] },
      OR: [
        { visitDate: { lt: today } },
        { visitDate: { lte: oneDayAgo } },
        { createdAt: { lte: oneDayAgo } },
      ],
    };
    if (data.opdRoom) {
      staleWhere.opdRoom = data.opdRoom;
    }

    const staleResult = await prisma.visit.updateMany({
      where: staleWhere,
      data: {
        opdRoom: null, // Reset to null as requested
        status: "cancelled",
        notes: "Cancelled via OPD queue reset (reset to null)",
      },
    });

    // 2. Optionally cancel today's waiting ('scheduled') visits if requested
    let todayResult = { count: 0 };
    if (data.clearWaitingToday) {
      const todayWhere: any = {
        status: "scheduled",
        visitDate: { gte: today },
      };
      if (data.opdRoom) {
        todayWhere.opdRoom = data.opdRoom;
      }
      todayResult = await prisma.visit.updateMany({
        where: todayWhere,
        data: {
          opdRoom: null, // Reset to null as requested
          status: "cancelled",
          notes: "Cancelled via OPD queue reset (cleared waiting queue to null)",
        },
      });
    }

    await logAudit({
      actorId: ctx.userId,
      action: "OPD_QUEUE_RESET",
      newValue: {
        staleCancelled: staleResult.count,
        todayCancelled: todayResult.count,
        opdRoom: data.opdRoom || "all",
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/patients");
    revalidatePath("/visits");

    return {
      staleCount: staleResult.count,
      todayCount: todayResult.count,
      totalCleared: staleResult.count + todayResult.count,
      opdRoom: data.opdRoom || null,
    };
  },
});

export const deactivatePatientOpd = createSafeAction({
  schema: z.object({
    patientId: z.string().min(1, "Patient ID is required"),
    visitId: z.string().optional(),
  }),
  requiredPermission: PERMISSIONS.VISIT_UPDATE,
  handler: async (data, ctx) => {
    const whereClause: any = {
      patientId: data.patientId,
      status: { in: ["scheduled", "in_progress"] },
    };
    if (data.visitId) {
      whereClause.id = data.visitId;
    }

    const updated = await prisma.visit.updateMany({
      where: whereClause,
      data: {
        opdRoom: null, // Reset to null as requested
        status: "cancelled",
        notes: "Manually deactivated from OPD queue (reset to null)",
      },
    });

    await logAudit({
      actorId: ctx.userId,
      action: "OPD_DEACTIVATE",
      newValue: { patientId: data.patientId, count: updated.count },
    });

    revalidatePath("/dashboard");
    revalidatePath("/patients");
    revalidatePath("/visits");
    revalidatePath(`/patients/${data.patientId}`);

    return { success: true, count: updated.count };
  },
});

export const enterLabResult = createSafeAction({
  schema: labResultSchema,
  requiredPermission: PERMISSIONS.LAB_RESULT,
  handler: async (data, ctx) => {
    // 1. Create the primary result
    const result = await prisma.labResult.create({
      data: {
        requestId: data.requestId,
        findings: data.findings,
        enteredBy: ctx.userId
      }
    });

    // 2. Mark primary request as completed
    const labReq = await prisma.labRequest.update({
      where: { id: data.requestId },
      data: { status: "completed" }
    });

    // 3. Mark linked requests as completed if any
    if (data.linkedRequestIds && data.linkedRequestIds.length > 0) {
      for (const linkedId of data.linkedRequestIds) {
        if (linkedId !== data.requestId) {
          const existingRes = await prisma.labResult.findUnique({ where: { requestId: linkedId } });
          if (!existingRes) {
            await prisma.labResult.create({
              data: {
                requestId: linkedId,
                findings: data.findings,
                enteredBy: ctx.userId,
              },
            });
          }
          await prisma.labRequest.update({
            where: { id: linkedId },
            data: { status: "completed" },
          });
        }
      }
    }

    const { autoBillUnbilledItems } = await import("@/features/dataencoder/actions");
    await autoBillUnbilledItems(labReq.patientId, ctx.userId);

    revalidatePath("/dashboard");
    revalidatePath("/laboratory");
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
