import { z } from "zod";

export const catalogCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  options: z.string().optional().nullable(),
  price: z.number().int().min(0, "Price cannot be negative"), // Minor units
  initialStock: z.number().int().min(0).optional().nullable(),
  batchNumber: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  dateAddedToStock: z.string().optional().nullable(),
  docNo: z.string().optional().nullable(),
});

export const catalogUpdateSchema = catalogCreateSchema.extend({
  id: z.string().min(1),
  batchId: z.string().optional().nullable(),
});
