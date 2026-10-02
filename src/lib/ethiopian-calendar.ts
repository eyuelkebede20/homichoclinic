export function getECYearsOfService(permanentSince: string | null | undefined): number {
  if (!permanentSince || permanentSince === "NaN" || permanentSince.trim() === "") return 0;
  
  const match = permanentSince.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    const yearMatch = permanentSince.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      const pYear = parseInt(yearMatch[0], 10);
      const now = new Date();
      let ecYear = now.getFullYear() - 8;
      if (now.getMonth() + 1 > 9 || (now.getMonth() + 1 === 9 && now.getDate() >= 11)) {
        ecYear = now.getFullYear() - 7;
      }
      return Math.max(0, ecYear - pYear);
    }
    return 0;
  }

  const pYear = parseInt(match[1], 10);
  const pMonth = parseInt(match[2], 10);
  const pDay = parseInt(match[3], 10);

  const now = new Date();
  let ecYear = now.getFullYear() - 8;
  let newYearDate = new Date(now.getFullYear(), 8, 11); // Sept 11

  // Handle leap year for Gregorian (if next year is leap, Sept 12) - simplified
  if (now < newYearDate) {
    newYearDate = new Date(now.getFullYear() - 1, 8, 11);
  } else {
    ecYear = now.getFullYear() - 7;
  }

  const daysSinceNewYear = Math.floor((now.getTime() - newYearDate.getTime()) / 86400000);
  const currentECMonth = Math.floor(daysSinceNewYear / 30) + 1;
  const currentECDay = (daysSinceNewYear % 30) + 1;

  let years = ecYear - pYear;
  if (currentECMonth < pMonth || (currentECMonth === pMonth && currentECDay < pDay)) {
    years--;
  }

  return Math.max(0, years);
}
