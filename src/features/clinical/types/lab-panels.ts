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
