/**
 * CSV Import Utilities
 * Handles BOM removal and data cleanup for safe database imports.
 */

export function stripBOM(content: string): string {
  if (content.charCodeAt(0) === 0xfeff) {
    return content.slice(1);
  }
  return content;
}

export function validateEmployeeId(employeeId: string | null | undefined): boolean {
  if (!employeeId) return false;
  // Strip whitespace and check if it's not empty
  const cleanId = employeeId.trim();
  return cleanId.length > 0;
}

export function parseCsvSafe(rawCsvContent: string): string[] {
  const cleanContent = stripBOM(rawCsvContent);
  return cleanContent.split(/\r?\n/).filter(line => line.trim() !== '');
}
