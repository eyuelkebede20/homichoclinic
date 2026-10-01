"use server";

import { createSafeAction } from "@/lib/safe-action";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { catalogCreateSchema, catalogUpdateSchema } from "./schemas";
import { revalidatePath } from "next/cache";

export const createDrug = createSafeAction({
  schema: catalogCreateSchema,
  requiredPermission: PERMISSIONS.INVENTORY_ADJUST,
  handler: async (data, ctx) => {
    const drug = await prisma.drug.create({ data });

    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.INVENTORY_ADJUST,
      resourceId: drug.id,
      newValue: JSON.stringify(drug),
      reason: "Created new drug in catalog",
    });

    revalidatePath("/catalogs");
    revalidatePath("/patients/[id]"); // Update dropdowns
    return drug;
  },
});

export const createLabTest = createSafeAction({
  schema: catalogCreateSchema,
  requiredPermission: PERMISSIONS.INVENTORY_ADJUST, // Using INVENTORY_ADJUST for general pricing catalog edit for simplicity
  handler: async (data, ctx) => {
    const test = await prisma.labTest.create({ data });

    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.INVENTORY_ADJUST,
      resourceId: test.id,
      newValue: JSON.stringify(test),
      reason: "Created new lab test in catalog",
    });

    revalidatePath("/catalogs");
    revalidatePath("/patients/[id]");
    return test;
  },
});

export const updateDrug = createSafeAction({
  schema: catalogUpdateSchema,
  requiredPermission: PERMISSIONS.INVENTORY_ADJUST,
  handler: async (data, ctx) => {
    const drug = await prisma.drug.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        price: data.price,
      }
    });

    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.INVENTORY_ADJUST,
      resourceId: drug.id,
      newValue: JSON.stringify(drug),
      reason: "Updated drug details/price",
    });

    revalidatePath("/catalogs");
    return drug;
  },
});
