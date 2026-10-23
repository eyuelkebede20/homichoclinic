export type ClinicDisease = {
  id: string;
  name: string;
  category: string;
  amharic?: string;
  code?: string;
  isCommon?: boolean;
};

export const DEFAULT_CLINIC_DISEASES: ClinicDisease[] = [
  // ────────────────────────────────────────────────────────────
  // 1. RESPIRATORY DISEASES (20+)
  // ────────────────────────────────────────────────────────────
  { id: "dis-001", name: "Acute Upper Respiratory Tract Infection (URTI)", amharic: "የላይኛው የመተንፈሻ አካል ኢንፌክሽን", category: "Respiratory", code: "J06.9", isCommon: true },
  { id: "dis-002", name: "Acute Tonsillitis / Pharyngitis", amharic: "አጣዳፊ የቶንሲልና የጉሮሮ ህመም", category: "Respiratory", code: "J03.9", isCommon: true },
  { id: "dis-003", name: "Community-Acquired Pneumonia (CAP)", amharic: "የሳንባ ምች በሽታ", category: "Respiratory", code: "J18.9", isCommon: true },
  { id: "dis-004", name: "Bronchial Asthma (Acute / Chronic)", amharic: "የአስም በሽታ", category: "Respiratory", code: "J45.9", isCommon: true },
  { id: "dis-005", name: "Acute Bronchitis", amharic: "አጣዳፊ የብሮንካይተስ በሽታ", category: "Respiratory", code: "J20.9", isCommon: true },
  { id: "dis-006", name: "Chronic Obstructive Pulmonary Disease (COPD)", amharic: "ሥር የሰደደ የመተንፈሻ ቧንቧ መዘጋት", category: "Respiratory", code: "J44.9" },
  { id: "dis-007", name: "Acute Sinusitis (Rhinosinusitis)", amharic: "አጣዳፊ የሳይነስ ኢንፌክሽን", category: "Respiratory", code: "J01.9" },
  { id: "dis-008", name: "Chronic Bronchitis", amharic: "ሥር የሰደደ የብሮንካይተስ በሽታ", category: "Respiratory", code: "J42" },
  { id: "dis-009", name: "Acute Laryngitis and Tracheitis", amharic: "የጉሮሮና የመተንፈሻ ቧንቧ ማበጥ", category: "Respiratory", code: "J04.0" },
  { id: "dis-010", name: "Influenza / Flu Syndrome", amharic: "የጉንፋን / ኢንፍሉዌንዛ ቫይረስ", category: "Respiratory", code: "J11.1", isCommon: true },
  { id: "dis-011", name: "Pleural Effusion", amharic: "በሳንባ ሽፋን ውስጥ ውሀ መቋጠር", category: "Respiratory", code: "J90" },
  { id: "dis-012", name: "Acute Pleurisy / Pleuritic Chest Pain", amharic: "የሳንባ ሽፋን ህመም", category: "Respiratory", code: "R07.1" },
  { id: "dis-013", name: "Bronchiectasis", amharic: "የመተንፈሻ ቧንቧ መስፋፋት", category: "Respiratory", code: "J47" },
  { id: "dis-014", name: "Aspiration Pneumonia", amharic: "የምግብ / ፈሳሽ ወደ ሳንባ መግባት ምች", category: "Respiratory", code: "J69.0" },
  { id: "dis-015", name: "Pulmonary Embolism", amharic: "የሳንባ ደም ቧንቧ መርጋት / መዘጋት", category: "Respiratory", code: "I26.9" },
  { id: "dis-016", name: "Allergic Rhinitis / Hay Fever", amharic: "የአፍንጫ አለርጂ", category: "Respiratory", code: "J30.4", isCommon: true },
  { id: "dis-017", name: "Acute Bronchiolitis (Pediatric)", amharic: "አጣዳፊ የህፃናት ብሮንኪዮላይተስ", category: "Respiratory", code: "J21.9" },
  { id: "dis-018", name: "Croup (Laryngotracheobronchitis)", amharic: "የህፃናት የመተንፈሻ ድምፅ ማፈን", category: "Respiratory", code: "J05.0" },
  { id: "dis-019", name: "Post-Infectious Chronic Cough", amharic: "ከበሽታ በኋላ የሚቆይ ሳል", category: "Respiratory", code: "R05" },
  { id: "dis-020", name: "Hemoptysis (Coughing Blood)", amharic: "ደም የቀላቀለ ሳል", category: "Respiratory", code: "R04.2" },

  // ────────────────────────────────────────────────────────────
  // 2. GASTROINTESTINAL & HEPATOBILIARY (25+)
  // ────────────────────────────────────────────────────────────
  { id: "dis-021", name: "Acute Gastroenteritis (AGE)", amharic: "አጣዳፊ የተቅማጥና ማስመለስ በሽታ", category: "Gastrointestinal", code: "A09", isCommon: true },
  { id: "dis-022", name: "Typhoid Fever (Enteric Fever)", amharic: "የታይፎይድ ትኩሳት", category: "Gastrointestinal", code: "A01.0", isCommon: true },
  { id: "dis-023", name: "Paratyphoid Fever", amharic: "የፓራታይፎይድ ትኩሳት", category: "Gastrointestinal", code: "A01.4" },
  { id: "dis-024", name: "Amoebiasis / Amoebic Dysentery", amharic: "የአሜባ በሽታ / አሜባዊ ተቅማጥ", category: "Gastrointestinal", code: "A06.0", isCommon: true },
  { id: "dis-025", name: "Giardiasis", amharic: "የጃርዲያ በሽታ", category: "Gastrointestinal", code: "A07.1", isCommon: true },
  { id: "dis-026", name: "Peptic Ulcer Disease (PUD) / Gastritis", amharic: "የጨጓራ ቁስለት / የጨጓራ ህመም", category: "Gastrointestinal", code: "K27.9", isCommon: true },
  { id: "dis-027", name: "Gastroesophageal Reflux Disease (GERD)", amharic: "የጨጓራ አሲድ ወደ ጉሮሮ መመለስ", category: "Gastrointestinal", code: "K21.9", isCommon: true },
  { id: "dis-028", name: "Intestinal Helminthiasis / Parasitosis", amharic: "የሆድ ውስጥ ጥገኛ ትላትሎች", category: "Gastrointestinal", code: "B82.9", isCommon: true },
  { id: "dis-029", name: "Ascariasis (Roundworm Infection)", amharic: "የአስካሪስ ትላትል ኢንፌክሽን", category: "Gastrointestinal", code: "B77.9" },
  { id: "dis-030", name: "Hookworm Infection (Ancylostomiasis)", amharic: "የመንጠቆ ትላትል በሽታ", category: "Gastrointestinal", code: "B76.9" },
  { id: "dis-031", name: "Taeniasis (Tapeworm / Kosso)", amharic: "የኮሶ ትላትል በሽታ", category: "Gastrointestinal", code: "B68.9" },
  { id: "dis-032", name: "Bacillary Dysentery / Shigellosis", amharic: "ባክቴሪያዊ ደም የተቀላቀለ ተቅማጥ", category: "Gastrointestinal", code: "A03.9" },
  { id: "dis-033", name: "Acute Appendicitis", amharic: "አጣዳፊ የትርፍ አንጀት ህመም", category: "Gastrointestinal", code: "K35.8" },
  { id: "dis-034", name: "Acute Cholecystitis / Gallbladder Inflammation", amharic: "አጣዳፊ የሀሞት ከረጢት እብጠት", category: "Gastrointestinal", code: "K81.0" },
  { id: "dis-035", name: "Cholelithiasis (Gallstones)", amharic: "የሀሞት ከረጢት ጠጠር", category: "Gastrointestinal", code: "K80.2" },
  { id: "dis-036", name: "Acute Pancreatitis", amharic: "አጣዳፊ የቆሽት እብጠት", category: "Gastrointestinal", code: "K85.9" },
  { id: "dis-037", name: "Irritable Bowel Syndrome (IBS)", amharic: "የአንጀት መነጫነጭ ህመም", category: "Gastrointestinal", code: "K58.9" },
  { id: "dis-038", name: "Hemorrhoids (Piles)", amharic: "የኪንታሮት በሽታ", category: "Gastrointestinal", code: "K64.9", isCommon: true },
  { id: "dis-039", name: "Anal Fissure / Fistula", amharic: "የፊንጢጣ መሰንጠቅ / መቁሰል", category: "Gastrointestinal", code: "K60.2" },
  { id: "dis-040", name: "Acute Liver Injury / Hepatitis (Viral / Toxic)", amharic: "አጣዳፊ የጉበት ኢንፌክሽን / መጎዳት", category: "Gastrointestinal", code: "B19.9" },
  { id: "dis-041", name: "Chronic Liver Disease / Cirrhosis", amharic: "ሥር የሰደደ የጉበት በሽታ / ሰረሆሲስ", category: "Gastrointestinal", code: "K74.6" },
  { id: "dis-042", name: "Upper Gastrointestinal Bleeding", amharic: "የላይኛው የጨጓራና አንጀት ደም መፍሰስ", category: "Gastrointestinal", code: "K92.2" },
  { id: "dis-043", name: "Lower Gastrointestinal Bleeding / Hematochezia", amharic: "የታችኛው አንጀት ደም መፍሰስ", category: "Gastrointestinal", code: "K92.1" },
  { id: "dis-044", name: "Constipation (Functional / Chronic)", amharic: "የሆድ ድርቀት", category: "Gastrointestinal", code: "K59.0" },
  { id: "dis-045", name: "Intestinal Obstruction", amharic: "የአንጀት መታጠፍ / መዘጋት", category: "Gastrointestinal", code: "K56.6" },
  { id: "dis-046", name: "Peritonitis (Acute Abdomen)", amharic: "የሆድ ሽፋን አጣዳፊ ኢንፌክሽን", category: "Gastrointestinal", code: "K65.0" },

  // ────────────────────────────────────────────────────────────
  // 3. INFECTIOUS, FEBRILE & VECTOR-BORNE (25+)
  // ────────────────────────────────────────────────────────────
  { id: "dis-047", name: "Malaria (Plasmodium vivax)", amharic: "የወባ በሽታ (ፕላስሞዲየም ቫይቫክስ)", category: "Infectious", code: "B51.9", isCommon: true },
  { id: "dis-048", name: "Malaria (Plasmodium falciparum)", amharic: "የወባ በሽታ (ፋልሲፓረም - ከባድ)", category: "Infectious", code: "B50.9", isCommon: true },
  { id: "dis-049", name: "Severe / Complicated Malaria", amharic: "አደገኛ / ውስብስብ የወባ በሽታ", category: "Infectious", code: "B50.0" },
  { id: "dis-050", name: "Relapsing Fever (Louse-borne / Tick-borne)", amharic: "የተስቦ / የተደጋጋሚ ትኩሳት በሽታ", category: "Infectious", code: "A68.9" },
  { id: "dis-051", name: "Typhus (Epidemic / Endemic Murine)", amharic: "የታይፈስ በሽታ", category: "Infectious", code: "A75.9", isCommon: true },
  { id: "dis-052", name: "Pulmonary Tuberculosis (PTB)", amharic: "የሳንባ ነቀርሳ (ቲቢ)", category: "Infectious", code: "A15.0" },
  { id: "dis-053", name: "Extrapulmonary Tuberculosis (EPTB / TB Lymphadenitis)", amharic: "የእጢ / የሰውነት ክፍሎች ነቀርሳ (ቲቢ)", category: "Infectious", code: "A18.2" },
  { id: "dis-054", name: "HIV / AIDS Related Clinical Condition", amharic: "ኤች አይ ቪ / ኤድስ ተዛማጅ ህመም", category: "Infectious", code: "B24" },
  { id: "dis-055", name: "Visceral Leishmaniasis (Kala-azar)", amharic: "ካላ-አዛር (የውስጥ አካል ሌሽማኒያስስ)", category: "Infectious", code: "B55.0" },
  { id: "dis-056", name: "Cutaneous Leishmaniasis (Oriental Sore)", amharic: "የቆዳ ቁስለት ሌሽማኒያስስ", category: "Infectious", code: "B55.1" },
  { id: "dis-057", name: "Schistosomiasis / Bilharziasis (Urinary / Intestinal)", amharic: "የቢልሀርዚያ በሽታ", category: "Infectious", code: "B65.9" },
  { id: "dis-058", name: "Rabies Exposure / Potential Rabid Animal Bite", amharic: "የእብድ ውሻ ንክሻ / ራቢስ ተጋላጭነት", category: "Infectious", code: "A82.9" },
  { id: "dis-059", name: "Tetanus (Lockjaw)", amharic: "የመንጋጋ ቆልፍ / ቴታነስ", category: "Infectious", code: "A35" },
  { id: "dis-060", name: "Brucellosis (Malta Fever)", amharic: "የብሩሴሎሲስ በሽታ (ከእንስሳት የሚተላለፍ)", category: "Infectious", code: "A23.9" },
  { id: "dis-061", name: "Anthrax (Cutaneous / Gastrointestinal)", amharic: "የቁስል / የቁርባ አባለዘር በሽታ (አንትራክስ)", category: "Infectious", code: "A22.9" },
  { id: "dis-062", name: "Varicella (Chickenpox)", amharic: "የፈንጣጣ / ኩፍኝ መሰል ሽፍታ", category: "Infectious", code: "B01.9" },
  { id: "dis-063", name: "Measles (Rubeola)", amharic: "የኩፍኝ በሽታ", category: "Infectious", code: "B05.9" },
  { id: "dis-064", name: "Mumps (Infectious Parotitis)", amharic: "የጉንፋን እጢ / ማምፕስ", category: "Infectious", code: "B26.9" },
  { id: "dis-065", name: "Herpes Zoster (Shingles)", amharic: "የአልማዝ ባለጭራ / ሽንግልስ", category: "Infectious", code: "B02.9" },
  { id: "dis-066", name: "Herpes Simplex Infection (Oral / Labial)", amharic: "የከንፈር / የአፍ ቁስለት ቫይረስ", category: "Infectious", code: "B00.9" },
  { id: "dis-067", name: "Bacterial Meningitis (Acute)", amharic: "አጣዳፊ የአንጎል ሽፋን ባክቴሪያ ህመም", category: "Infectious", code: "G00.9" },
  { id: "dis-068", name: "Viral Meningitis / Encephalitis", amharic: "ቫይረሳዊ የአንጎል ሽፋን እብጠት", category: "Infectious", code: "A87.9" },
  { id: "dis-069", name: "Sepsis / Septicemia (Severe Infection)", amharic: "የደም ውስጥ መመረዝ (ሴፕሲስ)", category: "Infectious", code: "A41.9" },
  { id: "dis-070", name: "Viral Syndrome / Non-specific Febrile Illness", amharic: "ቫይረሳዊ ትኩሳት", category: "Infectious", code: "B34.9", isCommon: true },
  { id: "dis-071", name: "Dengue Fever / Arboviral Disease", amharic: "የዴንጊ ትኩሳት", category: "Infectious", code: "A90" },
  { id: "dis-072", name: "Scabies Infestation", amharic: "የእከክ በሽታ", category: "Infectious", code: "B86", isCommon: true },

  // ────────────────────────────────────────────────────────────
  // 4. CARDIOVASCULAR & HEMATOLOGIC (20+)
  // ────────────────────────────────────────────────────────────
  { id: "dis-073", name: "Essential (Primary) Hypertension", amharic: "የደም ግፊት በሽታ", category: "Cardiovascular", code: "I10", isCommon: true },
  { id: "dis-074", name: "Hypertensive Heart Disease / Failure", amharic: "በደም ግፊት ሳቢያ የሚመጣ የልብ ህመም", category: "Cardiovascular", code: "I11.9" },
  { id: "dis-075", name: "Hypertensive Urgency / Crisis", amharic: "ከፍተኛና አስቸኳይ የደም ግፊት መጨመር", category: "Cardiovascular", code: "I16.9" },
  { id: "dis-076", name: "Ischemic Heart Disease / Angina Pectoris", amharic: "የልብ ደም ቧንቧ መጥበብ / የደረት ህመም", category: "Cardiovascular", code: "I20.9", isCommon: true },
  { id: "dis-077", name: "Acute Myocardial Infarction (Heart Attack)", amharic: "አጣዳፊ የልብ ድካም ጥቃት", category: "Cardiovascular", code: "I21.9" },
  { id: "dis-078", name: "Congestive Heart Failure (CHF)", amharic: "የልብ ድካም በሽታ", category: "Cardiovascular", code: "I50.9", isCommon: true },
  { id: "dis-079", name: "Rheumatic Heart Disease (Valvular)", amharic: "ሩማቲክ የልብ ቫልቭ በሽታ", category: "Cardiovascular", code: "I09.9" },
  { id: "dis-080", name: "Acute Rheumatic Fever", amharic: "አጣዳፊ የሩማቲክ ትኩሳት", category: "Cardiovascular", code: "I00" },
  { id: "dis-081", name: "Atrial Fibrillation / Cardiac Arrhythmia", amharic: "የልብ ምት መዛባት", category: "Cardiovascular", code: "I48.9" },
  { id: "dis-082", name: "Deep Vein Thrombosis (DVT)", amharic: "የእግር ደም ስር መርጋት", category: "Cardiovascular", code: "I80.2" },
  { id: "dis-083", name: "Varicose Veins of Lower Extremities", amharic: "የእግር ላይ የተወጠሩ ደም ስሮች", category: "Cardiovascular", code: "I83.9" },
  { id: "dis-084", name: "Peripheral Vascular Disease (PVD)", amharic: "የእጅና እግር የደም ቧንቧ በሽታ", category: "Cardiovascular", code: "I73.9" },
  { id: "dis-085", name: "Hypotension (Low Blood Pressure)", amharic: "ዝቅተኛ የደም ግፊት", category: "Cardiovascular", code: "I95.9" },
  { id: "dis-086", name: "Iron Deficiency Anemia", amharic: "የብረት እጥረት የደም ማነስ", category: "Hematology", code: "D50.9", isCommon: true },
  { id: "dis-087", name: "Megaloblastic Anemia (Vitamin B12/Folate)", amharic: "የቫይታሚን ቢ12/ፎሌት እጥረት የደም ማነስ", category: "Hematology", code: "D53.9" },
  { id: "dis-088", name: "Anemia of Chronic Disease", amharic: "ሥር በሰደደ በሽታ ሳቢያ የሚመጣ የደም ማነስ", category: "Hematology", code: "D63.8" },
  { id: "dis-089", name: "Sickle Cell Disease / Crisis", amharic: "የሲክል ሴል የደም ህመም", category: "Hematology", code: "D57.1" },
  { id: "dis-090", name: "Thrombocytopenia (Low Platelets)", amharic: "የደም ፕሌትሌት ማነስ", category: "Hematology", code: "D69.6" },
  { id: "dis-091", name: "Leukopenia / Neutropenia", amharic: "የነጭ የደም ሴሎች ማነስ", category: "Hematology", code: "D70.9" },
  { id: "dis-092", name: "Lymphadenopathy (Generalized / Localized)", amharic: "የእጢዎች እብጠት", category: "Hematology", code: "R59.9" },

  // ────────────────────────────────────────────────────────────
  // 5. ENDOCRINE, METABOLIC & NUTRITIONAL (15+)
  // ────────────────────────────────────────────────────────────
  { id: "dis-093", name: "Type 2 Diabetes Mellitus", amharic: "ዓይነት 2 የስኳር በሽታ", category: "Endocrine", code: "E11.9", isCommon: true },
  { id: "dis-094", name: "Type 1 Diabetes Mellitus", amharic: "ዓይነት 1 የስኳር በሽታ", category: "Endocrine", code: "E10.9" },
  { id: "dis-095", name: "Diabetic Ketoacidosis (DKA)", amharic: "ከፍተኛ የስኳር መጠን መመረዝ (ዲኬኤ)", category: "Endocrine", code: "E10.1" },
  { id: "dis-096", name: "Hypoglycemia (Low Blood Glucose)", amharic: "ዝቅተኛ የስኳር መጠን", category: "Endocrine", code: "E16.2", isCommon: true },
  { id: "dis-097", name: "Dyslipidemia / Hypercholesterolemia", amharic: "ከፍተኛ የደም ውስጥ ቅባት", category: "Endocrine", code: "E78.5", isCommon: true },
  { id: "dis-098", name: "Hypothyroidism (Primary)", amharic: "የታይሮይድ እጢ አነስተኛ ስራ", category: "Endocrine", code: "E03.9" },
  { id: "dis-099", name: "Hyperthyroidism / Thyrotoxicosis", amharic: "የታይሮይድ እጢ ከመጠን በላይ መስራት", category: "Endocrine", code: "E05.9" },
  { id: "dis-100", name: "Non-Toxic Simple Goiter", amharic: "እንቅርት (ቀላል የታይሮይድ እጢ እብጠት)", category: "Endocrine", code: "E04.0" },
  { id: "dis-101", name: "Severe Acute Malnutrition (SAM / Kwashiorkor / Marasmus)", amharic: "ከባድ የተመጣጠነ ምግብ እጥረት", category: "Endocrine", code: "E43" },
  { id: "dis-102", name: "Moderate Acute Malnutrition (MAM)", amharic: "መካከለኛ የተመጣጠነ ምግብ እጥረት", category: "Endocrine", code: "E44.0" },
  { id: "dis-103", name: "Vitamin D Deficiency / Rickets", amharic: "የቫይታሚን ዲ እጥረት / ሪኬትስ", category: "Endocrine", code: "E55.0" },
  { id: "dis-104", name: "Vitamin B Complex / Thiamine Deficiency", amharic: "የቫይታሚን ቢ እጥረት", category: "Endocrine", code: "E56.9" },
  { id: "dis-105", name: "Gout / Hyperuricemia", amharic: "የጋውት / ዩሪክ አሲድ መገጣጠሚያ ህመም", category: "Endocrine", code: "M10.9", isCommon: true },
  { id: "dis-106", name: "Obesity / Metabolic Syndrome", amharic: "ከመጠን ያለፈ ውፍረት", category: "Endocrine", code: "E66.9" },
  { id: "dis-107", name: "Cushing's Syndrome", amharic: "የኩሺንግ ሲንድረም", category: "Endocrine", code: "E24.9" },

  // ────────────────────────────────────────────────────────────
  // 6. MUSCULOSKELETAL & CONNECTIVE TISSUE (15+)
  // ────────────────────────────────────────────────────────────
  { id: "dis-108", name: "Musculoskeletal Strain / Low Back Pain", amharic: "የጡንቻና የወገብ / የጀርባ ህመም", category: "Musculoskeletal", code: "M54.5", isCommon: true },
  { id: "dis-109", name: "Cervical Spondylosis / Neck Pain", amharic: "የአንገት አጥንት መበከል / ህመም", category: "Musculoskeletal", code: "M47.8", isCommon: true },
  { id: "dis-110", name: "Lumbar Radiculopathy / Sciatica", amharic: "የወገብ ነርቭ መቆንጠጥ (ሳይያቲካ)", category: "Musculoskeletal", code: "M54.3" },
  { id: "dis-111", name: "Osteoarthritis of Knee / Hip", amharic: "የጉልበት / የመገጣጠሚያ አጥንት መበከል", category: "Musculoskeletal", code: "M17.9", isCommon: true },
  { id: "dis-112", name: "Rheumatoid Arthritis", amharic: "ሩማቶይድ የመገጣጠሚያ በሽታ", category: "Musculoskeletal", code: "M06.9" },
  { id: "dis-113", name: "Septic Arthritis (Acute)", amharic: "ባክቴሪያዊ የመገጣጠሚያ ኢንፌክሽን", category: "Musculoskeletal", code: "M00.9" },
  { id: "dis-114", name: "Osteomyelitis (Acute / Chronic)", amharic: "የአጥንት ውስጥ ባክቴሪያ ኢንፌክሽን", category: "Musculoskeletal", code: "M86.9" },
  { id: "dis-115", name: "Tendinitis / Tenosynovitis", amharic: "የጅማት ማበጥ / ህመም", category: "Musculoskeletal", code: "M65.9" },
  { id: "dis-116", name: "Plantar Fasciitis / Heel Spur", amharic: "የተረከዝ ስር ህመም", category: "Musculoskeletal", code: "M72.2" },
  { id: "dis-117", name: "Frozen Shoulder (Adhesive Capsulitis)", amharic: "የትከሻ መገጣጠሚያ መድረቅ / ህመም", category: "Musculoskeletal", code: "M75.0" },
  { id: "dis-118", name: "Carpal Tunnel Syndrome", amharic: "የእጅ አንጓ ነርቭ መቆንጠጥ", category: "Musculoskeletal", code: "G56.0" },
  { id: "dis-119", name: "Myalgia / Generalized Muscle Ache", amharic: "አጠቃላይ የጡንቻ ህመም", category: "Musculoskeletal", code: "M79.1", isCommon: true },
  { id: "dis-120", name: "Costochondritis (Chest Wall Pain)", amharic: "የጎድን አጥንት መጋጠሚያ ህመም", category: "Musculoskeletal", code: "M94.0" },
  { id: "dis-121", name: "Systemic Lupus Erythematosus (SLE)", amharic: "ሉፐስ (የሰውነት በሽታ መከላከያ መዛባት)", category: "Musculoskeletal", code: "M32.9" },
  { id: "dis-122", name: "Fibromyalgia", amharic: "ፋይብሮማያልጂያ (ሥር የሰደደ የጡንቻ ህመም)", category: "Musculoskeletal", code: "M79.7" },

  // ────────────────────────────────────────────────────────────
  // 7. DERMATOLOGY & ALLERGY (18+)
  // ────────────────────────────────────────────────────────────
  { id: "dis-123", name: "Allergic Contact Dermatitis / Eczema", amharic: "የቆዳ አለርጂ / ኤክዚማ", category: "Dermatology", code: "L23.9", isCommon: true },
  { id: "dis-124", name: "Atopic Dermatitis", amharic: "አቶፒክ የቆዳ አለርጂ", category: "Dermatology", code: "L20.9" },
  { id: "dis-125", name: "Fungal Skin Infection (Tinea Corporis / Ringworm)", amharic: "የሰውነት ቆዳ ፈንገስ ኢንፌክሽን", category: "Dermatology", code: "B35.4", isCommon: true },
  { id: "dis-126", name: "Tinea Pedis (Athlete's Foot)", amharic: "የእግር ጣቶች ፈንገስ", category: "Dermatology", code: "B35.3" },
  { id: "dis-127", name: "Tinea Capitis (Scalp Ringworm)", amharic: "የራስ ቆዳ ፈንገስ", category: "Dermatology", code: "B35.0" },
  { id: "dis-128", name: "Tinea Versicolor (Pityriasis Versicolor)", amharic: "የቆዳ ቀለም መቀየር ፈንገስ", category: "Dermatology", code: "B36.0" },
  { id: "dis-129", name: "Impetigo (Contagiosa / Bullous)", amharic: "ተላላፊ የህፃናት የቆዳ ቁስለት (ኢምፔቲጎ)", category: "Dermatology", code: "L01.0" },
  { id: "dis-130", name: "Cellulitis / Erysipelas", amharic: "አጣዳፊ የቆዳ ስር ባክቴሪያ ኢንፌክሽን (ሴሉላይተስ)", category: "Dermatology", code: "L03.9", isCommon: true },
  { id: "dis-131", name: "Folliculitis / Furunculosis (Boils)", amharic: "የጸጉር ስር እባጭ / እብጠት", category: "Dermatology", code: "L73.9" },
  { id: "dis-132", name: "Cutaneous Abscess / Carbuncle", amharic: "የቆዳ ላይ መግል የቋጠረ እባጭ", category: "Dermatology", code: "L02.9" },
  { id: "dis-133", name: "Acute Urticaria (Hives / Welts)", amharic: "አጣዳፊ የቆዳ ሽፍታ / ፎረፎር", category: "Dermatology", code: "L50.9", isCommon: true },
  { id: "dis-134", name: "Drug Eruption / Adverse Cutaneous Reaction", amharic: "የመድሀኒት አለርጂ ሽፍታ", category: "Dermatology", code: "L27.0" },
  { id: "dis-135", name: "Psoriasis Vulgaris", amharic: "የሶሪያሲስ የቆዳ በሽታ", category: "Dermatology", code: "L40.0" },
  { id: "dis-136", name: "Acne Vulgaris", amharic: "የፊት ላይ ብጉር", category: "Dermatology", code: "L70.0" },
  { id: "dis-137", name: "Seborrheic Dermatitis (Dandruff)", amharic: "የራስ ቆዳ ፎረፎር / የቆዳ ዘይትነት", category: "Dermatology", code: "L21.9" },
  { id: "dis-138", name: "Vitiligo", amharic: "የስጋ ደዌ ያልሆነ የቆዳ ነጭ መሆን", category: "Dermatology", code: "L80" },
  { id: "dis-139", name: "Alopecia Areata", amharic: "የጸጉር መነቀል / መርገፍ", category: "Dermatology", code: "L63.9" },
  { id: "dis-140", name: "Thermal Burn / Scald (1st / 2nd Degree)", amharic: "የእሳት / የፈላ ውሀ ማቃጠል", category: "Dermatology", code: "T30.0" },

  // ────────────────────────────────────────────────────────────
  // 8. RENAL, UROLOGICAL & REPRODUCTIVE (18+)
  // ────────────────────────────────────────────────────────────
  { id: "dis-141", name: "Urinary Tract Infection (UTI / Cystitis)", amharic: "የሽንት ቧንቧ ኢንፌክሽን", category: "Renal & Urological", code: "N39.0", isCommon: true },
  { id: "dis-142", name: "Acute Pyelonephritis (Kidney Infection)", amharic: "አጣዳፊ የኩላሊት ኢንፌክሽን", category: "Renal & Urological", code: "N10", isCommon: true },
  { id: "dis-143", name: "Urolithiasis / Nephrolithiasis (Kidney Stone)", amharic: "የኩላሊትና የሽንት ቧንቧ ጠጠር", category: "Renal & Urological", code: "N20.9", isCommon: true },
  { id: "dis-144", name: "Acute Kidney Injury (AKI)", amharic: "አጣዳፊ የኩላሊት መስራት ማቆም", category: "Renal & Urological", code: "N17.9" },
  { id: "dis-145", name: "Chronic Kidney Disease (CKD)", amharic: "ሥር የሰደደ የኩላሊት በሽታ", category: "Renal & Urological", code: "N18.9" },
  { id: "dis-146", name: "Benign Prostatic Hyperplasia (BPH)", amharic: "የፕሮስቴት እጢ ማበጥ", category: "Renal & Urological", code: "N40.1" },
  { id: "dis-147", name: "Acute / Chronic Prostatitis", amharic: "የፕሮስቴት እጢ ኢንፌክሽን", category: "Renal & Urological", code: "N41.9" },
  { id: "dis-148", name: "Acute Epididymo-Orchitis", amharic: "የወንድ የዘር ፍሬ ማበጥና ኢንፌክሽን", category: "Renal & Urological", code: "N45.9" },
  { id: "dis-149", name: "Hydrocele / Spermatocele", amharic: "የወንድ ዘር ፍሬ ፈሳሽ መቋጠር", category: "Renal & Urological", code: "N43.3" },
  { id: "dis-150", name: "Urethritis (Non-Gonococcal)", amharic: "የሽንት መሽኛ ቧንቧ ማበጥ", category: "Renal & Urological", code: "N34.1" },
  { id: "dis-151", name: "Gonococcal Infection / Gonorrhea", amharic: "ጨብጥ (ጎኖርያ)", category: "Renal & Urological", code: "A54.9" },
  { id: "dis-152", name: "Syphilis (Primary / Secondary)", amharic: "ቂጥኝ በሽታ", category: "Renal & Urological", code: "A53.9" },
  { id: "dis-153", name: "Pelvic Inflammatory Disease (PID)", amharic: "የማህፀንና ተዛማጅ አካላት ኢንፌክሽን", category: "Renal & Urological", code: "N73.9", isCommon: true },
  { id: "dis-154", name: "Vaginal Candidiasis (Yeast Infection)", amharic: "የማህፀን ፈንገስ ኢንፌክሽን", category: "Renal & Urological", code: "B37.3", isCommon: true },
  { id: "dis-155", name: "Bacterial Vaginosis (BV)", amharic: "ባክቴሪያዊ የማህፀን ፈሳሽ መዛባት", category: "Renal & Urological", code: "N76.0" },
  { id: "dis-156", name: "Trichomoniasis", amharic: "ትሪኮሞናስ የማህፀን ጥገኛ ኢንፌክሽን", category: "Renal & Urological", code: "A59.0" },
  { id: "dis-157", name: "Dysmenorrhea (Painful Menstruation)", amharic: "ከፍተኛ የወር አበባ ህመም", category: "Renal & Urological", code: "N94.6", isCommon: true },
  { id: "dis-158", name: "Abnormal Uterine Bleeding (AUB)", amharic: "ያልተለመደ የማህፀን ደም መፍሰስ", category: "Renal & Urological", code: "N93.9" },

  // ────────────────────────────────────────────────────────────
  // 9. NEUROLOGICAL & PSYCHIATRIC (15+)
  // ────────────────────────────────────────────────────────────
  { id: "dis-159", name: "Tension-Type Headache", amharic: "የውጥረት ራስ ምታት", category: "Neurology", code: "G44.2", isCommon: true },
  { id: "dis-160", name: "Migraine (With / Without Aura)", amharic: "የማይግሬን / የአንድ ወገን ራስ ምታት", category: "Neurology", code: "G43.9", isCommon: true },
  { id: "dis-161", name: "Cluster Headache", amharic: "ክላስተር ራስ ምታት", category: "Neurology", code: "G44.0" },
  { id: "dis-162", name: "Epilepsy / Seizure Disorder", amharic: "የሚጥል በሽታ", category: "Neurology", code: "G40.9" },
  { id: "dis-163", name: "Febrile Convulsion / Seizure (Pediatric)", amharic: "በትኩሳት ሳቢያ የሚመጣ መንቀጥቀጥ", category: "Neurology", code: "R56.0" },
  { id: "dis-164", name: "Ischemic Stroke / Cerebrovascular Accident (CVA)", amharic: "የደም ማነስ ሳቢያ የሚመጣ የአንጎል ስትሮክ", category: "Neurology", code: "I63.9" },
  { id: "dis-165", name: "Hemorrhagic Stroke", amharic: "የደም መፍሰስ የአንጎል ስትሮክ", category: "Neurology", code: "I61.9" },
  { id: "dis-166", name: "Transient Ischemic Attack (TIA)", amharic: "ጊዜያዊ የአንጎል ደም ማነስ", category: "Neurology", code: "G45.9" },
  { id: "dis-167", name: "Bell's Palsy (Facial Nerve Paralysis)", amharic: "የፊት ገጽታ ነርቭ መዛባት / ሽባነት", category: "Neurology", code: "G51.0" },
  { id: "dis-168", name: "Peripheral Neuropathy (Diabetic / Nutritional)", amharic: "የእጅና እግር ነርቭ መደንዘዝ / ማቃጠል", category: "Neurology", code: "G62.9" },
  { id: "dis-169", name: "Parkinson's Disease", amharic: "ፓርኪንሰን (የእጅና አካል መንቀጥቀጥ)", category: "Neurology", code: "G20" },
  { id: "dis-170", name: "Major Depressive Disorder", amharic: "የመንፈስ ጭንቀት / ድብርት", category: "Psychiatric", code: "F32.9" },
  { id: "dis-171", name: "Generalized Anxiety Disorder (GAD)", amharic: "ከፍተኛ የጭንቀት ስሜት", category: "Psychiatric", code: "F41.1", isCommon: true },
  { id: "dis-172", name: "Acute Psychosis / Schizophrenia", amharic: "አእምሮአዊ መቃወስ / ሳይኮሲስ", category: "Psychiatric", code: "F29" },
  { id: "dis-173", name: "Bipolar Affective Disorder", amharic: "ባይፖላር (የስሜት መዋዠቅ)", category: "Psychiatric", code: "F31.9" },
  { id: "dis-174", name: "Alcohol Use Disorder / Withdrawal", amharic: "የአልኮል ሱስ / የማቋረጥ ህመም", category: "Psychiatric", code: "F10.2" },
  { id: "dis-175", name: "Insomnia Disorder", amharic: "የእንቅልፍ ማጣት ችግር", category: "Psychiatric", code: "G47.0" },

  // ────────────────────────────────────────────────────────────
  // 10. OPHTHALMOLOGY & ENT (18+)
  // ────────────────────────────────────────────────────────────
  { id: "dis-176", name: "Acute Conjunctivitis (Pink Eye - Bacterial/Viral)", amharic: "አጣዳፊ የአይን ማበጥና መቅላት", category: "Ophthalmology", code: "H10.9", isCommon: true },
  { id: "dis-177", name: "Allergic Conjunctivitis", amharic: "የአይን አለርጂና ማሳከክ", category: "Ophthalmology", code: "H10.1", isCommon: true },
  { id: "dis-178", name: "Trachoma (Active / Cicatricial)", amharic: "የማረጋገጫ ትራኮማ በሽታ", category: "Ophthalmology", code: "A71.9" },
  { id: "dis-179", name: "Blepharitis / Stye (Hordeolum)", amharic: "የአይን ቆብ እብጠት / ምች", category: "Ophthalmology", code: "H00.0" },
  { id: "dis-180", name: "Corneal Abrasion / Ulcer", amharic: "የአይን ብሌን መቧጨር / መቁሰል", category: "Ophthalmology", code: "H16.0" },
  { id: "dis-181", name: "Cataract (Senile / Traumatic)", amharic: "የአይን ሞራ በሽታ", category: "Ophthalmology", code: "H26.9" },
  { id: "dis-182", name: "Pterygium", amharic: "የአይን ላይ ስጋ ማደግ (ቴሪጂየም)", category: "Ophthalmology", code: "H11.0" },
  { id: "dis-183", name: "Acute Otitis Media (AOM)", amharic: "አጣዳፊ የመካከለኛው ጆሮ ኢንፌክሽን", category: "ENT", code: "H66.9", isCommon: true },
  { id: "dis-184", name: "Chronic Suppurative Otitis Media (CSOM)", amharic: "ሥር የሰደደ የጆሮ መግል ማፍሰስ", category: "ENT", code: "H66.3" },
  { id: "dis-185", name: "Otitis Externa (Swimmer's Ear)", amharic: "የውጫዊ ጆሮ ቧንቧ ማበጥ", category: "ENT", code: "H60.9" },
  { id: "dis-186", name: "Impacted Cerumen (Earwax)", amharic: "በጆሮ ሰም መዘጋት", category: "ENT", code: "H61.2", isCommon: true },
  { id: "dis-187", name: "Tinnitus (Ear Ringing)", amharic: "የጆሮ ውስጥ ጩኸት", category: "ENT", code: "H93.1" },
  { id: "dis-188", name: "Epistaxis (Nosebleed)", amharic: "የአፍንጫ ደም መፍሰስ", category: "ENT", code: "R04.0" },
  { id: "dis-189", name: "Peritonsillar Abscess (Quinsy)", amharic: "የቶንሲል ዙሪያ መግል መቋጠር", category: "ENT", code: "J36" },
  { id: "dis-190", name: "Nasal Polyps", amharic: "የአፍንጫ ውስጥ ስጋ ማደግ", category: "ENT", code: "J33.9" },
  { id: "dis-191", name: "Foreign Body in Ear / Nose", amharic: "ጆሮ ወይም አፍንጫ ውስጥ ባዕድ ነገር መግባት", category: "ENT", code: "T16" },

  // ────────────────────────────────────────────────────────────
  // 11. DENTAL & ORAL HEALTH (8+)
  // ────────────────────────────────────────────────────────────
  { id: "dis-192", name: "Dental Caries (Tooth Decay)", amharic: "የጥርስ መቦርቦር በሽታ", category: "Dental", code: "K02.9", isCommon: true },
  { id: "dis-193", name: "Pulpitis (Acute Toothache)", amharic: "አጣዳፊ የጥርስ ስር ህመም", category: "Dental", code: "K04.0", isCommon: true },
  { id: "dis-194", name: "Periapical / Dental Abscess", amharic: "የጥርስ ስር መግል እብጠት", category: "Dental", code: "K04.7" },
  { id: "dis-195", name: "Gingivitis / Periodontal Disease", amharic: "የድድ ማበጥና ደም መፍሰስ", category: "Dental", code: "K05.6" },
  { id: "dis-196", name: "Aphthous Stomatitis (Canker Sores)", amharic: "የአፍ ውስጥ ቁስለት", category: "Dental", code: "K12.0" },
  { id: "dis-197", name: "Oral Candidiasis (Thrush)", amharic: "የአፍ ውስጥ ፈንገስ / ነጭ ሽፋን", category: "Dental", code: "B37.0" },
  { id: "dis-198", name: "Impacted Third Molar (Wisdom Tooth)", amharic: "የጥበብ ጥርስ መውጣት ህመም", category: "Dental", code: "K01.1" },

  // ────────────────────────────────────────────────────────────
  // 12. TRAUMA, INJURIES & TOXICOLOGY (15+)
  // ────────────────────────────────────────────────────────────
  { id: "dis-199", name: "Soft Tissue Contusion / Blunt Trauma", amharic: "የለስላሳ አካል መጎዳት / መቁሰል", category: "Trauma", code: "T14.0", isCommon: true },
  { id: "dis-200", name: "Open Laceration / Cut Wound", amharic: "የተቆረጠ / ክፍት ቁስል", category: "Trauma", code: "T14.1", isCommon: true },
  { id: "dis-201", name: "Bone Fracture (Closed)", amharic: "የአጥንት መሰበር (የተዘጋ)", category: "Trauma", code: "T14.2" },
  { id: "dis-202", name: "Bone Fracture (Open / Compound)", amharic: "የአጥንት መሰበር (ቆዳን የሰበረ)", category: "Trauma", code: "T14.20" },
  { id: "dis-203", name: "Joint Sprain / Ligament Strain", amharic: "የመገጣጠሚያ መወላቀቅ / ጅማት መሳብ", category: "Trauma", code: "T14.3", isCommon: true },
  { id: "dis-204", name: "Head Injury / Concussion (Mild TBI)", amharic: "የጭንቅላት አደጋ / መንቀጥቀጥ", category: "Trauma", code: "S06.0" },
  { id: "dis-205", name: "Animal Bite (Dog / Cat / Other)", amharic: "የእንስሳት ንክሻ", category: "Trauma", code: "W54.9", isCommon: true },
  { id: "dis-206", name: "Snake Bite Envenomation", amharic: "የእባብ ንክሻ መመረዝ", category: "Trauma", code: "T63.0" },
  { id: "dis-207", name: "Organophosphate / Pesticide Poisoning", amharic: "የፀረ-ተባይ መድሀኒት መመረዝ", category: "Trauma", code: "T60.0" },
  { id: "dis-208", name: "Acute Alcohol Intoxication", amharic: "ከፍተኛ የአልኮል መመረዝ", category: "Trauma", code: "T51.0" },
  { id: "dis-209", name: "Carbon Monoxide Poisoning / Smoke Inhalation", amharic: "የጭስ / የካርቦን ሞኖክሳይድ መመረዝ", category: "Trauma", code: "T58" },
  { id: "dis-210", name: "Chemical Burn Injury", amharic: "በኬሚካል ማቃጠል አደጋ", category: "Trauma", code: "T30.4" },
  { id: "dis-211", name: "Electric Shock / Lightning Injury", amharic: "የኤሌክትሪክ / የመብረቅ አደጋ", category: "Trauma", code: "T75.4" },
  { id: "dis-212", name: "Foreign Body Ingestion / Choking", amharic: "የምግብ መተንፈሻ ቧንቧ መዘጋት", category: "Trauma", code: "T17.9" },

  // ────────────────────────────────────────────────────────────
  // 13. GENERAL & MISCELLANEOUS (8+)
  // ────────────────────────────────────────────────────────────
  { id: "dis-213", name: "Dehydration (Moderate / Severe)", amharic: "የሰውነት ፈሳሽ ማነስ / ድርቀት", category: "General", code: "E86.0", isCommon: true },
  { id: "dis-214", name: "Pyrexia / Fever of Unknown Origin (FUO)", amharic: "ያልታወቀ የትኩሳት ህመም", category: "General", code: "R50.9" },
  { id: "dis-215", name: "Generalized Edema / Fluid Overload", amharic: "አጠቃላይ የሰውነት ማበጥ", category: "General", code: "R60.1" },
  { id: "dis-216", name: "General Physical Debility / Fatigue", amharic: "አጠቃላይ የሰውነት ድካም / አቅም ማጣት", category: "General", code: "R53" },
  { id: "dis-217", name: "Syncope and Collapse (Fainting)", amharic: "ድንገተኛ ራስን መሳት", category: "General", code: "R55" },
  { id: "dis-218", name: "Routine Medical Examination / Fit for Duty", amharic: "አጠቃላይ የጤና ምርመራ", category: "General", code: "Z00.0" },
  { id: "dis-219", name: "Post-Operative Wound Follow-up", amharic: "ከቀዶ ጥገና በኋላ ክትትል", category: "General", code: "Z48.8" },
  { id: "dis-220", name: "Vaccination / Immunization Reaction", amharic: "የክትባት ተዛማጅ ምላሽ", category: "General", code: "T88.1" }
];

// Top 15-20 Most Common Primary Care Diagnoses in Ethiopia for quick picking
export const DEFAULT_MOST_PICKED_DISEASES: ClinicDisease[] = DEFAULT_CLINIC_DISEASES.filter(
  (d) => d.isCommon
).slice(0, 20);
