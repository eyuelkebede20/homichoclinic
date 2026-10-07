"use client";

import { parseLabFindings, StoolPanelData, UrinePanelData, HematologyPanelData } from "../types/lab-panels";
import { FlaskConical, Droplet, Activity, CheckCircle2, AlertCircle, FileText } from "lucide-react";

export function StructuredLabResultView({ findings }: { findings: string | null | undefined }) {
  const parsed = parseLabFindings(findings);

  if (!parsed.isStructured || !parsed.data) {
    return (
      <div className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans">
        {parsed.rawText || <span className="text-slate-400 italic">No findings recorded.</span>}
      </div>
    );
  }

  // Helper to check for abnormal keywords
  const isAbnormal = (val?: string) => {
    if (!val) return false;
    const v = val.toLowerCase();
    return v.includes("positive") || v.includes("present") || v.includes("many") || v.includes("gross") || v.includes("bloody") || v.includes("+++") || v.includes("tntc") || v.includes("elevated");
  };

  // 1. STOOL EXAMINATION
  if (parsed.type === "STOOL") {
    const data = parsed.data as StoolPanelData;
    const hasParasite = data.ovaAndParasite && !data.ovaAndParasite.toLowerCase().includes("no ova") && !data.ovaAndParasite.toLowerCase().includes("nil") && !data.ovaAndParasite.toLowerCase().includes("none");

    return (
      <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-300/80 dark:border-emerald-800/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm text-xs transition-all print:border-emerald-700 print:bg-white">
        {/* Header Badge */}
        <div className="flex items-center justify-between border-b border-emerald-200/80 dark:border-emerald-800/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 shadow-sm">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-emerald-950 dark:text-emerald-100 text-sm tracking-tight">
                Stool Examination (Clinical Parasitology)
              </h4>
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400">Standard Macroscopic & Microscopic Panel</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 text-[10px] font-extrabold tracking-wider uppercase border border-emerald-300 dark:border-emerald-700">
            COMPLETED
          </span>
        </div>

        {/* Macroscopic & Chemical Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Appearance</span>
            <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block">{data.appearance || "N/A"}</strong>
          </div>
          <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Consistence</span>
            <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block">{data.consistence || "N/A"}</strong>
          </div>
          <div className={`p-2.5 rounded-xl border shadow-2xs ${isAbnormal(data.bloodGross) ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200" : "bg-white dark:bg-slate-900/90 border-emerald-100 dark:border-emerald-900/40"}`}>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Blood-Gross</span>
            <strong className="text-xs mt-0.5 block">{data.bloodGross || "Negative"}</strong>
          </div>
          <div className={`p-2.5 rounded-xl border shadow-2xs ${isAbnormal(data.occult) ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200" : "bg-white dark:bg-slate-900/90 border-emerald-100 dark:border-emerald-900/40"}`}>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Occult Blood</span>
            <strong className="text-xs mt-0.5 block">{data.occult || "Negative"}</strong>
          </div>
          <div className={`p-2.5 rounded-xl border shadow-2xs ${isAbnormal(data.pus) ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200" : "bg-white dark:bg-slate-900/90 border-emerald-100 dark:border-emerald-900/40"}`}>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Pus Cells</span>
            <strong className="text-xs mt-0.5 block">{data.pus || "Nil"}</strong>
          </div>
          <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Mucus</span>
            <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block">{data.mucus || "Negative"}</strong>
          </div>
          <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Bile</span>
            <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block">{data.bile || "Present"}</strong>
          </div>
        </div>

        {/* Highlighted Ova & Parasite Card */}
        <div className={`p-3 rounded-xl border transition-all ${
          hasParasite
            ? "bg-amber-50/90 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/80 text-amber-950 dark:text-amber-100"
            : "bg-white dark:bg-slate-900/90 border-emerald-200 dark:border-emerald-800"
        }`}>
          <div className="flex items-center gap-2 mb-1">
            {hasParasite ? (
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Ova and Parasite (Microscopic Saline/Iodine Mount)
            </span>
          </div>
          <p className={`text-sm font-bold pl-6 ${hasParasite ? "text-amber-900 dark:text-amber-200" : "text-emerald-900 dark:text-emerald-300"}`}>
            {data.ovaAndParasite || "No ova or parasite seen."}
          </p>
        </div>

        {/* Remarks */}
        {data.remarks && (
          <div className="text-xs text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/70 p-3 rounded-xl border border-emerald-200/70 dark:border-emerald-800/50">
            <span className="font-bold text-slate-700 dark:text-slate-200">Remarks / Clinical Notes: </span>
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
      <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300/80 dark:border-amber-800/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm text-xs transition-all print:border-amber-700 print:bg-white">
        {/* Header Badge */}
        <div className="flex items-center justify-between border-b border-amber-200/80 dark:border-amber-800/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shadow-sm">
              <Droplet className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-amber-950 dark:text-amber-100 text-sm tracking-tight">
                Urine Examination (Routine Urinalysis)
              </h4>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-400">Physical, Chemical Dipstick & Microscopic Sediment Analysis</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 text-[10px] font-extrabold tracking-wider uppercase border border-amber-300 dark:border-amber-700">
            COMPLETED
          </span>
        </div>

        {/* Section 1: Physical & Chemical */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block mb-2">
            1. Physical & Chemical Parameters
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40 shadow-2xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Quantity</span>
              <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block">{data.quantity || "N/A"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40 shadow-2xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Reaction (pH)</span>
              <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block">{data.reaction || "N/A"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40 shadow-2xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Specific Gravity</span>
              <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block">{data.specificGravity || "N/A"}</strong>
            </div>
            <div className={`p-2.5 rounded-xl border shadow-2xs ${isAbnormal(data.albuminQualitative) ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200" : "bg-white dark:bg-slate-900/90 border-amber-100 dark:border-amber-900/40"}`}>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Albumin (Qual)</span>
              <strong className="text-xs mt-0.5 block">{data.albuminQualitative || "Nil"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40 shadow-2xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Albumin (Quant)</span>
              <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block">{data.albuminQuantitative || "< 30 mg/dL"}</strong>
            </div>
            <div className={`p-2.5 rounded-xl border shadow-2xs ${isAbnormal(data.sugarQualitative) ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200" : "bg-white dark:bg-slate-900/90 border-amber-100 dark:border-amber-900/40"}`}>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Sugar (Qual)</span>
              <strong className="text-xs mt-0.5 block">{data.sugarQualitative || "Nil"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40 shadow-2xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Sugar (Quant)</span>
              <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block">{data.sugarQuantitative || "Normal"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40 shadow-2xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Acetone</span>
              <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block">{data.acetone || "Negative"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40 shadow-2xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Diacetic Acid</span>
              <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block">{data.diaceticAcid || "Negative"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40 shadow-2xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Bilirubin</span>
              <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block">{data.bilirubin || "Negative"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40 shadow-2xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Urobilinogen</span>
              <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block">{data.urobilinogen || "Normal"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40 shadow-2xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Urobilin</span>
              <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block">{data.urobilin || "Negative"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40 shadow-2xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">17-Ketosteroids</span>
              <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block">{data.ketosteroids17 || "Normal"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40 shadow-2xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Sodium (Na)</span>
              <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block">{data.sodium || "Normal"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40 shadow-2xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Potassium (K)</span>
              <strong className="text-slate-800 dark:text-slate-100 text-xs mt-0.5 block">{data.potassium || "Normal"}</strong>
            </div>
          </div>
        </div>

        {/* Section 2: Microscopic Sediment */}
        <div className="bg-white dark:bg-slate-900/90 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
            2. Microscopic Sediment Findings
          </span>
          <p className="text-xs font-semibold text-amber-950 dark:text-amber-200">
            {data.microscopic || "Pus cells: 0-2 /HPF, RBC: 0-1 /HPF, Epith cells: Few, Casts: Nil, Crystals: Nil"}
          </p>
        </div>

        {/* Remarks */}
        {data.remarks && (
          <div className="text-xs text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/70 p-3 rounded-xl border border-amber-200/70 dark:border-amber-800/50">
            <span className="font-bold text-slate-700 dark:text-slate-200">Remarks: </span>
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
      <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-300/80 dark:border-rose-800/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm text-xs transition-all print:border-rose-700 print:bg-white">
        {/* Header Badge */}
        <div className="flex items-center justify-between border-b border-rose-200/80 dark:border-rose-800/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 shadow-sm">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-rose-950 dark:text-rose-100 text-sm tracking-tight">
                Hematology & Complete Blood Count (CBC)
              </h4>
              <p className="text-[11px] text-rose-700/80 dark:text-rose-400">Automated / Manual Hemogram, Differential & Coagulation Report</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 text-[10px] font-extrabold tracking-wider uppercase border border-rose-300 dark:border-rose-700">
            COMPLETED
          </span>
        </div>

        {/* 1. Core Blood Counts */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 block mb-2">
            1. Core Cell Counts & Indices
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/40 shadow-2xs">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">W.B.C. (4-11)</span>
              <strong className="text-slate-900 dark:text-slate-100 text-sm font-mono mt-0.5 block">{data.wbc || "N/A"} <span className="text-[10px] font-normal text-slate-400">×10³/µL</span></strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/40 shadow-2xs">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">R.B.C. (4-5.5)</span>
              <strong className="text-slate-900 dark:text-slate-100 text-sm font-mono mt-0.5 block">{data.rbc || "N/A"} <span className="text-[10px] font-normal text-slate-400">×10⁶/µL</span></strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/40 shadow-2xs">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Hemoglobin (12-17.5)</span>
              <strong className="text-slate-900 dark:text-slate-100 text-sm font-mono mt-0.5 block">{data.hemoglobin || "N/A"} <span className="text-[10px] font-normal text-slate-400">g/dL</span></strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/40 shadow-2xs">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Hematocrit (36-52%)</span>
              <strong className="text-slate-900 dark:text-slate-100 text-sm font-mono mt-0.5 block">{data.hematocrit || "N/A"} <span className="text-[10px] font-normal text-slate-400">%</span></strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/40 shadow-2xs">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Platelets (150-450)</span>
              <strong className="text-slate-900 dark:text-slate-100 text-sm font-mono mt-0.5 block">{data.platelets || "N/A"} <span className="text-[10px] font-normal text-slate-400">×10³/µL</span></strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/40 shadow-2xs">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Reticulocytes (0.5-2.5)</span>
              <strong className="text-slate-900 dark:text-slate-100 text-sm font-mono mt-0.5 block">{data.reticulocytes || "N/A"} <span className="text-[10px] font-normal text-slate-400">%</span></strong>
            </div>
          </div>
        </div>

        {/* 2. Differential Count */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 block mb-2">
            2. Differential White Blood Count (%)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40 text-center shadow-2xs">
              <span className="text-[9px] font-semibold text-slate-400 block">Neutrophils</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs">{data.neutrophils || "—"}%</strong>
              <span className="text-[8px] text-slate-400 block">40-75%</span>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40 text-center shadow-2xs">
              <span className="text-[9px] font-semibold text-slate-400 block">Bands</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs">{data.bands || "—"}%</strong>
              <span className="text-[8px] text-slate-400 block">0-5%</span>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40 text-center shadow-2xs">
              <span className="text-[9px] font-semibold text-slate-400 block">Lymphocytes</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs">{data.lymphocytes || "—"}%</strong>
              <span className="text-[8px] text-slate-400 block">20-45%</span>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40 text-center shadow-2xs">
              <span className="text-[9px] font-semibold text-slate-400 block">Monocytes</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs">{data.monocytes || "—"}%</strong>
              <span className="text-[8px] text-slate-400 block">2-10%</span>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40 text-center shadow-2xs">
              <span className="text-[9px] font-semibold text-slate-400 block">Eosinophils</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs">{data.eosinophils || "—"}%</strong>
              <span className="text-[8px] text-slate-400 block">1-6%</span>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40 text-center shadow-2xs">
              <span className="text-[9px] font-semibold text-slate-400 block">Basophils</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs">{data.basophils || "—"}%</strong>
              <span className="text-[8px] text-slate-400 block">0-1%</span>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40 text-center shadow-2xs">
              <span className="text-[9px] font-semibold text-slate-400 block">Blast</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs">{data.blast || "0"}%</strong>
              <span className="text-[8px] text-slate-400 block">0%</span>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40 text-center shadow-2xs">
              <span className="text-[9px] font-semibold text-slate-400 block">Myelocytes</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs">{data.myelocytes || "0"}%</strong>
              <span className="text-[8px] text-slate-400 block">0%</span>
            </div>
          </div>
        </div>

        {/* 3. Coagulation, ESR & RBC Indices */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 block mb-2">
            3. Coagulation, E.S.R. & RBC Indices
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40 shadow-2xs">
              <span className="text-[9px] font-semibold text-slate-400 block">Bleeding Time</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs">{data.bleedingTime || "N/A"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40 shadow-2xs">
              <span className="text-[9px] font-semibold text-slate-400 block">Coagulation Time</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs">{data.coagulationTime || "N/A"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40 shadow-2xs">
              <span className="text-[9px] font-semibold text-slate-400 block">Prothrombin (PT)</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs">{data.prothrombinTime || "N/A"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40 shadow-2xs">
              <span className="text-[9px] font-semibold text-slate-400 block">E.S.R. (0-20 mm/h)</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs">{data.esr || "N/A"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40 shadow-2xs">
              <span className="text-[9px] font-semibold text-slate-400 block">MCV (80-100 fL)</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs">{data.mcv || "N/A"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40 shadow-2xs">
              <span className="text-[9px] font-semibold text-slate-400 block">MCH (27-33 pg)</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs">{data.mch || "N/A"}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40 shadow-2xs">
              <span className="text-[9px] font-semibold text-slate-400 block">MCHC (32-36 g/dL)</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs">{data.mchc || "N/A"}</strong>
            </div>
          </div>
        </div>

        {/* 4. Morphology */}
        {data.bloodMorphology && (
          <div className="bg-white dark:bg-slate-900/90 p-3 rounded-xl border border-rose-200 dark:border-rose-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              4. Peripheral Blood Smear Morphology
            </span>
            <p className="text-xs font-semibold text-rose-950 dark:text-rose-200">
              {data.bloodMorphology}
            </p>
          </div>
        )}

        {/* Remarks */}
        {data.remarks && (
          <div className="text-xs text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/70 p-3 rounded-xl border border-rose-200/70 dark:border-rose-800/50">
            <span className="font-bold text-slate-700 dark:text-slate-200">Remarks: </span>
            {data.remarks}
          </div>
        )}
      </div>
    );
  }

  return null;
}
