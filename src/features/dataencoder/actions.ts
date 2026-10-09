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

const _approveInvoice = createSafeAction({
  schema: approveInvoiceSchema,
  requiredPermission: PERMISSIONS.INVOICE_READ,
  handler: async (data, ctx) => {
    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.findUnique({
        where: { id: data.invoiceId },
      });

      if (!inv) throw new Error("Invoice not found");
      if (inv.status === "approved" || inv.status === "paid") throw new Error("Invoice is already approved or paid");

      const updated = await tx.invoice.update({
        where: { id: inv.id },
        data: { status: "paid" },
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

export const approveInvoice = async (data: z.infer<typeof approveInvoiceSchema>) => _approveInvoice(data);

const _disapproveInvoice = createSafeAction({
  schema: disapproveInvoiceSchema,
  requiredPermission: PERMISSIONS.INVOICE_READ,
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

export const disapproveInvoice = async (data: z.infer<typeof disapproveInvoiceSchema>) => _disapproveInvoice(data);

export async function autoBillUnbilledItems(patientId: string, actorId: string) {
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) return;

  const labRequests = await prisma.labRequest.findMany({
    where: { patientId, status: "completed", invoiceId: null },
    include: { test: true }
  });

  const prescriptions = await prisma.prescription.findMany({
    where: { patientId, status: "dispensed" },
    include: { items: { where: { invoiceId: null }, include: { drug: true } } }
  });

  const unbilledPrescriptionItems = prescriptions.flatMap(p => p.items);

  if (labRequests.length === 0 && unbilledPrescriptionItems.length === 0) return;

  const items: import("@prisma/client").Prisma.InvoiceItemCreateWithoutInvoiceInput[] = [];

  labRequests.forEach(l => {
    items.push({
      description: `Lab Test: ${l.test.name}`,
      quantity: 1,
      unitPrice: l.test.price,
      isDiscountable: true,
    });
  });

  unbilledPrescriptionItems.forEach(pi => {
    items.push({
      description: `Pharmacy: ${pi.drug.name} (${pi.quantity} units)`,
      quantity: pi.quantity,
      unitPrice: pi.drug.price,
      isDiscountable: true,
    });
  });

  let discountableTotal = 0;
  let nonDiscountableTotal = 0;

  items.forEach(item => {
    const lineTotal = item.unitPrice * item.quantity;
    if (item.isDiscountable) discountableTotal += lineTotal;
    else nonDiscountableTotal += lineTotal;
  });

  const subtotal = discountableTotal + nonDiscountableTotal;
  const discountAmount = Math.round((discountableTotal * patient.discountPercent) / 100);
  const total = subtotal - discountAmount;

  await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.create({
      data: {
        patientId,
        status: "pending",
        discountPercentApplied: patient.discountPercent,
        subtotal,
        total,
        items: {
          create: items
        }
      }
    });

    if (labRequests.length > 0) {
      await tx.labRequest.updateMany({
        where: { id: { in: labRequests.map(l => l.id) } },
        data: { invoiceId: invoice.id }
      });
    }

    if (unbilledPrescriptionItems.length > 0) {
      await tx.prescriptionItem.updateMany({
        where: { id: { in: unbilledPrescriptionItems.map(p => p.id) } },
        data: { invoiceId: invoice.id }
      });
    }
  });
}

