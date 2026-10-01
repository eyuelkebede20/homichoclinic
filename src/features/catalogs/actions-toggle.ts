"use server";

import { createSafeAction } from "@/lib/safe-action";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const toggleSchema = z.object({
  id: z.string(),
  isOperational: z.boolean(),
});

export const toggleLabTestOperational = createSafeAction({
  schema: toggleSchema,
  requiredPermission: PERMISSIONS.INVENTORY_ADJUST,
  handler: async (data, ctx) => {
    const test = await prisma.labTest.update({
      where: { id: data.id },
      data: { isOperational: data.isOperational },
    });

    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.INVENTORY_ADJUST,
      resourceId: test.id,
      newValue: { isOperational: test.isOperational },
      reason: "Toggled lab test operational status",
    });

    revalidatePath("/catalogs");
    revalidatePath("/patients/[id]");
    return test;
  },
});
