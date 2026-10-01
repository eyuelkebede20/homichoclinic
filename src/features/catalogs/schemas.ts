import { z } from "zod";

export const catalogCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  price: z.number().int().min(0, "Price cannot be negative"), // Minor units
});

export const catalogUpdateSchema = catalogCreateSchema.extend({
  id: z.string().min(1)
});
