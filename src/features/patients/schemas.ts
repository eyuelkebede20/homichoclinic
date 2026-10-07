import { z } from "zod";
import { zSafeString } from "@/lib/sanitize";

export const patientCreateSchema = z.object({
  firstName: zSafeString().pipe(z.string().min(1, "First name is required")),
  lastName: zSafeString().pipe(z.string().min(1, "Last name is required")),
  yob: z.string().nullable().optional(),
  gender: zSafeString().nullable().optional(),
  contactNumber: zSafeString().nullable().optional(),
  patientType: zSafeString().nullable().optional(),
  militaryId: zSafeString().nullable().optional(),
  rank: zSafeString().nullable().optional(),
  division: zSafeString().nullable().optional(),
  permanentSince: z.string().nullable().optional(),
  primaryPatientId: z.string().nullable().optional(),
  staffSearchStr: z.string().nullable().optional(),
  relationship: z.string().nullable().optional(),
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
