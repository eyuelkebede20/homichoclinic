import { prisma } from "./prisma";
import type { PermissionString } from "./permissions";

type AuditPayload = {
  actorId: string;
  action: PermissionString | string;
  resourceId?: string;
  oldValue?: string | number | boolean | null | Record<string, unknown>;
  newValue?: string | number | boolean | null | Record<string, unknown>;
  reason?: string;
};

/**
 * Utility to log actions to the AuditLog table.
 * Used internally by Server Actions.
 */
export async function logAudit({
  actorId,
  action,
  resourceId,
  oldValue,
  newValue,
  reason,
}: AuditPayload) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        resourceId,
        oldValue: oldValue !== undefined ? JSON.stringify(oldValue) : null,
        newValue: newValue !== undefined ? JSON.stringify(newValue) : null,
        reason,
      },
    });
  } catch (error) {
    // We log the error but typically don't throw to prevent breaking the main transaction,
    // though in a strict medical app you might want to fail the request if audit fails.
    console.error("Failed to write audit log:", error);
  }
}
