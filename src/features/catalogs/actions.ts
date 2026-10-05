"use server";

import { z } from "zod";
import { createSafeAction } from "@/lib/safe-action";
import { PERMISSIONS, ROLE_PERMISSIONS, PermissionString } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { catalogCreateSchema, catalogUpdateSchema } from "./schemas";
import { revalidatePath } from "next/cache";

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
    const canApprove = await hasApprovePermission(ctx.userId);

    if (canApprove) {
      const drug = await prisma.drug.create({ data });
      await logAudit({
        actorId: ctx.userId,
        action: PERMISSIONS.CATALOG_APPROVE,
        resourceId: drug.id,
        newValue: JSON.stringify(drug),
        reason: "Directly created new drug in catalog",
      });
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
        }
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
    const canApprove = await hasApprovePermission(ctx.userId);

    if (canApprove) {
      const test = await prisma.labTest.create({ data });
      await logAudit({
        actorId: ctx.userId,
        action: PERMISSIONS.CATALOG_APPROVE,
        resourceId: test.id,
        newValue: JSON.stringify(test),
        reason: "Directly created new lab test in catalog",
      });
      revalidatePath("/catalogs");
      return test;
    } else {
      await prisma.catalogChangeRequest.create({
        data: {
          type: "LAB_TEST",
          action: "CREATE",
          requestedData: JSON.stringify(data),
          requestedById: ctx.userId,
        }
      });
      revalidatePath("/catalogs");
      return { success: "Approval request submitted." };
    }
  },
});

export const updateDrug = createSafeAction({
  schema: catalogUpdateSchema,
  requiredPermission: PERMISSIONS.CATALOG_REQUEST,
  handler: async (data, ctx) => {
    const canApprove = await hasApprovePermission(ctx.userId);

    if (canApprove) {
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
        action: PERMISSIONS.CATALOG_APPROVE,
        resourceId: drug.id,
        newValue: JSON.stringify(drug),
        reason: "Directly updated drug details/price",
      });
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
        }
      });
      revalidatePath("/catalogs");
      return { success: "Approval request submitted." };
    }
  }
});

export const deleteDrug = createSafeAction({
  schema: z.object({ id: z.string() }),
  requiredPermission: PERMISSIONS.CATALOG_REQUEST,
  handler: async (data, ctx) => {
    const canApprove = await hasApprovePermission(ctx.userId);

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
        }
      });
      revalidatePath("/catalogs");
      return { success: "Deletion request submitted." };
    }
  }
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
        data: { status: "REJECTED", evaluatedById: ctx.userId }
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
      data: { status: "APPROVED", evaluatedById: ctx.userId }
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
  }
});

export const deleteLabTest = createSafeAction({
  schema: z.object({ id: z.string() }),
  requiredPermission: PERMISSIONS.CATALOG_REQUEST,
  handler: async (data, ctx) => {
    const canApprove = await hasApprovePermission(ctx.userId);

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
        }
      });
      revalidatePath("/catalogs");
      return { success: "Deletion request submitted." };
    }
  }
});

export const toggleDrugAvailability = createSafeAction({
  schema: z.object({ id: z.string(), isOperational: z.boolean() }),
  requiredPermission: PERMISSIONS.CATALOG_REQUEST,
  handler: async (data, ctx) => {
    const drug = await prisma.drug.update({
      where: { id: data.id },
      data: { isOperational: data.isOperational }
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
  }
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
          data: { status: "APPROVED", evaluatedById: ctx.userId }
        });
      } catch (e) {
        console.error("Failed bulk approve for ", id, e);
      }
    }
    revalidatePath("/catalogs/approvals");
    return { success: "Bulk approved." };
  }
});