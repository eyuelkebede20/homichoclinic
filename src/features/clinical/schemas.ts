import { z } from "zod";
import { zSafeString } from "@/lib/sanitize";

export const visitCreateSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  doctorId: z.string().optional(),
  notes: zSafeString().optional(),
  visitDate: z.string().optional(), // Date string
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
});

export const visitUpdateSchema = z.object({
  visitId: z.string().min(1, "Visit ID is required"),
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]),
});

export const medicalRecordCreateSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  source: z.enum(["system", "paper_import"]).default("system"),
  originalDate: z.string().optional(), // Used if paper_import
  attachments: z.string().optional(), // URL or JSON array of URLs
  content: zSafeString().pipe(z.string().min(1, "Record content is required")),
});

export const labRequestSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  testIds: z.array(z.string()).min(1, "At least one test must be selected"),
});

export const labResultSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
  findings: zSafeString().pipe(z.string().min(1, "Findings are required")),
});

export const prescriptionCreateSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  items: z.array(z.object({
    drugId: z.string().min(1, "Drug ID is required"),
    quantity: z.number().int().min(1, "Quantity must be at least 1"),
    instructions: zSafeString().pipe(z.string().min(1, "Instructions are required")),
  })).min(1, "At least one item is required"),
});
export const vitalsUpdateSchema = z.object({
  visitId: z.string().min(1),
  vitals: z.object({
    weight: z.string().optional(),
    bloodPressure: z.string().optional(),
    temperature: z.string().optional(),
    heartRate: z.string().optional()
  })
});

