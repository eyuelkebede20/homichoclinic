export function getYearsOfService(permanentSince: string | null | undefined): number {
  if (!permanentSince || permanentSince === "NaN" || permanentSince.trim() === "") return 0;
  
  const match = permanentSince.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    const yearMatch = permanentSince.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      const pYear = parseInt(yearMatch[0], 10);
      const now = new Date();
      return Math.max(0, now.getFullYear() - pYear);
    }
    return 0;
  }

  const pYear = parseInt(match[1], 10);
  const pMonth = parseInt(match[2], 10);
  const pDay = parseInt(match[3], 10);

  const now = new Date();
  
  let years = now.getFullYear() - pYear;
  if (now.getMonth() + 1 < pMonth || (now.getMonth() + 1 === pMonth && now.getDate() < pDay)) {
    years--;
  }

  return Math.max(0, years);
}

export function calculateAge(yob: string | null | undefined): string {
  if (!yob || yob === "NaN" || yob.trim() === "") return "N/A";
  const parsedYob = parseInt(yob, 10);
  if (isNaN(parsedYob)) return yob; // fallback if it's some text

  const now = new Date();
  const currentYear = now.getFullYear();

  const age = currentYear - parsedYob;
  if (age < 0) return "0";
  return age.toString();
}

export function getStartOfDayLocal(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}
