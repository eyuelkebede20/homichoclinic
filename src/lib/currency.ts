export function formatCurrency(amountInMinorUnits: number): string {
  if (amountInMinorUnits === null || amountInMinorUnits === undefined) return "0.00 ETB";
  return (amountInMinorUnits / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " ETB";
}
