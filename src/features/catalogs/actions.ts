"use server";

import { z } from "zod";
import { createSafeAction } from "@/lib/safe-action";
import { PERMISSIONS, ROLE_PERMISSIONS, PermissionString } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { catalogCreateSchema, catalogUpdateSchema } from "./schemas";
import { revalidatePath } from "next/cache";
import { parseEthiopianDateString, ethiopianToGregorian } from "@/lib/date-utils";

async function hasApprovePermission(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return false;
  const perms = ROLE_PERMISSIONS[user.role || "User"] || [];
  return perms.includes(PERMISSIONS.CATALOG_APPROVE as PermissionString);
}

export const createDrug = createSafeAction({
  schema: catalogCreateSchema,
  requiredPermission: PERMISSIONS.CATALOG_REQUEST,
  handler: async (data, ctx) => {
    const canApprove = true;

    if (canApprove) {
      const initialStock =
        data.initialStock !== undefined && data.initialStock !== null
          ? data.initialStock
          : null;

      const drug = await prisma.drug.create({
        data: {
          name: data.name.trim(),
          description: data.description || null,
          category: data.category || null,
          unit: data.unit || null,
          price: data.price,
          isOperational: true,
          initialStock: initialStock,
          amountInStock: initialStock,
        },
      });

      const hasBatchInfo = Boolean(
        data.batchNumber?.trim() ||
        data.expiryDate?.trim() ||
        data.docNo?.trim() ||
        data.dateAddedToStock?.trim() ||
        (initialStock !== null && initialStock > 0)
      );

      if (hasBatchInfo) {
        let expiryDate: Date = new Date("2099-12-31");
        if (data.expiryDate && data.expiryDate.trim() !== "") {
          const parsedExp = parseEthiopianDateString(data.expiryDate);
          if (parsedExp) {
            expiryDate = ethiopianToGregorian(parsedExp.year, parsedExp.month, parsedExp.day);
          } else {
            const d = new Date(data.expiryDate);
            if (!isNaN(d.getTime())) expiryDate = d;
          }
        }

        let dateAddedToStock: Date = new Date();
        if (data.dateAddedToStock && data.dateAddedToStock.trim() !== "") {
          const parsedAdded = parseEthiopianDateString(data.dateAddedToStock);
          if (parsedAdded) {
            dateAddedToStock = ethiopianToGregorian(parsedAdded.year, parsedAdded.month, parsedAdded.day);
          } else {
            const d = new Date(data.dateAddedToStock);
            if (!isNaN(d.getTime())) dateAddedToStock = d;
          }
        }

        const batchQty = initialStock !== null ? initialStock : 0;
        const bNum = data.batchNumber?.trim() || `BATCH-${new Date().getFullYear()}`;

        const newBatch = await prisma.stockBatch.create({
          data: {
            drugId: drug.id,
            batchNumber: bNum,
            expiryDate: expiryDate,
            quantity: batchQty,
            cost: data.price,
            dateAddedToStock: dateAddedToStock,
            docNo: data.docNo?.trim() || "INITIAL-ENTRY",
          },
        });

        if (batchQty > 0) {
          await prisma.stockMovement.create({
            data: {
              batchId: newBatch.id,
              type: "receive",
              quantity: batchQty,
              reason: "Initial catalog entry",
              actorId: ctx.userId,
            },
          });
        }
      }

      await logAudit({
        actorId: ctx.userId,
        action: PERMISSIONS.CATALOG_APPROVE,
        resourceId: drug.id,
        newValue: JSON.stringify(drug),
        reason: "Directly created new drug in catalog with initial stock/batch",
      });

      revalidatePath("/pharmacy");
      revalidatePath("/pharmacy/catalog");
      revalidatePath("/catalogs");
      return drug;
    } else {
      // Create request
      await prisma.catalogChangeRequest.create({
        data: {
          type: "DRUG",
          action: "CREATE",
          requestedData: JSON.stringify(data),
          requestedById: ctx.userId,
        },
      });
      revalidatePath("/catalogs");
      return { success: "Approval request submitted." };
    }
  },
});

export const createLabTest = createSafeAction({
  schema: catalogCreateSchema,
  requiredPermission: PERMISSIONS.CATALOG_REQUEST,
  handler: async (data, ctx) => {
    const canApprove = true;

    if (canApprove) {
      const test = await prisma.labTest.create({
        data: {
          name: data.name.trim(),
          description: data.description || null,
          unit: data.unit || null,
          options: data.options || null,
          price: data.price,
          isOperational: true,
        },
      });
      await logAudit({
        actorId: ctx.userId,
        action: PERMISSIONS.CATALOG_APPROVE,
        resourceId: test.id,
        newValue: JSON.stringify(test),
        reason: "Directly created new lab test in catalog",
      });
      revalidatePath("/catalogs");
      revalidatePath("/laboratory/catalog");
      revalidatePath("/patients");
      return test;
    } else {
      await prisma.catalogChangeRequest.create({
        data: {
          type: "LAB_TEST",
          action: "CREATE",
          requestedData: JSON.stringify(data),
          requestedById: ctx.userId,
        },
      });
      revalidatePath("/catalogs");
      revalidatePath("/laboratory/catalog");
      revalidatePath("/patients");
      return { success: "Approval request submitted." };
    }
  },
});

export const updateDrug = createSafeAction({
  schema: catalogUpdateSchema,
  requiredPermission: PERMISSIONS.CATALOG_REQUEST,
  handler: async (data, ctx) => {
    const canApprove = true;

    if (canApprove) {
      const drug = await prisma.drug.update({
        where: { id: data.id },
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
          unit: data.unit,
          price: data.price,
          isOperational: true,
        },
      });

      if (data.batchNumber || data.expiryDate || data.dateAddedToStock || data.docNo) {
        let expiryDate: Date | undefined;
        if (data.expiryDate && data.expiryDate.trim() !== "") {
          const parsedExp = parseEthiopianDateString(data.expiryDate);
          if (parsedExp) {
            expiryDate = ethiopianToGregorian(parsedExp.year, parsedExp.month, parsedExp.day);
          } else {
            const d = new Date(data.expiryDate);
            if (!isNaN(d.getTime())) expiryDate = d;
          }
        }

        let dateAddedToStock: Date | undefined;
        if (data.dateAddedToStock && data.dateAddedToStock.trim() !== "") {
          const parsedAdded = parseEthiopianDateString(data.dateAddedToStock);
          if (parsedAdded) {
            dateAddedToStock = ethiopianToGregorian(parsedAdded.year, parsedAdded.month, parsedAdded.day);
          } else {
            const d = new Date(data.dateAddedToStock);
            if (!isNaN(d.getTime())) dateAddedToStock = d;
          }
        }

        const latestBatch = await prisma.stockBatch.findFirst({
          where: { drugId: data.id },
          orderBy: [{ dateAddedToStock: "desc" }, { createdAt: "desc" }],
        });

        if (latestBatch) {
          await prisma.stockBatch.update({
            where: { id: latestBatch.id },
            data: {
              ...(data.batchNumber?.trim() ? { batchNumber: data.batchNumber.trim() } : {}),
              ...(expiryDate ? { expiryDate } : {}),
              ...(dateAddedToStock ? { dateAddedToStock } : {}),
              ...(data.docNo !== undefined ? { docNo: data.docNo ? data.docNo.trim() : null } : {}),
            },
          });
        } else if (data.batchNumber?.trim()) {
          await prisma.stockBatch.create({
            data: {
              drugId: drug.id,
              batchNumber: data.batchNumber.trim(),
              expiryDate: expiryDate || new Date("2099-12-31"),
              quantity: drug.amountInStock ?? drug.initialStock ?? 0,
              cost: data.price || 0,
              dateAddedToStock: dateAddedToStock || new Date(),
              docNo: data.docNo?.trim() || "EDIT-ENTRY",
            },
          });
        }
      }

      await logAudit({
        actorId: ctx.userId,
        action: PERMISSIONS.CATALOG_APPROVE,
        resourceId: drug.id,
        newValue: JSON.stringify(drug),
        reason: "Directly updated drug details/price/batch",
      });
      revalidatePath("/pharmacy");
      revalidatePath("/pharmacy/catalog");
      revalidatePath("/catalogs");
      return drug;
    } else {
      await prisma.catalogChangeRequest.create({
        data: {
          type: "DRUG",
          action: "UPDATE",
          targetId: data.id,
          requestedData: JSON.stringify(data),
          requestedById: ctx.userId,
        },
      });
      revalidatePath("/catalogs");
      return { success: "Approval request submitted." };
    }
  },
});

export const deleteDrug = createSafeAction({
  schema: z.object({ id: z.string() }),
  requiredPermission: PERMISSIONS.CATALOG_REQUEST,
  handler: async (data, ctx) => {
    const canApprove = true;

    if (canApprove) {
      await prisma.drug.delete({ where: { id: data.id } });
      await logAudit({
        actorId: ctx.userId,
        action: PERMISSIONS.CATALOG_APPROVE,
        resourceId: data.id,
        reason: "Directly deleted drug from catalog",
      });
      revalidatePath("/catalogs");
      return { success: "Deleted." };
    } else {
      await prisma.catalogChangeRequest.create({
        data: {
          type: "DRUG",
          action: "DELETE",
          targetId: data.id,
          requestedData: "{}",
          requestedById: ctx.userId,
        },
      });
      revalidatePath("/catalogs");
      return { success: "Deletion request submitted." };
    }
  },
});

export const processCatalogApproval = createSafeAction({
  schema: z.object({ id: z.string(), approve: z.boolean(), modifiedPayload: z.any().optional() }),
  requiredPermission: PERMISSIONS.CATALOG_APPROVE,
  handler: async (data, ctx) => {
    const req = await prisma.catalogChangeRequest.findUnique({ where: { id: data.id } });
    if (!req || req.status !== "PENDING") throw new Error("Invalid request");

    if (!data.approve) {
      await prisma.catalogChangeRequest.update({
        where: { id: data.id },
        data: { status: "REJECTED", evaluatedById: ctx.userId },
      });
      revalidatePath("/catalogs/approvals");
      return { success: "Rejected." };
    }

    // Process approval
    const rawPayload = data.modifiedPayload ? data.modifiedPayload : JSON.parse(req.requestedData);
    const { id: _id, ...payload } = rawPayload;

    if (req.type === "DRUG") {
      if (req.action === "CREATE") {
        await prisma.drug.create({ data: payload });
      } else if (req.action === "UPDATE") {
        await prisma.drug.update({ where: { id: req.targetId! }, data: payload });
      } else if (req.action === "DELETE") {
        await prisma.drug.delete({ where: { id: req.targetId! } });
      }
    } else if (req.type === "LAB_TEST") {
      if (req.action === "CREATE") {
        await prisma.labTest.create({ data: payload });
      } else if (req.action === "UPDATE") {
        await prisma.labTest.update({ where: { id: req.targetId! }, data: payload });
      } else if (req.action === "DELETE") {
        await prisma.labTest.delete({ where: { id: req.targetId! } });
      }
    }

    await prisma.catalogChangeRequest.update({
      where: { id: data.id },
      data: { status: "APPROVED", evaluatedById: ctx.userId },
    });

    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.CATALOG_APPROVE,
      resourceId: req.targetId || "NEW",
      reason: `Approved ${req.action} for ${req.type}`,
    });

    revalidatePath("/catalogs");
    revalidatePath("/catalogs/approvals");
    return { success: "Approved and applied." };
  },
});

export const deleteLabTest = createSafeAction({
  schema: z.object({ id: z.string() }),
  requiredPermission: PERMISSIONS.CATALOG_REQUEST,
  handler: async (data, ctx) => {
    const canApprove = true;

    if (canApprove) {
      await prisma.labTest.delete({ where: { id: data.id } });
      await logAudit({
        actorId: ctx.userId,
        action: PERMISSIONS.CATALOG_APPROVE,
        resourceId: data.id,
        reason: "Directly deleted lab test from catalog",
      });
      revalidatePath("/catalogs");
      return { success: "Deleted." };
    } else {
      await prisma.catalogChangeRequest.create({
        data: {
          type: "LAB_TEST",
          action: "DELETE",
          targetId: data.id,
          requestedData: "{}",
          requestedById: ctx.userId,
        },
      });
      revalidatePath("/catalogs");
      return { success: "Deletion request submitted." };
    }
  },
});

export const toggleDrugAvailability = createSafeAction({
  schema: z.object({ id: z.string(), isOperational: z.boolean() }),
  requiredPermission: PERMISSIONS.CATALOG_REQUEST,
  handler: async (data, ctx) => {
    const drug = await prisma.drug.update({
      where: { id: data.id },
      data: { isOperational: data.isOperational },
    });
    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.CATALOG_REQUEST,
      resourceId: drug.id,
      newValue: JSON.stringify({ isOperational: data.isOperational }),
      reason: "Toggled drug availability",
    });
    revalidatePath("/pharmacy");
    revalidatePath("/catalogs");
    return { success: "Availability updated." };
  },
});

export const bulkApproveCatalogRequests = createSafeAction({
  schema: z.object({ ids: z.array(z.string()) }),
  requiredPermission: PERMISSIONS.CATALOG_APPROVE,
  handler: async (data, ctx) => {
    for (const id of data.ids) {
      try {
        const req = await prisma.catalogChangeRequest.findUnique({ where: { id } });
        if (!req || req.status !== "PENDING") continue;

        const rawPayload = JSON.parse(req.requestedData);
        const { id: _id, ...payload } = rawPayload;

        if (req.type === "DRUG") {
          if (req.action === "CREATE") await prisma.drug.create({ data: payload });
          else if (req.action === "UPDATE") await prisma.drug.update({ where: { id: req.targetId! }, data: payload });
          else if (req.action === "DELETE") await prisma.drug.delete({ where: { id: req.targetId! } });
        } else if (req.type === "LAB_TEST") {
          if (req.action === "CREATE") await prisma.labTest.create({ data: payload });
          else if (req.action === "UPDATE") await prisma.labTest.update({ where: { id: req.targetId! }, data: payload });
          else if (req.action === "DELETE") await prisma.labTest.delete({ where: { id: req.targetId! } });
        }

        await prisma.catalogChangeRequest.update({
          where: { id },
          data: { status: "APPROVED", evaluatedById: ctx.userId },
        });
      } catch (e) {
        console.error("Failed bulk approve for ", id, e);
      }
    }
    revalidatePath("/catalogs/approvals");
    return { success: "Bulk approved." };
  },
});

export const updateLabTest = createSafeAction({
  schema: catalogUpdateSchema,
  requiredPermission: PERMISSIONS.CATALOG_REQUEST,
  handler: async (data, ctx) => {
    const canApprove = true;

    if (canApprove) {
      const test = await prisma.labTest.update({
        where: { id: data.id },
        data: {
          name: data.name,
          description: data.description,
          options: data.options,
          unit: data.unit,
          price: data.price,
          isOperational: true,
        },
      });
      await logAudit({
        actorId: ctx.userId,
        action: PERMISSIONS.CATALOG_APPROVE,
        resourceId: test.id,
        newValue: JSON.stringify(test),
        reason: "Directly updated lab test details/price/options",
      });
      revalidatePath("/catalogs");
      revalidatePath("/laboratory/catalog");
      revalidatePath("/patients");
      return test;
    } else {
      await prisma.catalogChangeRequest.create({
        data: {
          type: "LAB_TEST",
          action: "UPDATE",
          targetId: data.id,
          requestedData: JSON.stringify(data),
          requestedById: ctx.userId,
        },
      });
      revalidatePath("/catalogs");
      revalidatePath("/laboratory/catalog");
      revalidatePath("/patients");
      return { success: "Approval request submitted." };
    }
  },
});
export const receiveBatchForDrug = createSafeAction({
  schema: z.object({
    drugId: z.string().min(1, "Drug is required"),
    batchNumber: z.string().min(1, "Batch number is required"),
    quantity: z.number().int().positive("Quantity must be greater than 0"),
    expiryDate: z.string().min(1, "Expiry date is required"),
    price: z.number().int().nonnegative().optional(), // In minor units (cents)
    dateAddedToStock: z.string().optional(),
    docNo: z.string().optional(),
    unit: z.string().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
  }),
  requiredPermission: PERMISSIONS.INVENTORY_ADJUST,
  handler: async (data, ctx) => {
    const drug = await prisma.drug.findUnique({
      where: { id: data.drugId },
    });
    if (!drug) {
      return { error: "Medication not found" };
    }

    let expiryDate: Date;
    const parsedExp = parseEthiopianDateString(data.expiryDate);
    if (parsedExp) {
      expiryDate = ethiopianToGregorian(parsedExp.year, parsedExp.month, parsedExp.day);
    } else {
      const d = new Date(data.expiryDate);
      expiryDate = !isNaN(d.getTime()) ? d : new Date("2099-12-31");
    }

    let dateAddedToStock: Date = new Date();
    if (data.dateAddedToStock && data.dateAddedToStock.trim() !== "") {
      const parsedAdded = parseEthiopianDateString(data.dateAddedToStock);
      if (parsedAdded) {
        dateAddedToStock = ethiopianToGregorian(parsedAdded.year, parsedAdded.month, parsedAdded.day);
      } else {
        const d = new Date(data.dateAddedToStock);
        if (!isNaN(d.getTime())) dateAddedToStock = d;
      }
    }

    const price = data.price !== undefined ? data.price : drug.price;

    const newBatch = await prisma.$transaction(async (tx) => {
      await tx.drug.update({
        where: { id: drug.id },
        data: {
          price: price,
          ...(data.unit?.trim() ? { unit: data.unit.trim() } : {}),
          ...(data.category?.trim() ? { category: data.category.trim() } : {}),
          ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
          amountInStock: (drug.amountInStock ?? drug.initialStock ?? 0) + data.quantity,
        },
      });

      const batch = await tx.stockBatch.create({
        data: {
          drugId: drug.id,
          batchNumber: data.batchNumber.trim(),
          expiryDate: expiryDate,
          quantity: data.quantity,
          cost: price,
          dateAddedToStock: dateAddedToStock,
          docNo: data.docNo?.trim() || null,
        },
      });

      await tx.stockMovement.create({
        data: {
          batchId: batch.id,
          type: "receive",
          quantity: data.quantity,
          reason: "Batch intake received via pharmacy catalog",
          actorId: ctx.userId,
        },
      });

      return batch;
    });

    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.INVENTORY_ADJUST,
      resourceId: newBatch.id,
      newValue: {
        drugId: drug.id,
        drugName: drug.name,
        batchNumber: newBatch.batchNumber,
        quantity: newBatch.quantity,
      },
      reason: `Received stock batch ${newBatch.batchNumber} (${data.quantity} units) for ${drug.name}`,
    });

    revalidatePath("/pharmacy");
    revalidatePath("/pharmacy/catalog");
    revalidatePath("/catalogs");
    revalidatePath("/dashboard");

    return {
      success: `Batch ${newBatch.batchNumber} (${data.quantity} units) added to ${drug.name}!`,
      batch: newBatch,
    };
  },
});

export async function searchDrugsForIntake(query?: string) {
  const where: any = { deletedAt: null, isOperational: true };
  if (query && query.trim()) {
    where.OR = [
      { name: { contains: query.trim(), mode: "insensitive" } },
      { category: { contains: query.trim(), mode: "insensitive" } },
      { description: { contains: query.trim(), mode: "insensitive" } },
    ];
  }
  const drugs = await prisma.drug.findMany({
    where,
    select: {
      id: true,
      name: true,
      category: true,
      unit: true,
      price: true,
      amountInStock: true,
      initialStock: true,
      batches: {
        select: {
          id: true,
          batchNumber: true,
          quantity: true,
          expiryDate: true,
          dateAddedToStock: true,
        },
        orderBy: { dateAddedToStock: "desc" },
      },
    },
    orderBy: { name: "asc" },
    take: 50,
  });

  return drugs.map((d) => {
    const totalBatchStock = d.batches.reduce((sum, b) => sum + (b.quantity || 0), 0);
    const effectiveStock = d.batches.length > 0 ? totalBatchStock : (d.amountInStock ?? d.initialStock ?? 0);
    const latestBatch = d.batches[0];
    return {
      id: d.id,
      name: d.name,
      category: d.category,
      unit: d.unit,
      price: d.price,
      stock: effectiveStock,
      latestBatchNumber: latestBatch?.batchNumber || null,
      latestExpiryDate: latestBatch?.expiryDate ? latestBatch.expiryDate.toISOString() : null,
    };
  });
}
