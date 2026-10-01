"use server";

import { createSafeAction } from "@/lib/safe-action";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { receiveStockSchema, dispensePrescriptionSchema } from "./schemas";
import { revalidatePath } from "next/cache";

export const receiveStock = createSafeAction({
  schema: receiveStockSchema,
  requiredPermission: PERMISSIONS.INVENTORY_ADJUST,
  handler: async (data, ctx) => {
    const batch = await prisma.$transaction(async (tx) => {
      const newBatch = await tx.stockBatch.create({
        data: {
          drugId: data.drugId,
          batchNumber: data.batchNumber,
          expiryDate: new Date(data.expiryDate),
          quantity: data.quantity,
          cost: data.cost,
        },
      });

      // Record the movement
      await tx.stockMovement.create({
        data: {
          batchId: newBatch.id,
          type: "receive",
          quantity: data.quantity,
          reason: "Initial stock receipt",
          actorId: ctx.userId,
        },
      });

      return newBatch;
    });

    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.INVENTORY_ADJUST,
      resourceId: batch.id,
      newValue: { batchNumber: batch.batchNumber, quantity: batch.quantity },
    });

    revalidatePath("/pharmacy");
    return batch;
  },
});

export const dispensePrescription = createSafeAction({
  schema: dispensePrescriptionSchema,
  requiredPermission: PERMISSIONS.PRESCRIPTION_DISPENSE,
  handler: async (data, ctx) => {
    const result = await prisma.$transaction(async (tx) => {
      const prescription = await tx.prescription.findUnique({
        where: { id: data.prescriptionId },
        include: { items: true },
      });

      if (!prescription) throw new Error("Prescription not found");
      if (prescription.status === "dispensed") throw new Error("Already dispensed");

      for (const item of prescription.items) {
        let remainingToDispense = item.quantity;
        
        // FEFO: First Expiry, First Out
        const batches = await tx.stockBatch.findMany({
          where: { drugId: item.drugId, quantity: { gt: 0 } },
          orderBy: { expiryDate: "asc" },
        });

        const totalAvailable = batches.reduce((sum, b) => sum + b.quantity, 0);
        if (totalAvailable < remainingToDispense) {
          throw new Error(`Insufficient stock for drug ID ${item.drugId}`);
        }

        for (const batch of batches) {
          if (remainingToDispense <= 0) break;

          const deduct = Math.min(batch.quantity, remainingToDispense);
          remainingToDispense -= deduct;

          // Deduct from batch
          await tx.stockBatch.update({
            where: { id: batch.id },
            data: { quantity: batch.quantity - deduct },
          });

          // Record movement
          await tx.stockMovement.create({
            data: {
              batchId: batch.id,
              type: "dispense",
              quantity: -deduct,
              reason: `Prescription ${prescription.id}`,
              actorId: ctx.userId,
            },
          });
        }
      }

      // Mark prescription as dispensed
      const updatedPrescription = await tx.prescription.update({
        where: { id: data.prescriptionId },
        data: { status: "dispensed" },
      });

      return updatedPrescription;
    });

    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.PRESCRIPTION_DISPENSE,
      resourceId: result.id,
      newValue: { status: result.status },
    });

    revalidatePath("/pharmacy");
    return result;
  },
});

import { z } from "zod";

export const cancelPrescription = createSafeAction({
  schema: z.object({ prescriptionId: z.string() }),
  requiredPermission: PERMISSIONS.PRESCRIPTION_DISPENSE,
  handler: async (data, ctx) => {
    const rx = await prisma.prescription.findUnique({ where: { id: data.prescriptionId } });
    if (!rx) throw new Error("Prescription not found");
    if (rx.status === "dispensed") throw new Error("Cannot cancel a dispensed prescription");

    const updated = await prisma.prescription.update({
      where: { id: data.prescriptionId },
      data: { status: "cancelled" }
    });

    await logAudit({
      actorId: ctx.userId,
      action: "CANCEL_PRESCRIPTION",
      resourceId: updated.id,
      newValue: { status: "cancelled" },
    });

    revalidatePath("/pharmacy");
    return updated;
  }
});
