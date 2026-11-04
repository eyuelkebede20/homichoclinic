export type ClinicSymptom = {
  id: string;
  name: string;
  amharic: string;
  category: "General" | "Respiratory" | "Gastrointestinal" | "Musculoskeletal" | "Neurological" | "Urogenital" | "ENT" | "Dermatology";
  isTopCommon?: boolean;
};

/**
 * High-frequency common presenting symptoms in general clinical outpatient practice.
 * Includes the original 8 core symptoms plus clinical staples with Amharic translations.
 */
export const DEFAULT_TOP_SYMPTOMS: ClinicSymptom[] = [
  { id: "symp-01", name: "Headache", amharic: "የራስ ምታት", category: "Neurological", isTopCommon: true },
  { id: "symp-02", name: "Fever", amharic: "ትኩሳት", category: "General", isTopCommon: true },
  { id: "symp-03", name: "Cough", amharic: "ሳል", category: "Respiratory", isTopCommon: true },
  { id: "symp-04", name: "Stomachache", amharic: "የሆድ ህመም", category: "Gastrointestinal", isTopCommon: true },
  { id: "symp-05", name: "Chest Pain", amharic: "የደረት ህመም", category: "Respiratory", isTopCommon: true },
  { id: "symp-06", name: "Dizziness", amharic: "የማዞር ስሜት", category: "Neurological", isTopCommon: true },
  { id: "symp-07", name: "Nausea", amharic: "ማቅለሽለሽ", category: "Gastrointestinal", isTopCommon: true },
  { id: "symp-08", name: "Vomiting", amharic: "ማስመለስ", category: "Gastrointestinal", isTopCommon: true },
  { id: "symp-09", name: "Fatigue", amharic: "የድካም ስሜት", category: "General", isTopCommon: true },
  { id: "symp-10", name: "Back Pain", amharic: "የወገብ ህመም", category: "Musculoskeletal", isTopCommon: true },
  { id: "symp-11", name: "Shortness of Breath", amharic: "የመተንፈስ ችግር", category: "Respiratory", isTopCommon: true },
  { id: "symp-12", name: "Diarrhea", amharic: "ተቅማጥ", category: "Gastrointestinal", isTopCommon: true },
  { id: "symp-13", name: "Sore Throat", amharic: "የጉሮሮ ህመም", category: "ENT", isTopCommon: true },
  { id: "symp-14", name: "Joint Pain", amharic: "የመገጣጠሚያ ህመም", category: "Musculoskeletal", isTopCommon: true },
  { id: "symp-15", name: "Chills", amharic: "ብርድ ብርድ ማለት", category: "General", isTopCommon: true },
  { id: "symp-16", name: "Loss of Appetite", amharic: "የምግብ ፍላጎት ማጣት", category: "General", isTopCommon: true },
];

/**
 * Extended comprehensive clinical catalog of symptoms categorized by anatomical system.
 */
export const ALL_CLINICAL_SYMPTOMS: ClinicSymptom[] = [
  ...DEFAULT_TOP_SYMPTOMS,
  // General & Systemic
  { id: "symp-17", name: "Body Weakness", amharic: "የሰውነት መዛል", category: "General" },
  { id: "symp-18", name: "Night Sweats", amharic: "የሌሊት ላብ", category: "General" },
  { id: "symp-19", name: "Weight Loss", amharic: "የክብደት መቀነስ", category: "General" },
  { id: "symp-20", name: "Insomnia", amharic: "የእንቅልፍ እጦት", category: "General" },
  { id: "symp-21", name: "Generalized Body Pain", amharic: "አጠቃላይ የሰውነት ህመም", category: "General" },

  // Respiratory & ENT
  { id: "symp-22", name: "Runny Nose / Cold", amharic: "የአፍንጫ ፍሳሽ / ጉንፋን", category: "ENT" },
  { id: "symp-23", name: "Nasal Congestion", amharic: "የአፍንጫ መታፈን", category: "ENT" },
  { id: "symp-24", name: "Wheezing", amharic: "የመተንፈሻ ቧንቧ ማፏጨት", category: "Respiratory" },
  { id: "symp-25", name: "Sputum Production", amharic: "አክታ ማመንጨት", category: "Respiratory" },
  { id: "symp-26", name: "Ear Pain / Discharge", amharic: "የጆሮ ህመም / ፈሳሽ", category: "ENT" },
  { id: "symp-27", name: "Sneezing", amharic: "ማስነጠስ", category: "ENT" },

  // Gastrointestinal
  { id: "symp-28", name: "Heartburn / Acid Reflux", amharic: "ቃር / የጨጓራ አሲድ", category: "Gastrointestinal" },
  { id: "symp-29", name: "Abdominal Bloating", amharic: "የሆድ መነፋት", category: "Gastrointestinal" },
  { id: "symp-30", name: "Constipation", amharic: "የሆድ ድርቀት", category: "Gastrointestinal" },
  { id: "symp-31", name: "Epigastric Burning Pain", amharic: "የጨጓራ አካባቢ ማቃጠል", category: "Gastrointestinal" },
  { id: "symp-32", name: "Bloody Stool / Melena", amharic: "ደም የተቀላቀለ ሰገራ", category: "Gastrointestinal" },

  // Musculoskeletal
  { id: "symp-33", name: "Neck Stiffness / Pain", amharic: "የአንገት ህመም / መወጠር", category: "Musculoskeletal" },
  { id: "symp-34", name: "Muscle Cramps", amharic: "የጡንቻ መሸማቀቅ", category: "Musculoskeletal" },
  { id: "symp-35", name: "Shoulder Pain", amharic: "የትከሻ ህመም", category: "Musculoskeletal" },
  { id: "symp-36", name: "Knee Pain", amharic: "የጉልበት ህመም", category: "Musculoskeletal" },

  // Neurological & Sensory
  { id: "symp-37", name: "Numbness / Tingling", amharic: "የመደንዘዝ / የመኮርኮር ስሜት", category: "Neurological" },
  { id: "symp-38", name: "Blurred Vision", amharic: "የእይታ መደብዘዝ", category: "Neurological" },
  { id: "symp-39", name: "Tremors / Shaking", amharic: "መንቀጥቀጥ", category: "Neurological" },

  // Urogenital
  { id: "symp-40", name: "Dysuria (Painful Urination)", amharic: "በሽንት ጊዜ ማቃጠል", category: "Urogenital" },
  { id: "symp-41", name: "Frequent Urination", amharic: "ተደጋጋሚ ሽንት", category: "Urogenital" },
  { id: "symp-42", name: "Flank Pain", amharic: "የጎን / የኩላሊት ህመም", category: "Urogenital" },
  { id: "symp-43", name: "Hematuria (Blood in Urine)", amharic: "ደም የቀላቀለ ሽንት", category: "Urogenital" },

  // Dermatology
  { id: "symp-44", name: "Skin Rash / Itching", amharic: "የቆዳ ሽፍታ / ማሳከክ", category: "Dermatology" },
  { id: "symp-45", name: "Skin Lesion / Swelling", amharic: "የቆዳ እባጭ / እብጠት", category: "Dermatology" },
];

/**
 * Common clinical modifiers for duration, onset, and severity that doctors frequently append.
 */
export const CLINICAL_SYMPTOM_MODIFIERS = [
  { label: "for 1-2 days", category: "duration" },
  { label: "for 3-5 days", category: "duration" },
  { label: "for 1 week", category: "duration" },
  { label: "for >2 weeks", category: "duration" },
  { label: "Sudden onset", category: "onset" },
  { label: "Gradual onset", category: "onset" },
  { label: "Mild", category: "severity" },
  { label: "Moderate", category: "severity" },
  { label: "Severe", category: "severity" },
  { label: "Intermittent", category: "pattern" },
  { label: "Worse at night", category: "pattern" },
  { label: "Recurrent", category: "pattern" },
];
