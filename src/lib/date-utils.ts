/**
 * Clinic Timezone configuration.
 * Ethiopia uses East Africa Time (EAT), which is UTC+3.
 */
const CLINIC_TIMEZONE = 'Africa/Addis_Ababa';
const CLINIC_UTC_OFFSET = '+03:00';

/**
 * Returns a Date object representing the start of the current day (00:00:00)
 * in the clinic's local timezone.
 * 
 * Why? Servers (like Vercel) run in UTC. If we use `new Date().setHours(0,0,0,0)`, 
 * it will roll over at 3:00 AM local time instead of midnight, causing "today's visits" 
 * to unexpectedly disappear in the afternoon.
 */
export function getStartOfDayLocal(): Date {
  const d = new Date();
  const options = { timeZone: CLINIC_TIMEZONE, year: 'numeric', month: 'numeric', day: 'numeric' } as const;
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(d);
  
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value.padStart(2, '0');
  const day = parts.find(p => p.type === 'day')?.value.padStart(2, '0');
  
  // Construct ISO string with explicit timezone offset for midnight
  return new Date(`${year}-${month}-${day}T00:00:00${CLINIC_UTC_OFFSET}`);
}

/**
 * Returns a Date object representing the end of the current day (23:59:59.999)
 * in the clinic's local timezone.
 */
export function getEndOfDayLocal(): Date {
  const d = new Date();
  const options = { timeZone: CLINIC_TIMEZONE, year: 'numeric', month: 'numeric', day: 'numeric' } as const;
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(d);
  
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value.padStart(2, '0');
  const day = parts.find(p => p.type === 'day')?.value.padStart(2, '0');
  
  return new Date(`${year}-${month}-${day}T23:59:59.999${CLINIC_UTC_OFFSET}`);
}
