"use server";

import { createSafeAction } from "@/lib/safe-action";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { receiveStockSchema, dispensePrescriptionSchema } from "./schemas";
import { revalidatePath } from "next/cache";
import { parseEthiopianDateString, ethiopianToGregorian } from "@/lib/date-utils";

export const receiveStock = createSafeAction({
  schema: receiveStockSchema,
  requiredPermission: PERMISSIONS.INVENTORY_ADJUST,
  handler: async (data, ctx) => {
    let expiryDate: Date;
    const parsedExp = parseEthiopianDateString(data.expiryDate);
    if (parsedExp) {
      expiryDate = ethiopianToGregorian(parsedExp.year, parsedExp.month, parsedExp.day);
    } else {
      expiryDate = new Date(data.expiryDate);
    }

    let dateAddedToStock: Date | undefined;
    if (data.dateAddedToStock) {
      const parsedAdded = parseEthiopianDateString(data.dateAddedToStock);
      if (parsedAdded) {
        dateAddedToStock = ethiopianToGregorian(parsedAdded.year, parsedAdded.month, parsedAdded.day);
      } else {
        dateAddedToStock = new Date(data.dateAddedToStock);
      }
    }

    const batch = await prisma.$transaction(async (tx) => {
      const newBatch = await tx.stockBatch.create({
        data: {
          drugId: data.drugId,
          batchNumber: data.batchNumber,
          expiryDate: expiryDate,
          quantity: data.quantity,
          cost: data.cost,
          dateAddedToStock: dateAddedToStock,
          docNo: data.docNo,
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

    const { autoBillUnbilledItems } = await import("@/features/dataencoder/actions");
    await autoBillUnbilledItems(result.patientId, ctx.userId);

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

export const updateTemporaryDrugStock = createSafeAction({
  schema: z.object({
    drugId: z.string(),
    currentStock: z.number().int().min(0).nullable(),
    initialStock: z.number().int().min(0).nullable().optional(),
  }),
  requiredPermission: PERMISSIONS.INVENTORY_ADJUST,
  handler: async (data, ctx) => {
    const existing = await prisma.drug.findUnique({
      where: { id: data.drugId },
      include: { batches: { orderBy: { createdAt: "desc" } } },
    });
    if (!existing) throw new Error("Drug not found");

    const updateData: {
      amountInStock: number | null;
      initialStock?: number | null;
    } = {
      amountInStock: data.currentStock,
    };

    if (data.initialStock !== undefined) {
      updateData.initialStock = data.initialStock;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const drug = await tx.drug.update({
        where: { id: data.drugId },
        data: updateData,
      });

      // Synchronize physical in-stock batches with current stock
      if (data.currentStock !== null) {
        if (data.currentStock === 0) {
          // Zero out active batches
          await tx.stockBatch.updateMany({
            where: { drugId: data.drugId },
            data: { quantity: 0 },
          });
        } else {
          // currentStock > 0
          if (existing.batches.length > 0) {
            // Update the latest batch to reflect the counted stock, and clear older depleted batches
            const latestBatch = existing.batches[0];
            await tx.stockBatch.update({
              where: { id: latestBatch.id },
              data: { quantity: data.currentStock },
            });
            if (existing.batches.length > 1) {
              const olderBatchIds = existing.batches.slice(1).map((b) => b.id);
              await tx.stockBatch.updateMany({
                where: { id: { in: olderBatchIds } },
                data: { quantity: 0 },
              });
            }
          } else {
            // No batch exists yet: auto-create active stock batch for dispensing & inventory tracking
            const defaultExpiry = new Date();
            defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 2);
            await tx.stockBatch.create({
              data: {
                drugId: data.drugId,
                batchNumber: `HAMLE-${new Date().getFullYear()}`,
                quantity: data.currentStock,
                cost: existing.price || 0,
                expiryDate: defaultExpiry,
                dateAddedToStock: new Date(),
                docNo: "HAMLE-PHYSICAL-COUNT",
              },
            });
          }
        }
      }

      return drug;
    });

    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.INVENTORY_ADJUST,
      resourceId: updated.id,
      newValue: {
        drugName: updated.name,
        amountInStock: updated.amountInStock,
        initialStock: updated.initialStock,
      },
    });

    revalidatePath("/pharmacy");
    revalidatePath("/pharmacy/catalog");
    revalidatePath("/catalogs");
    return updated;
  },
});

export const setDrugOutOfStock = createSafeAction({
  schema: z.object({
    drugId: z.string(),
  }),
  requiredPermission: PERMISSIONS.INVENTORY_ADJUST,
  handler: async (data, ctx) => {
    const existing = await prisma.drug.findUnique({
      where: { id: data.drugId },
    });
    if (!existing) throw new Error("Drug not found");

    const updated = await prisma.$transaction(async (tx) => {
      const drug = await tx.drug.update({
        where: { id: data.drugId },
        data: { amountInStock: 0 },
      });

      // Zero out all active batches
      await tx.stockBatch.updateMany({
        where: { drugId: data.drugId },
        data: { quantity: 0 },
      });

      return drug;
    });

    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.INVENTORY_ADJUST,
      resourceId: updated.id,
      newValue: {
        drugName: updated.name,
        amountInStock: 0,
        status: "out_of_stock",
      },
    });

    revalidatePath("/pharmacy");
    revalidatePath("/pharmacy/catalog");
    revalidatePath("/catalogs");
    return updated;
  },
});

