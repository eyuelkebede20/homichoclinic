export type LabPanelType = "STOOL" | "URINE" | "HEMATOLOGY" | "GENERIC_JSON";

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
  data: any | null;
  rawText: string;
} {
  if (!findings) {
    return { isStructured: false, type: null, data: null, rawText: "" };
  }

  const trimmed = findings.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object") {
        const t = (parsed.type || "").toUpperCase();

        // 1. Explicit or auto-detected STOOL panel
        if (
          t === "STOOL" ||
          "consistence" in parsed ||
          "ovaAndParasite" in parsed ||
          "bloodGross" in parsed
        ) {
          return {
            isStructured: true,
            type: "STOOL",
            data: { ...parsed, type: "STOOL" },
            rawText: parsed.remarks || "",
          };
        }

        // 2. Explicit or auto-detected URINE panel
        if (
          t === "URINE" ||
          "specificGravity" in parsed ||
          "albuminQualitative" in parsed ||
          "sugarQualitative" in parsed ||
          "diaceticAcid" in parsed
        ) {
          return {
            isStructured: true,
            type: "URINE",
            data: { ...parsed, type: "URINE" },
            rawText: parsed.remarks || "",
          };
        }

        // 3. Explicit or auto-detected HEMATOLOGY panel
        if (
          t === "HEMATOLOGY" ||
          "wbc" in parsed ||
          "hemoglobin" in parsed ||
          "platelets" in parsed ||
          "esr" in parsed ||
          "neutrophils" in parsed
        ) {
          return {
            isStructured: true,
            type: "HEMATOLOGY",
            data: { ...parsed, type: "HEMATOLOGY" },
            rawText: parsed.remarks || "",
          };
        }

        // 4. Any other structured JSON object - parse as GENERIC_JSON
        return {
          isStructured: true,
          type: "GENERIC_JSON",
          data: parsed,
          rawText: parsed.remarks || parsed.comments || parsed.interpretation || "",
        };
      }
    } catch {
      // Not valid JSON, fallback to raw text
    }
  }

  // Also check if string contains unescaped JSON object
  if (trimmed.includes('{"') && trimmed.includes('"}')) {
    try {
      const start = trimmed.indexOf("{");
      const end = trimmed.lastIndexOf("}");
      if (start !== -1 && end > start) {
        const jsonSlice = trimmed.substring(start, end + 1);
        const parsed = JSON.parse(jsonSlice);
        if (parsed && typeof parsed === "object") {
          return {
            isStructured: true,
            type: "GENERIC_JSON",
            data: parsed,
            rawText: "",
          };
        }
      }
    } catch {}
  }

  return {
    isStructured: false,
    type: null,
    data: null,
    rawText: findings,
  };
}

export function formatLabSummary(findings: string | null | undefined): string {
  if (!findings) return "No findings recorded.";
  const p = parseLabFindings(findings);

  if (p.isStructured && p.data) {
    if (p.type === "STOOL") {
      const d = p.data as any;
      const parts = [
        d.consistence ? `Consistence: ${d.consistence}` : "",
        d.ovaAndParasite ? `O&P: ${d.ovaAndParasite}` : "No parasites",
        d.bloodGross && d.bloodGross.toLowerCase() !== "negative" ? `Gross Blood: ${d.bloodGross}` : "",
      ].filter(Boolean);
      return parts.join(" • ") + (d.remarks ? ` (${d.remarks})` : "");
    }
    if (p.type === "URINE") {
      const d = p.data as any;
      const parts = [
        d.reaction ? `Reaction: ${d.reaction}` : "",
        d.albuminQualitative ? `Albumin: ${d.albuminQualitative}` : "",
        d.sugarQualitative ? `Sugar: ${d.sugarQualitative}` : "",
        d.microscopic ? `Microscopic: ${d.microscopic}` : "",
      ].filter(Boolean);
      return parts.join(" • ") + (d.remarks ? ` (${d.remarks})` : "");
    }
    if (p.type === "HEMATOLOGY") {
      const d = p.data as any;
      const parts = [
        d.wbc ? `WBC: ${d.wbc}` : "",
        d.hemoglobin ? `Hgb: ${d.hemoglobin}` : "",
        d.platelets ? `Plt: ${d.platelets}` : "",
        d.esr ? `ESR: ${d.esr}` : "",
      ].filter(Boolean);
      return parts.join(" • ") + (d.remarks ? ` (${d.remarks})` : "");
    }
    if (p.type === "GENERIC_JSON") {
      const entries = Object.entries(p.data).filter(
        ([k]) => k !== "type" && k !== "id" && k !== "requestId"
      );
      if (entries.length > 0) {
        return entries
          .map(([k, v]) => {
            const label = k
              .replace(/([A-Z])/g, " $1")
              .replace(/_/g, " ")
              .replace(/^./, (s) => s.toUpperCase());
            return `${label}: ${v}`;
          })
          .join(" • ");
      }
    }
  }

  // Strip raw JSON wrapping if somehow rendered as text
  if (findings.trim().startsWith("{") && findings.trim().endsWith("}")) {
    try {
      const obj = JSON.parse(findings.trim());
      const entries = Object.entries(obj).filter(([k]) => k !== "type");
      if (entries.length > 0) {
        return entries.map(([k, v]) => `${k}: ${v}`).join(" • ");
      }
    } catch {}
  }

  return findings;
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
      selectedList: ["Complete Blood Count (CBC & Differential)"],
    };
  }
  const n = testName.toLowerCase().trim();
  const hasSubMarker = n.includes("-") || n.includes("(") || n.includes(":");
  const isFull = (n === "hematology" || n.includes("complete blood") || n.includes("complete cbc")) && !hasSubMarker;
  if (isFull) {
    return {
      isFull: true,
      reqWbcDiff: true,
      reqHgbHct: true,
      reqRbc: true,
      reqPlatelets: true,
      reqReticulocytes: true,
      reqEsr: true,
      reqCoagulation: true,
      reqMorphology: true,
      reqIndices: true,
      selectedList: ["Complete Blood Count (CBC & Differential)"],
    };
  }

  const reqWbcDiff = n.includes("wbc") || n.includes("differential") || n.includes("white blood");
  const reqHgbHct = n.includes("hemoglobin") || n.includes("hematocrit") || n.includes("hgb") || n.includes("hct");
  const reqRbc = n.includes("rbc") || n.includes("red blood") || reqHgbHct;
  const reqPlatelets = n.includes("platelet");
  const reqReticulocytes = n.includes("reticulocyte");
  const reqEsr = n.includes("esr") || n.includes("sedimentation");
  const reqCoagulation = n.includes("coagulation") || n.includes("pt") || n.includes("bt") || n.includes("ct") || n.includes("prothrombin") || n.includes("bleeding") || n.includes("clotting");
  const reqMorphology = n.includes("morphology") || n.includes("smear");
  const reqIndices = n.includes("indices") || n.includes("mcv") || n.includes("mch") || n.includes("mchc");

  const selectedList: string[] = [];
  if (reqWbcDiff) selectedList.push("WBC & Differential Count");
  if (reqHgbHct) selectedList.push("Hemoglobin & Hematocrit (Hgb/Hct)");
  if (reqRbc && !reqHgbHct) selectedList.push("RBC Count");
  if (reqPlatelets) selectedList.push("Platelet Count");
  if (reqReticulocytes) selectedList.push("Reticulocyte Count");
  if (reqIndices) selectedList.push("RBC Indices (MCV/MCH/MCHC)");
  if (reqEsr) selectedList.push("ESR (Sedimentation Rate)");
  if (reqCoagulation) selectedList.push("Coagulation Profile (PT/BT/CT)");
  if (reqMorphology) selectedList.push("Blood Smear Morphology");

  if (selectedList.length === 0) {
    return {
      isFull: true,
      reqWbcDiff: true,
      reqHgbHct: true,
      reqRbc: true,
      reqPlatelets: true,
      reqReticulocytes: true,
      reqEsr: true,
      reqCoagulation: true,
      reqMorphology: true,
      reqIndices: true,
      selectedList: [testName],
    };
  }

  return {
    isFull: false,
    reqWbcDiff,
    reqHgbHct,
    reqRbc,
    reqPlatelets,
    reqReticulocytes,
    reqEsr,
    reqCoagulation,
    reqMorphology,
    reqIndices,
    selectedList,
  };
}

export function parseStoolSelectedSubTests(testName?: string) {
  if (!testName) {
    return { 
      isFull: true, 
      reqOccultBlood: true, 
      reqOvaParasite: true, 
      reqMacroscopic: true,
      selectedList: ["Full Complete Stool Examination"],
    };
  }
  const n = testName.toLowerCase().trim();
  const hasSubMarker = n.includes("-") || n.includes("(") || n.includes(":");
  const isFull = (n === "stool examination" || n === "stool test" || n === "stool") && !hasSubMarker;
  if (isFull) {
    return { 
      isFull: true, 
      reqOccultBlood: true, 
      reqOvaParasite: true, 
      reqMacroscopic: true,
      selectedList: ["Full Complete Stool Examination"],
    };
  }

  const reqOccultBlood = n.includes("occult") || n.includes("fobt") || n.includes("hidden blood");
  const reqOvaParasite = n.includes("ova") || n.includes("parasite") || n.includes("microscopic");
  const reqMacroscopic = n.includes("macroscopic") || n.includes("physical") || n.includes("consistency") || n.includes("appearance") || n.includes("color") || n.includes("gross") || n.includes("pus") || n.includes("mucus") || n.includes("bile");
  const reqAppearance = n.includes("appearance") || n.includes("consistency") || reqMacroscopic;
  const reqGrossBlood = n.includes("gross blood") || reqMacroscopic;
  const reqPusMucus = n.includes("pus") || n.includes("mucus") || reqMacroscopic;
  const reqBile = n.includes("bile") || reqMacroscopic;

  const selectedList: string[] = [];
  if (reqOccultBlood) selectedList.push("Occult Blood (FOBT)");
  if (reqOvaParasite) selectedList.push("Ova & Parasite (Microscopic)");
  if (n.includes("appearance") || n.includes("consistency")) selectedList.push("Appearance & Consistency");
  if (n.includes("gross blood")) selectedList.push("Gross Blood");
  if (n.includes("pus") || n.includes("mucus")) selectedList.push("Pus & Mucus");
  if (n.includes("bile")) selectedList.push("Bile");
  if (n.includes("macroscopic") && selectedList.length === 0) selectedList.push("Macroscopic & Physical");

  if (selectedList.length === 0) {
    return { 
      isFull: true, 
      reqOccultBlood: true, 
      reqOvaParasite: true, 
      reqMacroscopic: true,
      reqAppearance: true,
      reqGrossBlood: true,
      reqPusMucus: true,
      reqBile: true,
      selectedList: [testName],
    };
  }

  return {
    isFull: false,
    reqOccultBlood,
    reqOvaParasite,
    reqMacroscopic,
    reqAppearance,
    reqGrossBlood,
    reqPusMucus,
    reqBile,
    selectedList,
  };
}

export function parseUrineSelectedSubTests(testName?: string) {
  if (!testName) {
    return { 
      isFull: true, 
      reqDipstick: true, 
      reqSediment: true, 
      reqAlbumin: true, 
      reqSugar: true, 
      reqBile: true, 
      reqPhysical: true,
      reqAcetone: true,
      reqKetosteroids: true,
      reqElectrolytes: true,
      selectedList: ["Full Routine Urinalysis"],
    };
  }
  const n = testName.toLowerCase().trim();
  const hasSubMarker = n.includes("-") || n.includes("(") || n.includes(":");
  const isFull = (n === "urine examination" || n === "routine urinalysis" || n === "urinalysis" || n === "urine") && !hasSubMarker;
  if (isFull) {
    return { 
      isFull: true, 
      reqDipstick: true, 
      reqSediment: true, 
      reqAlbumin: true, 
      reqSugar: true, 
      reqBile: true, 
      reqPhysical: true,
      reqAcetone: true,
      reqKetosteroids: true,
      reqElectrolytes: true,
      selectedList: ["Full Routine Urinalysis"],
    };
  }

  const reqDipstick = n.includes("dipstick") || n.includes("chemical") || n.includes("strip");
  const reqSediment = n.includes("sediment") || n.includes("microscopic");
  const reqAlbumin = reqDipstick || n.includes("albumin") || n.includes("protein");
  const reqSugar = reqDipstick || n.includes("sugar") || n.includes("glucose");
  const reqBile = reqDipstick || n.includes("bile") || n.includes("urobilinogen") || n.includes("bilirubin") || n.includes("urobilin");
  const reqAcetone = reqDipstick || n.includes("acetone") || n.includes("diacetic") || n.includes("ketone");
  const reqKetosteroids = n.includes("ketosteroid") || n.includes("17-");
  const reqElectrolytes = n.includes("electrolyte") || n.includes("sodium") || n.includes("potassium") || n.includes("na") || n.includes("k");
  const reqPhysical = n.includes("physical") || n.includes("gravity") || n.includes("reaction") || n.includes("quantity") || (!reqDipstick && !reqSediment && !reqAlbumin && !reqSugar && !reqBile && !reqAcetone && !reqKetosteroids && !reqElectrolytes);

  const selectedList: string[] = [];
  if (reqDipstick) selectedList.push("Chemical Dipstick (Protein/Sugar/pH)");
  if (reqSediment) selectedList.push("Microscopic Sediment Examination");
  if (reqAlbumin && !reqDipstick) selectedList.push("Albumin / Protein Test");
  if (reqSugar && !reqDipstick) selectedList.push("Sugar / Glucose Test");
  if (reqAcetone && !reqDipstick) selectedList.push("Acetone & Diacetic Acid");
  if (reqBile && !reqDipstick) selectedList.push("Bile & Urobilinogen");
  if (reqKetosteroids) selectedList.push("17-Ketosteroids");
  if (reqElectrolytes) selectedList.push("Electrolytes (Na & K)");
  if (reqPhysical && !reqDipstick) selectedList.push("Physical Examination");

  if (selectedList.length === 0) {
    return { 
      isFull: true, 
      reqDipstick: true, 
      reqSediment: true, 
      reqAlbumin: true, 
      reqSugar: true, 
      reqBile: true, 
      reqPhysical: true,
      reqAcetone: true,
      reqKetosteroids: true,
      reqElectrolytes: true,
      selectedList: [testName],
    };
  }

  return {
    isFull: false,
    reqDipstick,
    reqSediment,
    reqAlbumin,
    reqSugar,
    reqBile,
    reqPhysical,
    reqAcetone,
    reqKetosteroids,
    reqElectrolytes,
    selectedList,
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
        const subNames = existing.allRequests.map(r => r.test.name.replace(/^Stool\s*(Examination|Test)?\s*(\(|\-)?\s*/i, "").replace(/\)+$/, "").trim());
        const unique = Array.from(new Set(subNames));
        existing.testName = unique.length === 1 ? `Stool - ${unique[0]}` : `Stool Examination (${unique.join(", ")})`;
      } else if (pType === "URINE") {
        const subNames = existing.allRequests.map(r => r.test.name.replace(/^Urine\s*(Examination|Test|Urinalysis)?\s*(\(|\-)?\s*/i, "").replace(/\)+$/, "").trim());
        const unique = Array.from(new Set(subNames));
        existing.testName = unique.length === 1 ? `Urine - ${unique[0]}` : `Urine Examination (${unique.join(", ")})`;
      } else if (pType === "HEMATOLOGY") {
        const subNames = existing.allRequests.map(r => r.test.name.replace(/^Hematology\s*(Panel|CBC)?\s*(\(|\-)?\s*/i, "").replace(/\)+$/, "").trim());
        const unique = Array.from(new Set(subNames));
        existing.testName = unique.length === 1 ? `Hematology - ${unique[0]}` : `Hematology (${unique.join(", ")})`;
      }
    }
  }

  return Array.from(groups.values());
}

