export type ClinicDisease = {
  id: string;
  name: string;
  category: string;
  amharic?: string;
  code?: string;
};

export const DEFAULT_CLINIC_DISEASES: ClinicDisease[] = [
  // Respiratory
  { id: "dis-01", name: "Acute Upper Respiratory Tract Infection (URTI)", amharic: "የላይኛው የመተንፈሻ አካል ኢንፌክሽን", category: "Respiratory", code: "J06.9" },
  { id: "dis-02", name: "Acute Tonsillitis / Pharyngitis", amharic: "የቶንሲል ህመም", category: "Respiratory", code: "J03.9" },
  { id: "dis-03", name: "Community-Acquired Pneumonia", amharic: "የሳንባ ምች", category: "Respiratory", code: "J18.9" },
  { id: "dis-04", name: "Bronchial Asthma (Acute / Chronic)", amharic: "የአስም በሽታ", category: "Respiratory", code: "J45.9" },
  { id: "dis-05", name: "Acute Bronchitis", amharic: "አጣዳፊ የብሮንካይተስ በሽታ", category: "Respiratory", code: "J20.9" },
  { id: "dis-06", name: "Chronic Obstructive Pulmonary Disease (COPD)", amharic: "ሥር የሰደደ የመተንፈሻ ቧንቧ መዘጋት", category: "Respiratory", code: "J44.9" },

  // Gastrointestinal & Parasitic
  { id: "dis-07", name: "Acute Gastroenteritis (AGE)", amharic: "አጣዳፊ የተቅማጥና ማስመለስ በሽታ", category: "Gastrointestinal", code: "A09" },
  { id: "dis-08", name: "Typhoid Fever (Enteric Fever)", amharic: "የታይፎይድ ትኩሳት", category: "Gastrointestinal", code: "A01.0" },
  { id: "dis-09", name: "Paratyphoid Fever", amharic: "የፓራታይፎይድ ትኩሳት", category: "Gastrointestinal", code: "A01.4" },
  { id: "dis-10", name: "Amoebiasis / Amoebic Dysentery", amharic: "የአሜባ በሽታ / አሜባዊ ተቅማጥ", category: "Gastrointestinal", code: "A06.0" },
  { id: "dis-11", name: "Giardiasis", amharic: "የጃርዲያ በሽታ", category: "Gastrointestinal", code: "A07.1" },
  { id: "dis-12", name: "Peptic Ulcer Disease (PUD) / Gastritis", amharic: "የጨጓራ ቁስለት / የጨጓራ ህመም", category: "Gastrointestinal", code: "K27.9" },
  { id: "dis-13", name: "Gastroesophageal Reflux Disease (GERD)", amharic: "የጨጓራ አሲድ ወደ ጉሮሮ መመለስ", category: "Gastrointestinal", code: "K21.9" },
  { id: "dis-14", name: "Intestinal Helminthiasis / Parasitosis", amharic: "የሆድ ውስጥ ጥገኛ ትላትሎች", category: "Gastrointestinal", code: "B82.9" },
  { id: "dis-15", name: "Bacillary Dysentery / Shigellosis", amharic: "ባክቴሪያዊ ደም የተቀላቀለ ተቅማጥ", category: "Gastrointestinal", code: "A03.9" },

  // Infectious & Febrile
  { id: "dis-16", name: "Malaria (P. vivax / P. falciparum)", amharic: "የወባ በሽታ", category: "Infectious", code: "B54" },
  { id: "dis-17", name: "Urinary Tract Infection (UTI)", amharic: "የሽንት ቧንቧ ኢንፌክሽን", category: "Infectious", code: "N39.0" },
  { id: "dis-18", name: "Acute Pyelonephritis", amharic: "አጣዳፊ የኩላሊት ኢንፌክሽን", category: "Infectious", code: "N10" },
  { id: "dis-19", name: "Viral Syndrome / Non-specific Febrile Illness", amharic: "ቫይረሳዊ ትኩሳት", category: "Infectious", code: "B34.9" },
  { id: "dis-20", name: "Acute Viral Hepatitis", amharic: "አጣዳፊ የጉበት ኢንፌክሽን (ሄፓታይተስ)", category: "Infectious", code: "B19.9" },

  // Cardiovascular & Metabolic
  { id: "dis-21", name: "Essential Hypertension", amharic: "የደም ግፊት በሽታ", category: "Cardiovascular", code: "I10" },
  { id: "dis-22", name: "Type 2 Diabetes Mellitus", amharic: "ዓይነት 2 የስኳር በሽታ", category: "Endocrine", code: "E11.9" },
  { id: "dis-23", name: "Type 1 Diabetes Mellitus", amharic: "ዓይነት 1 የስኳር በሽታ", category: "Endocrine", code: "E10.9" },
  { id: "dis-24", name: "Dyslipidemia / Hypercholesterolemia", amharic: "ከፍተኛ የደም ውስጥ ቅባት", category: "Endocrine", code: "E78.5" },
  { id: "dis-25", name: "Ischemic Heart Disease / Angina Pectoris", amharic: "የልብ ደም ቧንቧ መጥበብ / የልብ ህመም", category: "Cardiovascular", code: "I20.9" },

  // Musculoskeletal & Occupational
  { id: "dis-26", name: "Musculoskeletal Strain / Low Back Pain", amharic: "የጡንቻና የወገብ / የጀርባ ህመም", category: "Musculoskeletal", code: "M54.5" },
  { id: "dis-27", name: "Osteoarthritis / Degenerative Joint Disease", amharic: "የመገጣጠሚያ አጥንት መበከል / ህመም", category: "Musculoskeletal", code: "M19.9" },
  { id: "dis-28", name: "Rheumatoid Arthritis", amharic: "ሩማቲክ የመገጣጠሚያ በሽታ", category: "Musculoskeletal", code: "M06.9" },
  { id: "dis-29", name: "Soft Tissue Injury / Contusion", amharic: "የለስላሳ አካል መጎዳት / መቁሰል", category: "Trauma", code: "T14.0" },
  { id: "dis-30", name: "Bone Fracture / Sprain", amharic: "የአጥንት ስብራት / መገጣጠሚያ መወላቀቅ", category: "Trauma", code: "T14.2" },

  // Dermatology & Allergy
  { id: "dis-31", name: "Allergic Contact Dermatitis / Eczema", amharic: "የቆዳ አለርጂ / ኤክዚማ", category: "Dermatology", code: "L23.9" },
  { id: "dis-32", name: "Fungal Skin Infection (Tinea / Ringworm)", amharic: "የቆዳ ፈንገስ ኢንፌክሽን", category: "Dermatology", code: "B35.9" },
  { id: "dis-33", name: "Scabies", amharic: "የእከክ በሽታ", category: "Dermatology", code: "B86" },
  { id: "dis-34", name: "Bacterial Skin Infection / Cellulitis", amharic: "የቆዳ ባክቴሪያ ኢንፌክሽን / ሴሉላይተስ", category: "Dermatology", code: "L03.9" },
  { id: "dis-35", name: "Acute Urticaria (Hives)", amharic: "የቆዳ ሽፍታ / ፎረፎር", category: "Allergy", code: "L50.9" },

  // Neurological, ENT & Dental
  { id: "dis-36", name: "Tension-Type Headache / Migraine", amharic: "የጭንቅላት / የራስ ምታት በሽታ", category: "Neurology", code: "G44.2" },
  { id: "dis-37", name: "Iron Deficiency Anemia", amharic: "የብረት እጥረት የደም ማነስ", category: "Hematology", code: "D50.9" },
  { id: "dis-38", name: "Acute Conjunctivitis", amharic: "የአይን ማበጥ / የአይን ኢንፌክሽን", category: "Ophthalmology", code: "H10.9" },
  { id: "dis-39", name: "Acute Otitis Media / Externa", amharic: "የጆሮ ህመም / ኢንፌክሽን", category: "ENT", code: "H66.9" },
  { id: "dis-40", name: "Dental Caries / Pulpitis", amharic: "የጥርስ መቦርቦር / የጥርስ ህመም", category: "Dental", code: "K02.9" }
];
