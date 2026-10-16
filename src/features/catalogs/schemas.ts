import { z } from "zod";

export const catalogCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  unit: z.string().optional().nullable(),
  options: z.string().optional().nullable(),
  price: z.number().int().min(0, "Price cannot be negative"), // Minor units
});

export const catalogUpdateSchema = catalogCreateSchema.extend({
  id: z.string().min(1)
});
