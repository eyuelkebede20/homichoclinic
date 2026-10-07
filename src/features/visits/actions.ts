"use server";

import { createSafeAction } from "@/lib/safe-action";
import { z } from "zod";
import { PERMISSIONS, ROLE_PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const admitSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  opdRoom: z.number().min(1, "OPD Room must be selected"),
});

export const admitPatient = createSafeAction({
  schema: admitSchema,
  requiredPermission: PERMISSIONS.PATIENT_CREATE, // Assuming reception has this
  handler: async (data, ctx) => {
    // 1. Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
    });

    if (!patient) {
      throw new Error("Patient not found.");
    }

    // 2. Check if they already have an active visit (optional, but good practice)
    const existingVisit = await prisma.visit.findFirst({
      where: {
        patientId: data.patientId,
        status: {
          in: ["scheduled", "in_progress"]
        }
      }
    });

    if (existingVisit) {
      throw new Error(`Patient already has an active visit in OPD ${existingVisit.opdRoom || "Unknown"}`);
    }

    // 3. Create the visit
    const visit = await prisma.visit.create({
      data: {
        patientId: data.patientId,
        opdRoom: data.opdRoom,
        status: "scheduled",
      }
    });

    revalidatePath("/patients");
    revalidatePath("/dashboard");
    
    return visit;
  }
});
