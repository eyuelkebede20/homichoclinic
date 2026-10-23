export interface MilitaryRankOption {
  value: string;
  label: string;
  amharic?: string;
  english?: string;
}

export interface MilitaryRankGroup {
  groupNameAm: string;
  groupNameEn: string;
  ranks: MilitaryRankOption[];
}

export const ETHIOPIAN_MILITARY_RANKS: MilitaryRankGroup[] = [
  {
    groupNameAm: "የሰራዊት አባላትና የበታች ሹማምንት",
    groupNameEn: "Enlisted & Non-Commissioned Officers",
    ranks: [
      { value: "መሠረታዊ ወታደር", label: "መሠረታዊ ወታደር" },
      { value: "ም/፲/አ", label: "ም/፲/አ" },
      { value: "፲/አ", label: "፲/አ" },
      { value: "፶/አ", label: "፶/አ" },
      { value: "መ/፶/አ", label: "መ/፶/አ" },
      { value: "ሻምበል ባሻ", label: "ሻምበል ባሻ" },
      { value: "ሻለቃ መጋቢ ባሻ", label: "ሻለቃ መጋቢ ባሻ" },
      { value: "ሻለቃ ባሻ", label: "ሻለቃ ባሻ" },
    ],
  },
  {
    groupNameAm: "የታችኛ መኮንኖች",
    groupNameEn: "Junior Officers",
    ranks: [
      { value: "ም/መ/አ", label: "ም/መ/አ" },
      { value: "መ/አ", label: "መ/አ" },
      { value: "ሻ/ምል", label: "ሻ/ምል" },
    ],
  },
  {
    groupNameAm: "የከፍተኛ መኮንኖች",
    groupNameEn: "Senior Officers",
    ranks: [
      { value: "ሻ/ቃ", label: "ሻ/ቃ" },
      { value: "ሌ/ኮል", label: "ሌ/ኮል (Lieutenant Colonel)" },
      { value: "ኮል", label: "ኮል (Colonel)" },
    ],
  },
  {
    groupNameAm: "የጄኔራል መኮንኖች",
    groupNameEn: "General Officers",
    ranks: [
      { value: "ብ/ጀል", label: "ብ/ጀል" },
      { value: "ሜ/ጀል", label: "ሜ/ጀል" },
      { value: "ሌ/ጀል", label: "ሌ/ጀል" },
      { value: "ጄል", label: "ጄል" },
      { value: "ፊልድ ማርሻል ጄኔራል", label: "ፊልድ ማርሻል ጄኔራል (Field Marshal General)" },
    ],
  },
];

export const ALL_MILITARY_RANK_VALUES = ETHIOPIAN_MILITARY_RANKS.flatMap((g) =>
  g.ranks.map((r) => r.value)
);

export const RANK_ALIASES: Record<string, string> = {
  // Aliases and legacy titles mapping to the official abbreviations
  "ምክትል አስር አለቃ": "ም/፲/አ",
  "አስር አለቃ": "፲/አ",
  "ኮርፖራል": "፲/አ",
  "corp": "፲/አ",
  "corporal": "፲/አ",
  "ሀምሳ አለቃ": "፶/አ",
  "ሳጅን": "፶/አ",
  "sergeant": "፶/አ",
  "መጋቢ ሀምሳ አለቃ": "መ/፶/አ",
  "ተራ ወታደር": "መሠረታዊ ወታደር",
  "private": "መሠረታዊ ወታደር",
  "ምክትል የመቶ አለቃ": "ም/መ/አ",
  "የመቶ አለቃ": "መ/አ",
  "መቶ አለቃ": "መ/አ",
  "ሻምበል": "ሻ/ምል",
  "ሻለቃ": "ሻ/ቃ",
  "ሌተናንት ኮሎኔል": "ሌ/ኮል",
  "ሌ/ኮል (lieutenant colonel)": "ሌ/ኮል",
  "ኮሎኔል": "ኮል",
  "ኮል (colonel)": "ኮል",
  "ብርጋዴር ጄኔራል": "ብ/ጀል",
  "ሜጀር ጄኔራል": "ሜ/ጀል",
  "ሌተናል ጄኔራል": "ሌ/ጀል",
  "ጄኔራል": "ጄል",
  "ፊልድ ማርሻል ጄኔራል (field marshal general)": "ፊልድ ማርሻል ጄኔራል",
};

export function resolveRankValue(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (ALL_MILITARY_RANK_VALUES.includes(trimmed)) {
    return trimmed;
  }
  const lower = trimmed.toLowerCase();
  if (RANK_ALIASES[lower]) {
    return RANK_ALIASES[lower];
  }
  return null;
}
