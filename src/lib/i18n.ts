import { cookies } from "next/headers";

type Dictionary = {
  [key: string]: string;
};

const en: Dictionary = {
  "nav.dashboard": "Dashboard",
  "nav.appointments": "Appointments",
  "nav.patients": "Patients",
  "nav.laboratory": "Laboratory",
  "nav.labCatalog": "Lab Catalog",
  "nav.pharmacy": "Pharmacy",
  "nav.pharmacyCatalog": "Pharmacy Catalog",
  "nav.catalogApprovals": "Catalog Approvals",
  "nav.billing": "Billing",
  "nav.auditLogs": "Audit Logs",
  "nav.admin": "Admin",
  "nav.myStation": "My Station",
  // Dashboard Home
  "dash.welcome": "Welcome to Clinic ERP",
  "dash.hello": "Hello",
  "dash.systemStatus": "System Status",
  "dash.online": "Online",
  "dash.yourRole": "Your Role",
  "dash.doctorOverview": "Doctor Overview",
  "dash.operatingInOpd": "Operating in OPD",
  "dash.welcomeBackDr": "Welcome back, Dr.",
};

const am: Dictionary = {
  "nav.dashboard": "ዳሽቦርድ",
  "nav.appointments": "ቀጠሮዎች",
  "nav.patients": "ታካሚዎች",
  "nav.laboratory": "ላቦራቶሪ",
  "nav.labCatalog": "የላብራቶሪ ካታሎግ",
  "nav.pharmacy": "ፋርማሲ",
  "nav.pharmacyCatalog": "የፋርማሲ ካታሎግ",
  "nav.catalogApprovals": "የካታሎግ ማጽደቂያ",
  "nav.billing": "ክፍያ",
  "nav.auditLogs": "የኦዲት ምዝግብ ማስታወሻዎች",
  "nav.admin": "አስተዳዳሪ",
  "nav.myStation": "የእኔ ጣቢያ",
  // Dashboard Home
  "dash.welcome": "ወደ ክሊኒክ ሲስተም በደህና መጡ",
  "dash.hello": "ሰላም",
  "dash.systemStatus": "የሲስተም ሁኔታ",
  "dash.online": "በመስመር ላይ",
  "dash.yourRole": "የእርስዎ ሚና",
  "dash.doctorOverview": "የዶክተር አጠቃላይ እይታ",
  "dash.operatingInOpd": "በሚሰራበት ክፍል",
  "dash.welcomeBackDr": "እንኳን በደህና ተመለሱ ዶ/ር",
};

const dictionaries: Record<string, Dictionary> = {
  en,
  am,
};

export async function getDictionary() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "en";
  return dictionaries[locale] || dictionaries.en;
}


