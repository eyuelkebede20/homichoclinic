interface LineItem {
  unitPrice: number; // minor units
  quantity: number;
  isDiscountable: boolean;
}

/**
 * Determines the sum of all discountable line items.
 * Placed in a central utility so it can be easily updated 
 * once business rules about discountable items change.
 */
export function getDiscountableTotal(items: LineItem[]) {
  return items
    .filter(i => i.isDiscountable)
    .reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
}

/**
 * Determines the sum of all non-discountable line items.
 */
export function getNonDiscountableTotal(items: LineItem[]) {
  return items
    .filter(i => !i.isDiscountable)
    .reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
}

/**
 * Formats a minor-unit integer (e.g. 1050) into a currency string (e.g. $10.50)
 */
export function formatCurrency(minorUnits: number): string {
  return (minorUnits / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "ETB", 
  });
}

/**
 * Pure function to calculate final totals based on business rules.
 * Applies half-up rounding to the discount amount.
 */
export function calculateInvoiceTotals(items: LineItem[], discountPercentApplied: number) {
  const discountableTotal = getDiscountableTotal(items);
  const nonDiscountableTotal = getNonDiscountableTotal(items);
  const subtotal = discountableTotal + nonDiscountableTotal;

  // Half-up rounding for the discount amount
  const discountAmount = Math.round((discountableTotal * discountPercentApplied) / 100);
  const total = Math.max(0, subtotal - discountAmount); // Ensure no negative total

  return { subtotal, discountAmount, total };
}
