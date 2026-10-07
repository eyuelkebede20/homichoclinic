"use server";

import { createSafeAction } from "@/lib/safe-action";
import { z } from "zod";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { deleteUserSchema, resetPasswordSchema, updateUserRoleSchema, clinicProfileSchema } from "./schemas";
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

export const saveClinicProfile = createSafeAction({
  schema: clinicProfileSchema,
  requiredPermission: PERMISSIONS.USER_MANAGE,
  handler: async (data, ctx) => {
    await prisma.$transaction([
      prisma.systemSetting.upsert({
        where: { key: "clinicName" },
        update: { value: data.clinicName },
        create: { key: "clinicName", value: data.clinicName }
      }),
      prisma.systemSetting.upsert({
        where: { key: "clinicNameAmharic" },
        update: { value: data.clinicNameAmharic || "" },
        create: { key: "clinicNameAmharic", value: data.clinicNameAmharic || "" }
      }),
      prisma.systemSetting.upsert({
        where: { key: "clinicLogo" },
        update: { value: data.clinicLogo },
        create: { key: "clinicLogo", value: data.clinicLogo }
      })
    ]);
    
    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.USER_MANAGE,
      resourceId: "system",
      newValue: { clinicName: data.clinicName, clinicLogo: data.clinicLogo }
    });

    revalidatePath("/", "layout");
    return { success: true };
  }
});

const setHeavyDutySchema = z.object({
  enabled: z.boolean(),
});

export const setHeavyDutyMode = createSafeAction({
  schema: setHeavyDutySchema,
  requiredPermission: PERMISSIONS.USER_MANAGE,
  handler: async (data, ctx) => {
    await prisma.systemSetting.upsert({
      where: { key: "heavyDutyMode" },
      update: { value: data.enabled ? "true" : "false" },
      create: { key: "heavyDutyMode", value: data.enabled ? "true" : "false" },
    });

    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.USER_MANAGE,
      reason: "Toggled Heavy Duty (OCR) mode to ",
    });

    revalidatePath("/", "layout");
    return { success: true };
  }
});
export const createUser = createSafeAction({
  schema: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.string().min(1)
  }),
  requiredPermission: PERMISSIONS.USER_MANAGE,
  handler: async (data, ctx) => {
    const existingUser = await prisma.user.findFirst({ where: { email: data.email } });
    if (existingUser) throw new Error("A user with this email already exists.");

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const userId = crypto.randomUUID();

    const user = await prisma.user.create({
      data: {
        id: userId,
        name: data.name,
        email: data.email,
        emailVerified: true,
        role: data.role,
        createdAt: new Date(),
        updatedAt: new Date(),
        accounts: {
          create: {
            id: crypto.randomUUID(),
            accountId: userId,
            providerId: "credential",
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }
      }
    });

    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.USER_MANAGE,
      resourceId: user.id,
      newValue: JSON.stringify({ email: user.email, role: user.role }),
      reason: "Created new user manually",
    });

    revalidatePath("/admin");
    return { success: "User created successfully." };
  }
});

import fs from "fs";
import path from "path";

/**
 * Writes a flag file that the host-side systemd path unit
 * (clinic-update.path) watches. When the file appears, systemd runs
 * update.sh as root — no docker.sock, no shell exec from the app.
 *
 * The flag file path must match:
 *   - compose volume mount: ./run:/run/updater
 *   - systemd unit: PathExists=/opt/clinic/run/update.request
 */
export const triggerSystemUpdate = createSafeAction({
  schema: z.object({}),
  requiredPermission: PERMISSIONS.USER_MANAGE,
  handler: async (_data, ctx) => {
    const flagPath = "/run/updater/update.request";

    try {
      // Ensure the directory exists (should already be mounted by compose)
      fs.mkdirSync(path.dirname(flagPath), { recursive: true });
      // Writing an empty file is the signal; systemd detects its creation
      fs.writeFileSync(flagPath, "");
    } catch (error: any) {
      throw new Error(
        `Could not write update flag: ${error.message}. ` +
        `Make sure the compose volume ./run:/run/updater is mounted and writable by uid 1000.`
      );
    }

    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.USER_MANAGE,
      reason: "Triggered system update via flag file",
    });

    return {
      success: true,
      message: "Update requested. The system will update and restart in about a minute.",
    };
  },
});

const updateSystemSettingSchema = z.object({
  key: z.string(),
  value: z.string(),
});

export const updateSystemSetting = createSafeAction({
  schema: updateSystemSettingSchema,
  requiredPermission: PERMISSIONS.USER_MANAGE,
  handler: async (data, ctx) => {
    await prisma.systemSetting.upsert({
      where: { key: data.key },
      update: { value: data.value },
      create: { key: data.key, value: data.value },
    });

    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.USER_MANAGE,
      reason: `Updated system setting ${data.key} to ${data.value}`,
    });

    revalidatePath("/", "layout");
    return { success: true };
  }
});

