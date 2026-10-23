export interface MilitaryRankOption {
  value: string;
  amharic: string;
  english: string;
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
      { value: "መሠረታዊ ወታደር", amharic: "መሠረታዊ ወታደር", english: "Private / Basic Soldier" },
      { value: "ተራ ወታደር", amharic: "ተራ ወታደር", english: "Private" },
      { value: "ምክትል አስር አለቃ", amharic: "ምክትል አስር አለቃ", english: "Lance Corporal" },
      { value: "አስር አለቃ", amharic: "አስር አለቃ", english: "Corporal" },
      { value: "ኮርፖራል", amharic: "ኮርፖራል", english: "Corporal" },
      { value: "ሀምሳ አለቃ", amharic: "ሀምሳ አለቃ", english: "Sergeant" },
      { value: "ሳጅን", amharic: "ሳጅን", english: "Sergeant" },
      { value: "መጋቢ ሀምሳ አለቃ", amharic: "መጋቢ ሀምሳ አለቃ", english: "Staff Sergeant" },
      { value: "ሻምበል ባሻ", amharic: "ሻምበል ባሻ", english: "Master Sergeant" },
      { value: "ሻለቃ መጋቢ ባሻ", amharic: "ሻለቃ መጋቢ ባሻ", english: "Sergeant Major" },
      { value: "ሻለቃ ባሻ", amharic: "ሻለቃ ባሻ", english: "Command Sergeant Major" },
    ],
  },
  {
    groupNameAm: "የታችኛ መኮንኖች",
    groupNameEn: "Junior Officers",
    ranks: [
      { value: "ምክትል የመቶ አለቃ", amharic: "ምክትል የመቶ አለቃ", english: "2nd Lieutenant" },
      { value: "መቶ አለቃ", amharic: "መቶ አለቃ", english: "1st Lieutenant" },
      { value: "ሻምበል", amharic: "ሻምበል", english: "Captain" },
    ],
  },
  {
    groupNameAm: "የከፍተኛ መኮንኖች",
    groupNameEn: "Senior Officers",
    ranks: [
      { value: "ሻለቃ", amharic: "ሻለቃ", english: "Major" },
      { value: "ሌተናንት ኮሎኔል", amharic: "ሌተናንት ኮሎኔል", english: "Lieutenant Colonel" },
      { value: "ኮሎኔል", amharic: "ኮሎኔል", english: "Colonel" },
    ],
  },
  {
    groupNameAm: "የጄኔራል መኮንኖች",
    groupNameEn: "General Officers",
    ranks: [
      { value: "ብርጋዴር ጄኔራል", amharic: "ብርጋዴር ጄኔራል", english: "Brigadier General" },
      { value: "ሜጀር ጄኔራል", amharic: "ሜጀር ጄኔራል", english: "Major General" },
      { value: "ሌተናል ጄኔራል", amharic: "ሌተናል ጄኔራል", english: "Lieutenant General" },
      { value: "ጄኔራል", amharic: "ጄኔራል", english: "General" },
      { value: "ፊልድ ማርሻል ጄኔራል", amharic: "ፊልድ ማርሻል ጄኔራል", english: "Field Marshal General" },
    ],
  },
];

export const ALL_MILITARY_RANK_VALUES = ETHIOPIAN_MILITARY_RANKS.flatMap((g) =>
  g.ranks.map((r) => r.value)
);
