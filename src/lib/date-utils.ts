import { EthDateTime } from "ethiopian-calendar-date-converter";

export const ETHIOPIAN_MONTHS = [
  { id: 1, name: "Meskerem", amharic: "መስከረም", days: 30 },
  { id: 2, name: "Tikimt", amharic: "ጥቅምት", days: 30 },
  { id: 3, name: "Hidar", amharic: "ኅዳር", days: 30 },
  { id: 4, name: "Tahsas", amharic: "ታኅሣሥ", days: 30 },
  { id: 5, name: "Tir", amharic: "ጥር", days: 30 },
  { id: 6, name: "Yekatit", amharic: "የካቲት", days: 30 },
  { id: 7, name: "Megabit", amharic: "መጋቢት", days: 30 },
  { id: 8, name: "Miazia", amharic: "ሚያዝያ", days: 30 },
  { id: 9, name: "Ginbot", amharic: "ግንቦት", days: 30 },
  { id: 10, name: "Sene", amharic: "ሰኔ", days: 30 },
  { id: 11, name: "Hamle", amharic: "ሐምሌ", days: 30 },
  { id: 12, name: "Nehase", amharic: "ነሐሴ", days: 30 },
  { id: 13, name: "Pagume", amharic: "ጳጉሜን", days: 5 },
] as const;

export const ETHIOPIAN_WEEKDAYS = [
  { id: 0, name: "Sunday", amharic: "እሑድ", short: "እሑ", enShort: "Sun" },
  { id: 1, name: "Monday", amharic: "ሰኞ", short: "ሰኞ", enShort: "Mon" },
  { id: 2, name: "Tuesday", amharic: "ማክሰኞ", short: "ማክ", enShort: "Tue" },
  { id: 3, name: "Wednesday", amharic: "ረቡዕ", short: "ረቡ", enShort: "Wed" },
  { id: 4, name: "Thursday", amharic: "ሐሙስ", short: "ሐሙ", enShort: "Thu" },
  { id: 5, name: "Friday", amharic: "ዓርብ", short: "ዓር", enShort: "Fri" },
  { id: 6, name: "Saturday", amharic: "ቅዳሜ", short: "ቅዳ", enShort: "Sat" },
] as const;

/**
 * Checks if a given Ethiopian year is a leap year (Pagume has 6 days).
 */
export function isEthiopianLeapYear(year: number): boolean {
  return year % 4 === 3;
}

/**
 * Returns number of days in the specified Ethiopian month (1-13).
 */
export function getDaysInEthiopianMonth(year: number, month: number): number {
  if (month >= 1 && month <= 12) return 30;
  if (month === 13) return isEthiopianLeapYear(year) ? 6 : 5;
  return 30;
}

/**
 * Returns current Ethiopian date parts.
 */
export function getCurrentEthiopianDate(): {
  year: number;
  month: number;
  date: number;
  hour: number;
  minute: number;
} {
  const eth = EthDateTime.fromEuropeanDate(new Date());
  return {
    year: eth.year,
    month: eth.month,
    date: eth.date,
    hour: eth.hour,
    minute: eth.minute,
  };
}

/**
 * Returns the current Ethiopian year (e.g. 2019).
 */
export function getCurrentEthiopianYear(): number {
  return getCurrentEthiopianDate().year;
}

/**
 * Converts Ethiopian date to Gregorian JavaScript Date.
 */
export function ethiopianToGregorian(
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0,
  second: number = 0,
  millisecond: number = 0
): Date {
  const clampedMonth = Math.max(1, Math.min(13, month));
  const maxDays = getDaysInEthiopianMonth(year, clampedMonth);
  const clampedDay = Math.max(1, Math.min(maxDays, day));
  const eth = new EthDateTime(year, clampedMonth, clampedDay, hour, minute);
  const d = eth.toEuropeanDate();
  if (second !== 0 || millisecond !== 0) {
    d.setSeconds(second, millisecond);
  }
  return d;
}

/**
 * Converts a Gregorian Date to Ethiopian Date object.
 */
export function gregorianToEthiopian(date: Date | string | number): {
  year: number;
  month: number;
  date: number;
  hour: number;
  minute: number;
} {
  const d = date instanceof Date ? date : new Date(date);
  const eth = EthDateTime.fromEuropeanDate(d);
  return {
    year: eth.year,
    month: eth.month,
    date: eth.date,
    hour: eth.hour,
    minute: eth.minute,
  };
}

/**
 * Parses an Ethiopian date string (e.g. "2010-05-12", "12/05/2010", "2010/05/12", "2010").
 */
export function parseEthiopianDateString(
  str: string | null | undefined
): { year: number; month: number; day: number } | null {
  if (!str || str === "NaN" || str.trim() === "") return null;
  const trimmed = str.trim();

  // Pattern: YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    return {
      year: parseInt(ymdMatch[1], 10),
      month: parseInt(ymdMatch[2], 10),
      day: parseInt(ymdMatch[3], 10),
    };
  }

  // Pattern: DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    return {
      day: parseInt(dmyMatch[1], 10),
      month: parseInt(dmyMatch[2], 10),
      year: parseInt(dmyMatch[3], 10),
    };
  }

  // Just a 4-digit year
  const yearMatch = trimmed.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    return {
      year: parseInt(yearMatch[0], 10),
      month: 1,
      day: 1,
    };
  }

  return null;
}

/**
 * Formats a Date or Ethiopian date string to human-readable Ethiopian format.
 * e.g. "ጥቅምት 6, 2019" or "Tikimt 6, 2019"
 */
export function formatToEthiopianDate(
  dateInput: Date | string | number | null | undefined,
  options?: {
    includeTime?: boolean;
    amharic?: boolean;
    format?: "full" | "short" | "numeric";
  }
): string {
  if (!dateInput) return "N/A";

  const amharic = options?.amharic ?? true;
  const includeTime = options?.includeTime ?? false;
  const format = options?.format ?? "full";

  // Check if dateInput is already an Ethiopian YYYY-MM-DD string
  if (typeof dateInput === "string" && !dateInput.includes("T") && !dateInput.includes("Z")) {
    const parsed = parseEthiopianDateString(dateInput);
    if (parsed) {
      const monthObj = ETHIOPIAN_MONTHS.find((m) => m.id === parsed.month) || ETHIOPIAN_MONTHS[0];
      const monthLabel = amharic ? monthObj.amharic : monthObj.name;
      if (format === "numeric") {
        return `${String(parsed.day).padStart(2, "0")}/${String(parsed.month).padStart(2, "0")}/${parsed.year} ዓ.ም.`;
      }
      return `${monthLabel} ${parsed.day}, ${parsed.year} ዓ.ም.`;
    }
  }

  // Otherwise convert from Date
  try {
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(d.getTime())) return "N/A";
    const eth = EthDateTime.fromEuropeanDate(d);
    const monthObj = ETHIOPIAN_MONTHS.find((m) => m.id === eth.month) || ETHIOPIAN_MONTHS[0];
    const monthLabel = amharic ? monthObj.amharic : monthObj.name;

    if (format === "numeric") {
      const base = `${String(eth.date).padStart(2, "0")}/${String(eth.month).padStart(2, "0")}/${eth.year}`;
      if (includeTime) {
        const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        return `${base} (${timeStr})`;
      }
      return `${base} ዓ.ም.`;
    }

    let result = `${monthLabel} ${eth.date}, ${eth.year}`;
    if (amharic) result += " ዓ.ም.";

    if (includeTime) {
      const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      result += ` ${timeStr}`;
    }
    return result;
  } catch {
    return "N/A";
  }
}

/**
 * Calculates years of service from permanentSince date, strictly based on the Ethiopian calendar.
 */
export function getYearsOfService(permanentSince: string | null | undefined): number {
  if (!permanentSince || permanentSince === "NaN" || permanentSince.trim() === "") return 0;

  const parsed = parseEthiopianDateString(permanentSince);
  if (!parsed) return 0;

  const ethNow = getCurrentEthiopianDate();

  // If the year entered is > current Ethiopian year, it was entered as Gregorian; convert it
  if (parsed.year > ethNow.year) {
    try {
      const gDate = new Date(parsed.year, parsed.month - 1, parsed.day);
      const convertedEth = gregorianToEthiopian(gDate);
      parsed.year = convertedEth.year;
      parsed.month = convertedEth.month;
      parsed.day = convertedEth.date;
    } catch {
      // ignore
    }
  }

  let years = ethNow.year - parsed.year;
  if (ethNow.month < parsed.month || (ethNow.month === parsed.month && ethNow.date < parsed.day)) {
    years--;
  }

  return Math.max(0, years);
}

/**
 * Calculates patient age based on Year of Birth (YOB) in Ethiopian Calendar.
 */
export function calculateAge(yob: string | null | undefined): string {
  if (!yob || yob === "NaN" || yob.trim() === "") return "N/A";
  const parsedYob = parseInt(yob, 10);
  if (isNaN(parsedYob)) return yob;

  // If user stored age directly (< 130)
  if (parsedYob >= 0 && parsedYob <= 125) {
    return parsedYob.toString();
  }

  const currentEthYear = getCurrentEthiopianYear();

  // If year is greater than current Ethiopian year, it's a Gregorian year; convert
  if (parsedYob > currentEthYear && parsedYob > 1900 && parsedYob <= 2100) {
    const approxEthYear = parsedYob - 8;
    const age = currentEthYear - approxEthYear;
    return Math.max(0, age).toString();
  }

  const age = currentEthYear - parsedYob;
  if (age < 0) return "0";
  return age.toString();
}

/**
 * Returns start of today in local time.
 */
export function getStartOfDayLocal(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}
