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

export function parseHematologySelectedSubTests(testName?: string) {
  if (!testName) {
    return {
      isFull: true,
      reqWbcDiff: true,
      reqHgbHct: true,
      reqPlatelets: true,
      reqEsr: true,
      reqCoagulation: true,
      reqMorphology: true,
      reqIndices: true,
    };
  }
  const n = testName.toLowerCase();
  const isFull = n === "hematology" || n.includes("complete") || (!n.includes("-") && !n.includes("("));
  if (isFull) {
    return {
      isFull: true,
      reqWbcDiff: true,
      reqHgbHct: true,
      reqPlatelets: true,
      reqEsr: true,
      reqCoagulation: true,
      reqMorphology: true,
      reqIndices: true,
    };
  }

  return {
    isFull: false,
    reqWbcDiff: n.includes("wbc") || n.includes("differential") || n.includes("white blood"),
    reqHgbHct: n.includes("hemoglobin") || n.includes("hematocrit") || n.includes("hgb") || n.includes("hct"),
    reqPlatelets: n.includes("platelet"),
    reqEsr: n.includes("esr") || n.includes("sedimentation"),
    reqCoagulation: n.includes("coagulation") || n.includes("pt") || n.includes("bt") || n.includes("ct") || n.includes("prothrombin"),
    reqMorphology: n.includes("morphology") || n.includes("smear"),
    reqIndices: n.includes("indices") || n.includes("mcv") || n.includes("mch"),
  };
}

export function parseStoolSelectedSubTests(testName?: string) {
  if (!testName) {
    return { isFull: true, reqOccultBlood: true, reqOvaParasite: true, reqMacroscopic: true };
  }
  const n = testName.toLowerCase();
  const isFull = n === "stool examination" || n === "stool test" || (!n.includes("-") && !n.includes("("));
  if (isFull) {
    return { isFull: true, reqOccultBlood: true, reqOvaParasite: true, reqMacroscopic: true };
  }
  return {
    isFull: false,
    reqOccultBlood: n.includes("occult") || n.includes("fobt") || n.includes("hidden blood"),
    reqOvaParasite: n.includes("ova") || n.includes("parasite") || n.includes("microscopic"),
    reqMacroscopic: n.includes("macroscopic") || n.includes("physical") || n.includes("consistency"),
  };
}

export function parseUrineSelectedSubTests(testName?: string) {
  if (!testName) {
    return { isFull: true, reqDipstick: true, reqSediment: true, reqAlbumin: true, reqSugar: true, reqBile: true, reqPhysical: true };
  }
  const n = testName.toLowerCase();
  const isFull = n === "urine examination" || n === "routine urinalysis" || n === "urinalysis" || (!n.includes("-") && !n.includes("("));
  if (isFull) {
    return { isFull: true, reqDipstick: true, reqSediment: true, reqAlbumin: true, reqSugar: true, reqBile: true, reqPhysical: true };
  }
  return {
    isFull: false,
    reqDipstick: n.includes("dipstick") || n.includes("chemical") || n.includes("strip"),
    reqSediment: n.includes("sediment") || n.includes("microscopic"),
    reqAlbumin: n.includes("albumin") || n.includes("protein"),
    reqSugar: n.includes("sugar") || n.includes("glucose"),
    reqBile: n.includes("bile") || n.includes("urobilinogen"),
    reqPhysical: n.includes("physical") || n.includes("gravity") || n.includes("ph"),
  };
}

export interface GroupedLabRequest<T> {
  id: string;
  linkedRequestIds: string[];
  primaryRequest: T;
  allRequests: T[];
  testName: string;
  isUrgent: boolean;
  panelType: LabPanelType | null;
  patient: any;
  createdAt: Date | string;
}

export function groupPendingLabRequests<T extends {
  id: string;
  patientId: string;
  patient: any;
  test: { id: string; name: string };
  status: string;
  createdAt: Date | string;
}>(requests: T[]): GroupedLabRequest<T>[] {
  const groups: Map<string, GroupedLabRequest<T>> = new Map();

  for (const req of requests) {
    const pType = getLabPanelType(req.test.name);
    const key = pType ? `${req.patientId}__${pType}` : req.id;

    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, {
        id: req.id,
        linkedRequestIds: [req.id],
        primaryRequest: req,
        allRequests: [req],
        testName: req.test.name,
        isUrgent: req.status === "urgent",
        panelType: pType,
        patient: req.patient,
        createdAt: req.createdAt,
      });
    } else {
      existing.allRequests.push(req);
      existing.linkedRequestIds.push(req.id);
      if (req.status === "urgent") {
        existing.isUrgent = true;
      }
      if (pType === "STOOL") {
        const subNames = existing.allRequests.map(r => r.test.name.replace(/^Stool\s*(\(|\-)\s*/i, "").replace(/\)$/, "").trim());
        const unique = Array.from(new Set(subNames));
        existing.testName = unique.length === 1 ? `Stool - ${unique[0]}` : `Stool Examination (${unique.join(", ")})`;
      } else if (pType === "URINE") {
        const subNames = existing.allRequests.map(r => r.test.name.replace(/^Urine\s*(\(|\-)\s*/i, "").replace(/\)$/, "").trim());
        const unique = Array.from(new Set(subNames));
        existing.testName = unique.length === 1 ? `Urine - ${unique[0]}` : `Urine Examination (${unique.join(", ")})`;
      } else if (pType === "HEMATOLOGY") {
        const subNames = existing.allRequests.map(r => r.test.name.replace(/^Hematology\s*(\(|\-)\s*/i, "").replace(/\)$/, "").trim());
        const unique = Array.from(new Set(subNames));
        existing.testName = unique.length === 1 ? `Hematology - ${unique[0]}` : `Hematology (${unique.join(", ")})`;
      }
    }
  }

  return Array.from(groups.values());
}

