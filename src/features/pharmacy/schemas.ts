import { z } from "zod";

export const receiveStockSchema = z.object({
  drugId: z.string().min(1, "Drug ID is required"),
  batchNumber: z.string().min(1, "Batch number is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  cost: z.number().int().nonnegative("Cost must be non-negative (in minor units)"),
});

export const dispensePrescriptionSchema = z.object({
  prescriptionId: z.string().min(1, "Prescription ID is required"),
});
