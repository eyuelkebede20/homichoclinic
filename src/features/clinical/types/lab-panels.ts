export type LabPanelType = "STOOL" | "URINE" | "HEMATOLOGY";

export interface StoolPanelData {
  type: "STOOL";
  appearance?: string;
  consistence?: string;
  bloodGross?: string;
  occult?: string;
  pus?: string;
  mucus?: string;
  bile?: string;
  ovaAndParasite?: string;
  remarks?: string;
}

export interface UrinePanelData {
  type: "URINE";
  quantity?: string;
  reaction?: string;
  specificGravity?: string;
  albuminQualitative?: string;
  albuminQuantitative?: string;
  sugarQualitative?: string;
  sugarQuantitative?: string;
  acetone?: string;
  diaceticAcid?: string;
  bilirubin?: string;
  urobilinogen?: string;
  urobilin?: string;
  ketosteroids17?: string;
  sodium?: string;
  potassium?: string;
  microscopic?: string;
  remarks?: string;
}

export interface HematologyPanelData {
  type: "HEMATOLOGY";
  wbc?: string;
  neutrophils?: string;
  bands?: string;
  lymphocytes?: string;
  monocytes?: string;
  eosinophils?: string;
  basophils?: string;
  blast?: string;
  myelocytes?: string;
  platelets?: string;
  reticulocytes?: string;
  rbc?: string;
  hematocrit?: string;
  hemoglobin?: string;
  bleedingTime?: string;
  coagulationTime?: string;
  prothrombinTime?: string;
  esr?: string;
  mcv?: string;
  mch?: string;
  mchc?: string;
  bloodMorphology?: string;
  remarks?: string;
}

export type StructuredPanelData = StoolPanelData | UrinePanelData | HematologyPanelData;

export const DEFAULT_CORE_LAB_TESTS = [
  {
    name: "Stool Examination",
    panelType: "STOOL" as const,
    color: "emerald",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/40",
    borderClass: "border-emerald-300 dark:border-emerald-800",
    textClass: "text-emerald-700 dark:text-emerald-300",
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700",
    description: "Macroscopic, chemical occult & microscopic parasite examination",
  },
  {
    name: "Urine Examination",
    panelType: "URINE" as const,
    color: "amber",
    bgClass: "bg-amber-50 dark:bg-amber-950/40",
    borderClass: "border-amber-300 dark:border-amber-800",
    textClass: "text-amber-700 dark:text-amber-300",
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700",
    description: "Routine physical, chemical (dipstick) & microscopic sediment analysis",
  },
  {
    name: "Hematology",
    panelType: "HEMATOLOGY" as const,
    color: "rose",
    bgClass: "bg-rose-50 dark:bg-rose-950/40",
    borderClass: "border-rose-300 dark:border-rose-800",
    textClass: "text-rose-700 dark:text-rose-300",
    badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 border border-rose-300 dark:border-rose-700",
    description: "Complete blood count (CBC), differential, indices, ESR & morphology",
  },
];

export function isStoolTest(name: string): boolean {
  if (!name) return false;
  const n = name.toLowerCase().trim();
  return n.includes("stool") || n === "stool examination" || n === "stool test";
}

export function isUrineTest(name: string): boolean {
  if (!name) return false;
  const n = name.toLowerCase().trim();
  return n.includes("urine") || n.includes("urinalysis") || n === "urine examination" || n === "urine test";
}

export function isHematologyTest(name: string): boolean {
  if (!name) return false;
  const n = name.toLowerCase().trim();
  return n.includes("hematology") || n.includes("cbc") || n.includes("complete blood") || n.includes("hemogram");
}

export function getLabPanelType(testName: string): LabPanelType | null {
  if (isStoolTest(testName)) return "STOOL";
  if (isUrineTest(testName)) return "URINE";
  if (isHematologyTest(testName)) return "HEMATOLOGY";
  return null;
}

export function parseLabFindings(findings: string | null | undefined): {
  isStructured: boolean;
  type: LabPanelType | null;
  data: StructuredPanelData | null;
  rawText: string;
} {
  if (!findings) {
    return { isStructured: false, type: null, data: null, rawText: "" };
  }

  const trimmed = findings.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && parsed.type) {
        if (parsed.type === "STOOL" || parsed.type === "URINE" || parsed.type === "HEMATOLOGY") {
          return {
            isStructured: true,
            type: parsed.type as LabPanelType,
            data: parsed as StructuredPanelData,
            rawText: parsed.remarks || "",
          };
        }
      }
    } catch {
      // Not valid JSON, fallback to raw text
    }
  }

  return {
    isStructured: false,
    type: null,
    data: null,
    rawText: findings,
  };
}
