import { describe, it, expect } from "vitest";
import { allocateFEFO, Batch } from "./utils";

describe("Pharmacy Utils - FEFO Allocation", () => {
  it("should deduct entirely from the earliest expiring batch if it has enough stock", () => {
    const batches: Batch[] = [
      { id: "b1", quantity: 50, expiryDate: new Date("2027-01-01") }, // Expires earliest
      { id: "b2", quantity: 50, expiryDate: new Date("2028-01-01") },
    ];

    const allocations = allocateFEFO(20, batches);
    
    expect(allocations.length).toBe(1);
    expect(allocations[0]).toEqual({ batchId: "b1", deductQuantity: 20 });
  });

  it("should split deduction across multiple batches if necessary (FEFO)", () => {
    const batches: Batch[] = [
      { id: "b1", quantity: 15, expiryDate: new Date("2027-01-01") }, // Expires earliest
      { id: "b2", quantity: 50, expiryDate: new Date("2028-01-01") },
    ];

    const allocations = allocateFEFO(20, batches);
    
    expect(allocations.length).toBe(2);
    expect(allocations[0]).toEqual({ batchId: "b1", deductQuantity: 15 });
    expect(allocations[1]).toEqual({ batchId: "b2", deductQuantity: 5 });
  });

  it("should throw an error if total available stock is insufficient", () => {
    const batches: Batch[] = [
      { id: "b1", quantity: 15, expiryDate: new Date("2027-01-01") },
    ];

    expect(() => allocateFEFO(20, batches)).toThrowError("Insufficient stock");
  });

  it("should sort batches by expiry date automatically if not already sorted", () => {
    const batches: Batch[] = [
      { id: "late", quantity: 50, expiryDate: new Date("2029-01-01") }, 
      { id: "early", quantity: 20, expiryDate: new Date("2027-01-01") }, 
    ];

    const allocations = allocateFEFO(15, batches);
    
    expect(allocations.length).toBe(1);
    expect(allocations[0].batchId).toBe("early");
  });
});
