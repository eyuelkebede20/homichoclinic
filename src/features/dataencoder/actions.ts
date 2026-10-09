"use server";

import { createSafeAction } from "@/lib/safe-action";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const approveInvoiceSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
});

const disapproveInvoiceSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
});

export const approveInvoice = createSafeAction({
  schema: approveInvoiceSchema,
  requiredPermission: PERMISSIONS.INVOICE_READ, // Or a new permission like DATA_ENCODER
  handler: async (data, ctx) => {
    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.findUnique({
        where: { id: data.invoiceId },
      });

      if (!inv) throw new Error("Invoice not found");
      if (inv.status === "approved" || inv.status === "paid") throw new Error("Invoice is already approved or paid");

      const updated = await tx.invoice.update({
        where: { id: inv.id },
        data: { status: "approved" },
      });

      // Close visits if approved
      await tx.visit.updateMany({
        where: { invoiceId: inv.id, status: { not: "completed" } },
        data: { status: "completed" },
      });

      return updated;
    });

    await logAudit({
      actorId: ctx.userId,
      action: "invoice:approve",
      resourceId: invoice.id,
      newValue: { status: invoice.status },
    });

    revalidatePath("/dataencoder");
    return invoice;
  },
});

export const disapproveInvoice = createSafeAction({
  schema: disapproveInvoiceSchema,
  requiredPermission: PERMISSIONS.INVOICE_READ, // Or a new permission
  handler: async (data, ctx) => {
    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.findUnique({
        where: { id: data.invoiceId },
      });

      if (!inv) throw new Error("Invoice not found");
      if (inv.status === "disapproved" || inv.status === "paid") throw new Error("Invoice is already disapproved or paid");

      const updated = await tx.invoice.update({
        where: { id: inv.id },
        data: { status: "disapproved" },
      });

      return updated;
    });

    await logAudit({
      actorId: ctx.userId,
      action: "invoice:disapprove",
      resourceId: invoice.id,
      newValue: { status: invoice.status },
    });

    revalidatePath("/dataencoder");
    return invoice;
  },
});
