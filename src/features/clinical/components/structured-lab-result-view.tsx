"use client";

import { parseLabFindings, StoolPanelData, UrinePanelData, HematologyPanelData } from "../types/lab-panels";
import { FlaskConical, Droplet, Activity, CheckCircle2, AlertCircle, FileText } from "lucide-react";

export function StructuredLabResultView({ findings, testName }: { findings: string | null | undefined; testName?: string }) {
  const parsed = parseLabFindings(findings);

  // Helper to check for abnormal keywords
  const isAbnormal = (val?: string) => {
    if (!val) return false;
    const v = val.toLowerCase();
    return v.includes("positive") || v.includes("present") || v.includes("many") || v.includes("gross") || v.includes("bloody") || v.includes("+++") || v.includes("tntc") || v.includes("elevated");
  };

  const formatKeyLabel = (key: string) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/[_-]/g, " ")
      .replace(/^./, (s) => s.toUpperCase())
      .trim();
  };

  if (!parsed.isStructured || !parsed.data) {
    let cleanText = parsed.rawText || "";
    // If cleanText looks like JSON (e.g. starts with { or [), format it safely
    if (cleanText.trim().startsWith("{") || cleanText.trim().startsWith("[")) {
      try {
        const obj = JSON.parse(cleanText.trim());
        if (typeof obj === "object" && obj !== null) {
          const parts = Object.entries(obj)
            .filter(([k]) => !["type", "id", "requestId"].includes(k))
            .map(([k, v]) => `${formatKeyLabel(k)}: ${typeof v === "object" ? JSON.stringify(v) : v}`);
          cleanText = parts.join(" • ");
        }
      } catch {}
    }

    return (
      <div className="bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1.5">
          <span>{testName ? `${testName} - Diagnostic Findings` : "General Laboratory Findings"}</span>
        </div>
        <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans font-medium">
          {cleanText || <span className="text-slate-400 italic">No findings recorded.</span>}
        </p>
      </div>
    );
  }

  // 1. STOOL EXAMINATION
  if (parsed.type === "STOOL") {
    const data = parsed.data as StoolPanelData;
    const hasParasite = data.ovaAndParasite && !data.ovaAndParasite.toLowerCase().includes("no ova") && !data.ovaAndParasite.toLowerCase().includes("nil") && !data.ovaAndParasite.toLowerCase().includes("none");

    return (
      <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-300/80 dark:border-emerald-800/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm text-xs transition-all print:border-emerald-700 print:bg-white print:p-3 print:space-y-2 print-avoid-break">
        {/* Header Badge */}
        <div className="flex items-center justify-between border-b border-emerald-200/80 dark:border-emerald-800/60 pb-3 print:pb-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 shadow-sm print:hidden">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-emerald-950 dark:text-emerald-100 text-sm tracking-tight print:text-black">
                {testName ? testName : "Stool Examination (Clinical Parasitology)"}
              </h4>
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400 print:text-slate-600">
                {testName && testName.includes("-")
                  ? `Specific Analysis: ${testName.replace(/^Stool\s*-\s*/i, "")}`
                  : "Standard Macroscopic & Microscopic Panel"}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 text-[10px] font-extrabold tracking-wider uppercase border border-emerald-300 dark:border-emerald-700 print:border-black print:text-black print:bg-white">
            COMPLETED
          </span>
        </div>

        {/* Macroscopic & Chemical Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-2.5 print:gap-1.5">
          <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40 shadow-2xs print:border-slate-400 print:bg-white print:p-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block print:text-slate-700 print:font-bold">Appearance</span>
            <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block print:text-black">{data.appearance || "N/A"}</strong>
          </div>
          <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40 shadow-2xs print:border-slate-400 print:bg-white print:p-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block print:text-slate-700 print:font-bold">Consistence</span>
            <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block print:text-black">{data.consistence || "N/A"}</strong>
          </div>
          <div className={`p-2.5 rounded-xl border shadow-2xs print:border-slate-400 print:bg-white print:p-1.5 ${isAbnormal(data.bloodGross) ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200" : "bg-white dark:bg-slate-900/90 border-emerald-100 dark:border-emerald-900/40"}`}>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block print:text-slate-700 print:font-bold">Blood-Gross</span>
            <strong className="text-xs mt-0.5 block print:text-black">{data.bloodGross || "Negative"}</strong>
          </div>
          <div className={`p-2.5 rounded-xl border shadow-2xs print:border-slate-400 print:bg-white print:p-1.5 ${isAbnormal(data.occult) ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200" : "bg-white dark:bg-slate-900/90 border-emerald-100 dark:border-emerald-900/40"}`}>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block print:text-slate-700 print:font-bold">Occult Blood</span>
            <strong className="text-xs mt-0.5 block print:text-black">{data.occult || "Negative"}</strong>
          </div>
          <div className={`p-2.5 rounded-xl border shadow-2xs print:border-slate-400 print:bg-white print:p-1.5 ${isAbnormal(data.pus) ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200" : "bg-white dark:bg-slate-900/90 border-emerald-100 dark:border-emerald-900/40"}`}>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block print:text-slate-700 print:font-bold">Pus Cells</span>
            <strong className="text-xs mt-0.5 block print:text-black">{data.pus || "Nil"}</strong>
          </div>
          <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40 shadow-2xs print:border-slate-400 print:bg-white print:p-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block print:text-slate-700 print:font-bold">Mucus</span>
            <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block print:text-black">{data.mucus || "Negative"}</strong>
          </div>
          <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40 shadow-2xs print:border-slate-400 print:bg-white print:p-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block print:text-slate-700 print:font-bold">Bile</span>
            <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block print:text-black">{data.bile || "Present"}</strong>
          </div>
        </div>

        {/* Highlighted Ova & Parasite Card */}
        <div className={`p-3 print:p-2 rounded-xl border transition-all print:border-black print:bg-white ${
          hasParasite
            ? "bg-amber-50/90 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/80 text-amber-950 dark:text-amber-100"
            : "bg-white dark:bg-slate-900/90 border-emerald-200 dark:border-emerald-800"
        }`}>
          <div className="flex items-center gap-2 mb-1">
            {hasParasite ? (
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 print:hidden" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 print:hidden" />
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 print:text-slate-800">
              Ova and Parasite (Microscopic Saline/Iodine Mount)
            </span>
          </div>
          <p className={`text-sm font-bold pl-6 print:pl-0 ${hasParasite ? "text-amber-900 dark:text-amber-200 print:text-black" : "text-emerald-900 dark:text-emerald-300 print:text-black"}`}>
            {data.ovaAndParasite || "No ova or parasite seen."}
          </p>
        </div>

        {/* Remarks */}
        {data.remarks && (
          <div className="text-xs text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/70 p-3 print:p-2 rounded-xl border border-emerald-200/70 dark:border-emerald-800/50 print:border-slate-400 print:bg-white print:text-black">
            <span className="font-bold text-slate-700 dark:text-slate-200 print:text-black">Remarks / Clinical Notes: </span>
            {data.remarks}
          </div>
        )}
      </div>
    );
  }

  // 2. URINE EXAMINATION
  if (parsed.type === "URINE") {
    const data = parsed.data as UrinePanelData;

    return (
      <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300/80 dark:border-amber-800/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm text-xs transition-all print:border-amber-700 print:bg-white print:p-3 print:space-y-2 print-avoid-break">
        {/* Header Badge */}
        <div className="flex items-center justify-between border-b border-amber-200/80 dark:border-amber-800/60 pb-3 print:pb-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shadow-sm print:hidden">
              <Droplet className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-amber-950 dark:text-amber-100 text-sm tracking-tight print:text-black">
                {testName ? testName : "Urine Examination (Routine Urinalysis)"}
              </h4>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-400 print:text-slate-600">
                {testName && testName.includes("-")
                  ? `Specific Analysis: ${testName.replace(/^Urine\s*-\s*/i, "")}`
                  : "Physical, Chemical Dipstick & Microscopic Sediment Analysis"}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 text-[10px] font-extrabold tracking-wider uppercase border border-amber-300 dark:border-amber-700 print:border-black print:text-black print:bg-white">
            COMPLETED
          </span>
        </div>

        {/* Section 1: Physical & Chemical */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block mb-2 print:text-black">
            1. Physical & Chemical Parameters
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 print:grid-cols-5 gap-2.5 print:gap-1.5">
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40 shadow-2xs print:border-slate-400 print:bg-white print:p-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block print:text-slate-700 print:font-bold">Quantity</span>
              <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block print:text-black">{data.quantity || "N/A"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40 shadow-2xs print:border-slate-400 print:bg-white print:p-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block print:text-slate-700 print:font-bold">Reaction (pH)</span>
              <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block print:text-black">{data.reaction || "N/A"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40 shadow-2xs print:border-slate-400 print:bg-white print:p-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block print:text-slate-700 print:font-bold">Specific Gravity</span>
              <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block print:text-black">{data.specificGravity || "N/A"}</strong>
            </div>
            <div className={`p-2.5 rounded-xl border shadow-2xs print:border-slate-400 print:bg-white print:p-1.5 ${isAbnormal(data.albuminQualitative) ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200" : "bg-white dark:bg-slate-900/90 border-amber-100 dark:border-amber-900/40"}`}>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block print:text-slate-700 print:font-bold">Albumin (Qual)</span>
              <strong className="text-xs mt-0.5 block print:text-black">{data.albuminQualitative || "Nil"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40 shadow-2xs print:border-slate-400 print:bg-white print:p-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block print:text-slate-700 print:font-bold">Albumin (Quant)</span>
              <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block print:text-black">{data.albuminQuantitative || "< 30 mg/dL"}</strong>
            </div>
            <div className={`p-2.5 rounded-xl border shadow-2xs print:border-slate-400 print:bg-white print:p-1.5 ${isAbnormal(data.sugarQualitative) ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200" : "bg-white dark:bg-slate-900/90 border-amber-100 dark:border-amber-900/40"}`}>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block print:text-slate-700 print:font-bold">Sugar (Qual)</span>
              <strong className="text-xs mt-0.5 block print:text-black">{data.sugarQualitative || "Nil"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40 shadow-2xs print:border-slate-400 print:bg-white print:p-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block print:text-slate-700 print:font-bold">Sugar (Quant)</span>
              <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block print:text-black">{data.sugarQuantitative || "Normal"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40 shadow-2xs print:border-slate-400 print:bg-white print:p-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block print:text-slate-700 print:font-bold">Acetone</span>
              <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block print:text-black">{data.acetone || "Negative"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40 shadow-2xs print:border-slate-400 print:bg-white print:p-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block print:text-slate-700 print:font-bold">Diacetic Acid</span>
              <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block print:text-black">{data.diaceticAcid || "Negative"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40 shadow-2xs print:border-slate-400 print:bg-white print:p-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block print:text-slate-700 print:font-bold">Bilirubin</span>
              <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block print:text-black">{data.bilirubin || "Negative"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40 shadow-2xs print:border-slate-400 print:bg-white print:p-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block print:text-slate-700 print:font-bold">Urobilinogen</span>
              <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block print:text-black">{data.urobilinogen || "Normal"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40 shadow-2xs print:border-slate-400 print:bg-white print:p-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block print:text-slate-700 print:font-bold">Urobilin</span>
              <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block print:text-black">{data.urobilin || "Negative"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40 shadow-2xs print:border-slate-400 print:bg-white print:p-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block print:text-slate-700 print:font-bold">17-Ketosteroids</span>
              <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block print:text-black">{data.ketosteroids17 || "Normal"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40 shadow-2xs print:border-slate-400 print:bg-white print:p-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block print:text-slate-700 print:font-bold">Sodium (Na)</span>
              <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block print:text-black">{data.sodium || "Normal"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40 shadow-2xs print:border-slate-400 print:bg-white print:p-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block print:text-slate-700 print:font-bold">Potassium (K)</span>
              <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block print:text-black">{data.potassium || "Normal"}</strong>
            </div>
          </div>
        </div>

        {/* Section 2: Microscopic Sediment */}
        <div className="bg-white dark:bg-slate-900/90 p-3 print:p-2 rounded-xl border border-amber-200 dark:border-amber-800 print:border-slate-400 print:bg-white">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 print:text-slate-800 block mb-1">
            2. Microscopic Sediment Findings
          </span>
          <p className="text-xs font-semibold text-amber-950 dark:text-amber-200 print:text-black">
            {data.microscopic || "Pus cells: 0-2 /HPF, RBC: 0-1 /HPF, Epith cells: Few, Casts: Nil, Crystals: Nil"}
          </p>
        </div>

        {/* Remarks */}
        {data.remarks && (
          <div className="text-xs text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/70 p-3 print:p-2 rounded-xl border border-amber-200/70 dark:border-amber-800/50 print:border-slate-400 print:bg-white print:text-black">
            <span className="font-bold text-slate-700 dark:text-slate-200 print:text-black">Remarks: </span>
            {data.remarks}
          </div>
        )}
      </div>
    );
  }

  // 3. HEMATOLOGY & COMPLETE BLOOD COUNT
  if (parsed.type === "HEMATOLOGY") {
    const data = parsed.data as HematologyPanelData;

    return (
      <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-300/80 dark:border-rose-800/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm text-xs transition-all print:border-rose-700 print:bg-white print:p-3 print:space-y-2 print-avoid-break">
        {/* Header Badge */}
        <div className="flex items-center justify-between border-b border-rose-200/80 dark:border-rose-800/60 pb-3 print:pb-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 shadow-sm print:hidden">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-rose-950 dark:text-rose-100 text-sm tracking-tight print:text-black">
                {testName ? testName : "Hematology & Complete Blood Count (CBC)"}
              </h4>
              <p className="text-[11px] text-rose-700/80 dark:text-rose-400 print:text-slate-600">
                {testName && testName.includes("-")
                  ? `Specific Analysis: ${testName.replace(/^Hematology\s*-\s*/i, "")}`
                  : "Automated / Manual Hemogram, Differential & Coagulation Report"}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 text-[10px] font-extrabold tracking-wider uppercase border border-rose-300 dark:border-rose-700 print:border-black print:text-black print:bg-white">
            COMPLETED
          </span>
        </div>

        {/* 1. Core Blood Counts */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 block mb-2 print:text-black">
            1. Core Cell Counts & Indices
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 print:grid-cols-6 gap-2.5 print:gap-1.5">
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/40 shadow-2xs print:border-slate-400 print:bg-white print:p-1.5">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block print:text-slate-700 print:font-bold">W.B.C. (4-11)</span>
              <strong className="text-slate-900 dark:text-slate-100 text-sm font-mono mt-0.5 block print:text-black">{data.wbc || "N/A"} <span className="text-[10px] font-normal text-slate-400 print:text-slate-600">×10³/µL</span></strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/40 shadow-2xs print:border-slate-400 print:bg-white print:p-1.5">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block print:text-slate-700 print:font-bold">R.B.C. (4-5.5)</span>
              <strong className="text-slate-900 dark:text-slate-100 text-sm font-mono mt-0.5 block print:text-black">{data.rbc || "N/A"} <span className="text-[10px] font-normal text-slate-400 print:text-slate-600">×10⁶/µL</span></strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/40 shadow-2xs print:border-slate-400 print:bg-white print:p-1.5">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block print:text-slate-700 print:font-bold">Hemoglobin (12-17.5)</span>
              <strong className="text-slate-900 dark:text-slate-100 text-sm font-mono mt-0.5 block print:text-black">{data.hemoglobin || "N/A"} <span className="text-[10px] font-normal text-slate-400 print:text-slate-600">g/dL</span></strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/40 shadow-2xs print:border-slate-400 print:bg-white print:p-1.5">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block print:text-slate-700 print:font-bold">Hematocrit (36-52%)</span>
              <strong className="text-slate-900 dark:text-slate-100 text-sm font-mono mt-0.5 block print:text-black">{data.hematocrit || "N/A"} <span className="text-[10px] font-normal text-slate-400 print:text-slate-600">%</span></strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/40 shadow-2xs print:border-slate-400 print:bg-white print:p-1.5">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block print:text-slate-700 print:font-bold">Platelets (150-450)</span>
              <strong className="text-slate-900 dark:text-slate-100 text-sm font-mono mt-0.5 block print:text-black">{data.platelets || "N/A"} <span className="text-[10px] font-normal text-slate-400 print:text-slate-600">×10³/µL</span></strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/40 shadow-2xs print:border-slate-400 print:bg-white print:p-1.5">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block print:text-slate-700 print:font-bold">Reticulocytes (0.5-2.5)</span>
              <strong className="text-slate-900 dark:text-slate-100 text-sm font-mono mt-0.5 block print:text-black">{data.reticulocytes || "N/A"} <span className="text-[10px] font-normal text-slate-400 print:text-slate-600">%</span></strong>
            </div>
          </div>
        </div>

        {/* 2. Differential Count */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 block mb-2 print:text-black">
            2. Differential White Blood Count (%)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 print:grid-cols-8 gap-2 print:gap-1">
            <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40 text-center shadow-2xs print:border-slate-400 print:bg-white print:p-1">
              <span className="text-[9px] font-semibold text-slate-400 block print:text-slate-700 print:font-bold">Neutrophils</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs print:text-black">{data.neutrophils || "—"}%</strong>
              <span className="text-[8px] text-slate-400 block print:text-slate-600">40-75%</span>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40 text-center shadow-2xs print:border-slate-400 print:bg-white print:p-1">
              <span className="text-[9px] font-semibold text-slate-400 block print:text-slate-700 print:font-bold">Bands</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs print:text-black">{data.bands || "—"}%</strong>
              <span className="text-[8px] text-slate-400 block print:text-slate-600">0-5%</span>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40 text-center shadow-2xs print:border-slate-400 print:bg-white print:p-1">
              <span className="text-[9px] font-semibold text-slate-400 block print:text-slate-700 print:font-bold">Lymphocytes</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs print:text-black">{data.lymphocytes || "—"}%</strong>
              <span className="text-[8px] text-slate-400 block print:text-slate-600">20-45%</span>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40 text-center shadow-2xs print:border-slate-400 print:bg-white print:p-1">
              <span className="text-[9px] font-semibold text-slate-400 block print:text-slate-700 print:font-bold">Monocytes</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs print:text-black">{data.monocytes || "—"}%</strong>
              <span className="text-[8px] text-slate-400 block print:text-slate-600">2-10%</span>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40 text-center shadow-2xs print:border-slate-400 print:bg-white print:p-1">
              <span className="text-[9px] font-semibold text-slate-400 block print:text-slate-700 print:font-bold">Eosinophils</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs print:text-black">{data.eosinophils || "—"}%</strong>
              <span className="text-[8px] text-slate-400 block print:text-slate-600">1-6%</span>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40 text-center shadow-2xs print:border-slate-400 print:bg-white print:p-1">
              <span className="text-[9px] font-semibold text-slate-400 block print:text-slate-700 print:font-bold">Basophils</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs print:text-black">{data.basophils || "—"}%</strong>
              <span className="text-[8px] text-slate-400 block print:text-slate-600">0-1%</span>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40 text-center shadow-2xs print:border-slate-400 print:bg-white print:p-1">
              <span className="text-[9px] font-semibold text-slate-400 block print:text-slate-700 print:font-bold">Blast</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs print:text-black">{data.blast || "0"}%</strong>
              <span className="text-[8px] text-slate-400 block print:text-slate-600">0%</span>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40 text-center shadow-2xs print:border-slate-400 print:bg-white print:p-1">
              <span className="text-[9px] font-semibold text-slate-400 block print:text-slate-700 print:font-bold">Myelocytes</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs print:text-black">{data.myelocytes || "0"}%</strong>
              <span className="text-[8px] text-slate-400 block print:text-slate-600">0%</span>
            </div>
          </div>
        </div>

        {/* 3. Coagulation, ESR & RBC Indices */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 block mb-2 print:text-black">
            3. Coagulation, E.S.R. & RBC Indices
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 print:grid-cols-7 gap-2 print:gap-1">
            <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40 shadow-2xs print:border-slate-400 print:bg-white print:p-1">
              <span className="text-[9px] font-semibold text-slate-400 block print:text-slate-700 print:font-bold">Bleeding Time</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs print:text-black">{data.bleedingTime || "N/A"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40 shadow-2xs print:border-slate-400 print:bg-white print:p-1">
              <span className="text-[9px] font-semibold text-slate-400 block print:text-slate-700 print:font-bold">Coagulation Time</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs print:text-black">{data.coagulationTime || "N/A"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40 shadow-2xs print:border-slate-400 print:bg-white print:p-1">
              <span className="text-[9px] font-semibold text-slate-400 block print:text-slate-700 print:font-bold">Prothrombin (PT)</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs print:text-black">{data.prothrombinTime || "N/A"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40 shadow-2xs print:border-slate-400 print:bg-white print:p-1">
              <span className="text-[9px] font-semibold text-slate-400 block print:text-slate-700 print:font-bold">E.S.R. (0-20 mm/h)</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs print:text-black">{data.esr || "N/A"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40 shadow-2xs print:border-slate-400 print:bg-white print:p-1">
              <span className="text-[9px] font-semibold text-slate-400 block print:text-slate-700 print:font-bold">MCV (80-100 fL)</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs print:text-black">{data.mcv || "N/A"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40 shadow-2xs print:border-slate-400 print:bg-white print:p-1">
              <span className="text-[9px] font-semibold text-slate-400 block print:text-slate-700 print:font-bold">MCH (27-33 pg)</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs print:text-black">{data.mch || "N/A"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40 shadow-2xs print:border-slate-400 print:bg-white print:p-1">
              <span className="text-[9px] font-semibold text-slate-400 block print:text-slate-700 print:font-bold">MCHC (32-36 g/dL)</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs print:text-black">{data.mchc || "N/A"}</strong>
            </div>
          </div>
        </div>

        {/* 4. Morphology */}
        {data.bloodMorphology && (
          <div className="bg-white dark:bg-slate-900/90 p-3 print:p-2 rounded-xl border border-rose-200 dark:border-rose-800 print:border-slate-400 print:bg-white">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 print:text-slate-800 block mb-1">
              4. Peripheral Blood Smear Morphology
            </span>
            <p className="text-xs font-semibold text-rose-950 dark:text-rose-200 print:text-black">
              {data.bloodMorphology}
            </p>
          </div>
        )}

        {/* Remarks */}
        {data.remarks && (
          <div className="text-xs text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/70 p-3 print:p-2 rounded-xl border border-rose-200/70 dark:border-rose-800/50 print:border-slate-400 print:bg-white print:text-black">
            <span className="font-bold text-slate-700 dark:text-slate-200 print:text-black">Remarks: </span>
            {data.remarks}
          </div>
        )}
      </div>
    );
  }

  // 4. GENERIC STRUCTURED / OTHER JSON TEST RESULTS
  if (parsed.type === "GENERIC_JSON" || (parsed.isStructured && parsed.data)) {
    const rawObj = (parsed.data || {}) as Record<string, any>;
    const entries = Object.entries(rawObj).filter(
      ([k]) => !["type", "id", "requestId", "patientId", "createdAt", "updatedAt"].includes(k)
    );

    const remarksEntry = entries.find(([k]) =>
      ["remarks", "notes", "comment", "comments", "interpretation"].includes(k.toLowerCase())
    );
    const metricEntries = entries.filter(
      ([k]) => !["remarks", "notes", "comment", "comments", "interpretation"].includes(k.toLowerCase())
    );

    return (
      <div className="bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm text-xs transition-all print:border-indigo-700 print:bg-white print:p-3 print:space-y-2 print-avoid-break">
        {/* Header Badge */}
        <div className="flex items-center justify-between border-b border-indigo-200/70 dark:border-indigo-800/60 pb-3 print:pb-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 shadow-sm print:hidden">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-indigo-950 dark:text-indigo-100 text-sm tracking-tight print:text-black">
                {testName || "Laboratory Diagnostic Findings"}
              </h4>
              <p className="text-[11px] text-indigo-700/80 dark:text-indigo-400 print:text-slate-600">
                Diagnostic Analysis & Qualitative/Quantitative Findings
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 text-[10px] font-extrabold tracking-wider uppercase border border-indigo-300 dark:border-indigo-700 print:border-black print:text-black print:bg-white">
            COMPLETED
          </span>
        </div>

        {/* Dynamic Metric Grid */}
        {metricEntries.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-4 gap-2.5 print:gap-1.5">
            {metricEntries.map(([key, val]) => {
              const strVal = typeof val === "object" ? JSON.stringify(val) : String(val ?? "N/A");
              const abnormal = isAbnormal(strVal);
              return (
                <div
                  key={key}
                  className={`p-2.5 rounded-xl border shadow-2xs transition-all print:border-slate-400 print:bg-white print:p-1.5 ${
                    abnormal
                      ? "bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200"
                      : "bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800"
                  }`}
                >
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider block mb-1 print:text-slate-700 print:font-bold truncate">
                    {formatKeyLabel(key)}
                  </span>
                  <div className="flex items-center justify-between gap-1.5">
                    <strong className={`text-xs font-bold block print:text-black truncate ${abnormal ? "text-amber-900 dark:text-amber-200 font-mono" : "text-slate-800 dark:text-slate-100"}`}>
                      {strVal}
                    </strong>
                    {abnormal && <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 print:hidden" />}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-600 dark:text-slate-300 print:text-black">
            {parsed.rawText || "Completed diagnostic investigation."}
          </p>
        )}

        {/* Remarks / Clinical Notes */}
        {remarksEntry && remarksEntry[1] && (
          <div className="text-xs text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 p-3 print:p-2 rounded-xl border border-indigo-200/70 dark:border-indigo-800/50 print:border-slate-400 print:bg-white print:text-black">
            <span className="font-bold text-slate-700 dark:text-slate-200 print:text-black">
              {formatKeyLabel(remarksEntry[0])}:{" "}
            </span>
            {String(remarksEntry[1])}
          </div>
        )}
      </div>
    );
  }

  // Fallback view for any remaining unhandled format
  return (
    <div className="bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1.5">
        <span>{testName ? `${testName} - Diagnostic Findings` : "General Laboratory Findings"}</span>
      </div>
      <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans font-medium">
        {parsed.rawText || <span className="text-slate-400 italic">No findings recorded.</span>}
      </p>
    </div>
  );
}
