import { z } from "zod";

export const deleteUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export const resetPasswordSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export const updateUserRoleSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.string().min(1, "Role is required"),
});
