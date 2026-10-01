/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createSafeAction } from "@/lib/safe-action";
import { PERMISSIONS, ROLE_PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const toggleSchema = z.object({
  id: z.string(),
  isOperational: z.boolean(),
});

async function hasApprovePermission(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return false;
  const perms = ROLE_PERMISSIONS[user.role || "User"] || [];
  return perms.includes(PERMISSIONS.CATALOG_APPROVE as string);
}

export const toggleLabTestOperational = createSafeAction({
  schema: toggleSchema,
  requiredPermission: PERMISSIONS.CATALOG_REQUEST,
  handler: async (data, ctx) => {
    const canApprove = await hasApprovePermission(ctx.userId);

    if (canApprove) {
      const test = await prisma.labTest.update({
        where: { id: data.id },
        data: { isOperational: data.isOperational },
      });

      await logAudit({
        actorId: ctx.userId,
        action: PERMISSIONS.CATALOG_APPROVE,
        resourceId: test.id,
        newValue: { isOperational: test.isOperational },
        reason: "Directly toggled lab test operational status",
      });

      revalidatePath("/catalogs");
      revalidatePath("/patients/[id]");
      return test;
    } else {
      await prisma.catalogChangeRequest.create({
        data: {
          type: "LAB_TEST",
          action: "UPDATE",
          targetId: data.id,
          requestedData: JSON.stringify({ isOperational: data.isOperational }),
          requestedById: ctx.userId,
        }
      });
      revalidatePath("/catalogs");
      return { success: "Approval request submitted." };
    }
  },
});
