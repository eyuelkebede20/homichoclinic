import { z } from "zod";
import { zSafeString } from "@/lib/sanitize";

export const patientCreateSchema = z.object({
  firstName: zSafeString().pipe(z.string().min(1, "First name is required")),
  lastName: zSafeString().pipe(z.string().min(1, "Last name is required")),
  yob: z.string().optional(),
  gender: zSafeString().optional(),
  contactNumber: zSafeString().optional(),
  patientType: zSafeString().optional(),
  militaryId: zSafeString().optional(),
  rank: zSafeString().optional(),
  division: zSafeString().optional(),
  hiredYearEC: z.number().int().min(1900).max(2100).optional().nullable(),
});

export const patientUpdateSchema = patientCreateSchema.extend({
  patientId: z.string().min(1, "Patient ID is required")
});

export const discountUpdateSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  discountPercent: z.number().int().min(0).max(100),
  reason: zSafeString().optional(),
});

export type PatientCreateInput = z.infer<typeof patientCreateSchema>;
export type DiscountUpdateInput = z.infer<typeof discountUpdateSchema>;
