"use server";

import { createSafeAction } from "@/lib/safe-action";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { createInvoiceSchema, recordPaymentSchema } from "./schemas";
import { getDiscountableTotal, getNonDiscountableTotal } from "./utils";
import { revalidatePath } from "next/cache";

export const createInvoice = createSafeAction({
  schema: createInvoiceSchema,
  requiredPermission: PERMISSIONS.INVOICE_CREATE,
  handler: async (data, ctx) => {
    const invoice = await prisma.$transaction(async (tx) => {
      // 1. Fetch patient to snapshot their current discount
      const patient = await tx.patient.findUnique({
        where: { id: data.patientId },
        select: { discountPercent: true },
      });

      if (!patient) throw new Error("Patient not found");
      const discountPercentApplied = patient.discountPercent;

      // 2. Compute totals using integer minor units
      const discountableTotal = getDiscountableTotal(data.items);
      const nonDiscountableTotal = getNonDiscountableTotal(data.items);
      const subtotal = discountableTotal + nonDiscountableTotal;

      // 3. Half-up rounding for the discount amount
      const discountAmount = Math.round((discountableTotal * discountPercentApplied) / 100);
      const total = subtotal - discountAmount;

      if (total < 0) throw new Error("Total cannot be negative");

      // 4. Create Invoice and Items
      const newInvoice = await tx.invoice.create({
        data: {
          patientId: data.patientId,
          discountPercentApplied,
          subtotal,
          total,
          status: "pending",
          items: {
            create: data.items.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              isDiscountable: item.isDiscountable,
            })),
          },
        },
      });

      return newInvoice;
    });

    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.INVOICE_CREATE,
      resourceId: invoice.id,
      newValue: { total: invoice.total, discountApplied: invoice.discountPercentApplied },
    });

    revalidatePath("/billing");
    return invoice;
  },
});

export const recordPayment = createSafeAction({
  schema: recordPaymentSchema,
  requiredPermission: PERMISSIONS.PAYMENT_CREATE,
  handler: async (data, ctx) => {
    const payment = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: data.invoiceId },
      });

      if (!invoice) throw new Error("Invoice not found");
      if (invoice.status === "paid") throw new Error("Invoice is already paid");

      // Record full payment
      const newPayment = await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: invoice.total,
          method: data.method,
          dataencoderId: ctx.userId,
        },
      });

      // Update invoice status
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: "paid" },
      });

      // Auto-Discharge / Visit Closing Workflow
      // Any visits attached to this fully paid invoice are considered completed/discharged.
      await tx.visit.updateMany({
        where: { invoiceId: invoice.id, status: { not: "completed" } },
        data: { status: "completed" },
      });

      return newPayment;
    });

    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.PAYMENT_CREATE,
      resourceId: payment.id,
      newValue: { amount: payment.amount, method: payment.method },
    });

    revalidatePath("/billing");
    return payment;
  },
});
