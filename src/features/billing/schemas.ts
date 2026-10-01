import { z } from "zod";
import { zSafeString } from "@/lib/sanitize";

export const invoiceItemSchema = z.object({
  description: zSafeString().pipe(z.string().min(1, "Description is required")),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().int().min(0, "Unit price must be non-negative minor units"),
  isDiscountable: z.boolean().default(true),
});

export const createInvoiceSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
});

export const recordPaymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
  method: z.enum(["cash", "card", "transfer"]),
});
