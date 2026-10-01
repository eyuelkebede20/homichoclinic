"use server";

import { createSafeAction } from "@/lib/safe-action";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { deleteUserSchema, resetPasswordSchema, updateUserRoleSchema } from "./schemas";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs"; // Used to hash the manual reset password

export const deleteUser = createSafeAction({
  schema: deleteUserSchema,
  requiredPermission: PERMISSIONS.USER_MANAGE,
  handler: async (data, ctx) => {
    if (data.userId === ctx.userId) {
      throw new Error("You cannot delete your own account.");
    }

    const deletedUser = await prisma.user.delete({
      where: { id: data.userId },
    });

    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.USER_MANAGE,
      resourceId: deletedUser.id,
      reason: `Deleted user ${deletedUser.email}`,
    });

    revalidatePath("/admin");
    return { success: true };
  },
});

export const resetUserPassword = createSafeAction({
  schema: resetPasswordSchema,
  requiredPermission: PERMISSIONS.USER_MANAGE,
  handler: async (data, ctx) => {
    // Hash new password manually for the credential account
    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    const updatedAccount = await prisma.account.updateMany({
      where: { 
        userId: data.userId,
        providerId: "credential", // Better auth uses "credential" by default for email/password
      },
      data: {
        password: hashedPassword,
      },
    });

    if (updatedAccount.count === 0) {
      throw new Error("User does not have an email/password credential account set up.");
    }

    // Optional: revoke sessions by deleting them
    await prisma.session.deleteMany({
      where: { userId: data.userId },
    });

    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.USER_MANAGE,
      resourceId: data.userId,
      reason: "Admin forced password reset and revoked active sessions.",
    });

    revalidatePath("/admin");
    return { success: true };
  },
});

export const updateUserRole = createSafeAction({
  schema: updateUserRoleSchema,
  requiredPermission: PERMISSIONS.USER_MANAGE,
  handler: async (data, ctx) => {
    if (data.userId === ctx.userId) {
      throw new Error("You cannot change your own role.");
    }

    const updatedUser = await prisma.user.update({
      where: { id: data.userId },
      data: { role: data.role },
    });

    // Revoke sessions to force new role application
    await prisma.session.deleteMany({
      where: { userId: data.userId },
    });

    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.USER_MANAGE,
      resourceId: data.userId,
      newValue: { role: data.role },
      reason: "Admin changed user role",
    });

    revalidatePath("/admin");
    return updatedUser;
  },
});

import { z } from "zod";

const setLowPowerSchema = z.object({
  enabled: z.boolean(),
});

export const setLowPowerMode = createSafeAction({
  schema: setLowPowerSchema,
  requiredPermission: PERMISSIONS.USER_MANAGE,
  handler: async (data, ctx) => {
    await prisma.systemSetting.upsert({
      where: { key: "lowPowerMode" },
      update: { value: data.enabled ? "true" : "false" },
      create: { key: "lowPowerMode", value: data.enabled ? "true" : "false" },
    });

    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.USER_MANAGE,
      reason: `Toggled low power mode to ${data.enabled}`,
    });

    revalidatePath("/", "layout");
    return { success: true };
  }
});
