export interface Batch {
  id: string;
  quantity: number;
  expiryDate: Date;
}

export interface Allocation {
  batchId: string;
  deductQuantity: number;
}

/**
 * Pure function to calculate FEFO (First-Expiry, First-Out) allocations.
 * Assumes the batches are already sorted by expiryDate ascending,
 * or it will sort them itself to be safe.
 */
export function allocateFEFO(requestedQuantity: number, availableBatches: Batch[]): Allocation[] {
  if (requestedQuantity <= 0) return [];

  // Ensure batches are sorted by expiryDate (ascending)
  const sortedBatches = [...availableBatches].sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());
  
  const totalAvailable = sortedBatches.reduce((sum, b) => sum + b.quantity, 0);
  if (totalAvailable < requestedQuantity) {
    throw new Error("Insufficient stock");
  }

  const allocations: Allocation[] = [];
  let remaining = requestedQuantity;

  for (const batch of sortedBatches) {
    if (remaining <= 0) break;
    if (batch.quantity <= 0) continue;

    const deduct = Math.min(batch.quantity, remaining);
    allocations.push({
      batchId: batch.id,
      deductQuantity: deduct,
    });
    
    remaining -= deduct;
  }

  if (remaining > 0) {
    throw new Error("Insufficient stock"); // Double-check safety
  }

  return allocations;
}
