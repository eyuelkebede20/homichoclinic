import { describe, it, expect } from "vitest";
import { getDiscountableTotal, getNonDiscountableTotal, calculateInvoiceTotals } from "./utils";

describe("Billing Utils", () => {
  const sampleItems = [
    { unitPrice: 10000, quantity: 1, isDiscountable: true }, // $100.00
    { unitPrice: 5000, quantity: 2, isDiscountable: true },  // $100.00
    { unitPrice: 2000, quantity: 1, isDiscountable: false }, // $20.00
  ];

  it("should calculate discountable total correctly", () => {
    const total = getDiscountableTotal(sampleItems);
    expect(total).toBe(20000);
  });

  it("should calculate non-discountable total correctly", () => {
    const total = getNonDiscountableTotal(sampleItems);
    expect(total).toBe(2000);
  });

  it("should calculate final invoice totals with 0% discount", () => {
    const result = calculateInvoiceTotals(sampleItems, 0);
    expect(result.subtotal).toBe(22000);
    expect(result.discountAmount).toBe(0);
    expect(result.total).toBe(22000);
  });

  it("should apply discount only to discountable items", () => {
    // 50% discount on $200.00 = $100.00
    // Non-discountable = $20.00
    // Total should be $120.00
    const result = calculateInvoiceTotals(sampleItems, 50);
    expect(result.subtotal).toBe(22000);
    expect(result.discountAmount).toBe(10000);
    expect(result.total).toBe(12000);
  });

  it("should correctly use half-up rounding for minor units", () => {
    // $15.55 = 1555 minor units
    const items = [{ unitPrice: 1555, quantity: 1, isDiscountable: true }];
    
    // 15% discount on 1555 = 233.25
    // Half-up rounding should round 233.25 to 233
    const result = calculateInvoiceTotals(items, 15);
    expect(result.discountAmount).toBe(233);
    expect(result.total).toBe(1555 - 233); // 1322
  });

  it("should cap total at 0 and not become negative", () => {
    const result = calculateInvoiceTotals(sampleItems, 150); // 150% discount (erroneous data scenario)
    expect(result.discountAmount).toBe(30000);
    expect(result.total).toBe(0); // Subtotal is 22000, capped at 0 instead of -8000
  });
});
