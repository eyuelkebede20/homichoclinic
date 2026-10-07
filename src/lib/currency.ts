/**
 * Currency Utilities
 * The system stores all money as integer minor units (e.g. cents).
 * This utility enforces that and prevents floating point rounding errors.
 */

export class CurrencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CurrencyError';
  }
}

/**
 * Validates that a number is a safe integer (no floats).
 * Useful before saving money to the database.
 */
export function assertInteger(amount: number): void {
  if (!Number.isInteger(amount)) {
    throw new CurrencyError(`Invalid currency amount: ${amount}. Must be an integer minor unit (e.g. cents) with no decimals.`);
  }
}

/**
 * Converts a float (e.g., from a user input like 10.50) to an integer minor unit (1050).
 * Multiplier is usually 100 for currencies with 2 decimal places.
 */
export function floatToMinorUnit(amount: number, multiplier: number = 100): number {
  const minor = Math.round(amount * multiplier);
  assertInteger(minor);
  return minor;
}

/**
 * Formats an integer minor unit (1050) back to a display float (10.50).
 */
export function minorUnitToFloat(amount: number, divisor: number = 100): number {
  assertInteger(amount);
  return amount / divisor;
}
