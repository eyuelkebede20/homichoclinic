"use client";

import { useState } from "react";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { HematologyPanelData, parseHematologySelectedSubTests } from "../types/lab-panels";

interface HematologyResultFormProps {
  testName?: string;
  initialData?: Partial<HematologyPanelData>;
  onSubmit: (findingsJson: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function HematologyResultForm({ testName, initialData, onSubmit, onCancel, loading = false }: HematologyResultFormProps) {
  const selected = parseHematologySelectedSubTests(testName);

  const isReqWbcDiff = selected.isFull || !!selected.reqWbcDiff;
  const isReqHgbHct = selected.isFull || !!selected.reqHgbHct;
  const isReqRbc = selected.isFull || !!selected.reqRbc || !!selected.reqHgbHct;
  const isReqPlatelets = selected.isFull || !!selected.reqPlatelets;
  const isReqReticulocytes = selected.isFull || !!selected.reqReticulocytes;
  const isReqCoagulation = selected.isFull || !!selected.reqCoagulation;
  const isReqEsr = selected.isFull || !!selected.reqEsr;
  const isReqIndices = selected.isFull || !!selected.reqIndices;
  const isReqMorphology = selected.isFull || !!selected.reqMorphology;

  const getInputClass = (isFieldOrdered: boolean) => {
    if (selected.isFull) {
      return "w-full px-2.5 py-1.5 rounded-lg border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all";
    }
    if (isFieldOrdered) {
      return "w-full px-2.5 py-1.5 rounded-lg border-2 border-rose-400 dark:border-rose-400 ring-2 ring-rose-400/35 dark:ring-rose-500/40 bg-rose-50/80 dark:bg-rose-950/50 text-rose-950 dark:text-rose-100 font-semibold font-mono placeholder:text-rose-600/50 shadow-sm focus:ring-4 focus:ring-rose-400/50 focus:border-rose-500 focus:outline-none transition-all";
    }
    return "w-full px-2.5 py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 dark:text-slate-500 font-mono opacity-60 hover:opacity-90 focus:opacity-100 focus:border-slate-400 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700 focus:outline-none transition-all";
  };

  // Cell Counts & CBC Core
  const [wbc, setWbc] = useState(initialData?.wbc || "6.8");
  const [rbc, setRbc] = useState(initialData?.rbc || "4.8");
  const [hemoglobin, setHemoglobin] = useState(initialData?.hemoglobin || "14.5");
  const [hematocrit, setHematocrit] = useState(initialData?.hematocrit || "42.0");
  const [platelets, setPlatelets] = useState(initialData?.platelets || "240");
  const [reticulocytes, setReticulocytes] = useState(initialData?.reticulocytes || "1.2");

  // Differential Count
  const [neutrophils, setNeutrophils] = useState(initialData?.neutrophils || "60");
  const [bands, setBands] = useState(initialData?.bands || "2");
  const [lymphocytes, setLymphocytes] = useState(initialData?.lymphocytes || "30");
  const [monocytes, setMonocytes] = useState(initialData?.monocytes || "5");
  const [eosinophils, setEosinophils] = useState(initialData?.eosinophils || "3");
  const [basophils, setBasophils] = useState(initialData?.basophils || "0");
  const [blast, setBlast] = useState(initialData?.blast || "0");
  const [myelocytes, setMyelocytes] = useState(initialData?.myelocytes || "0");

  // Coagulation, ESR & RBC Indices
  const [bleedingTime, setBleedingTime] = useState(initialData?.bleedingTime || "3 min 30 sec");
  const [coagulationTime, setCoagulationTime] = useState(initialData?.coagulationTime || "6 min 00 sec");
  const [prothrombinTime, setProthrombinTime] = useState(initialData?.prothrombinTime || "12.5 sec");
  const [esr, setEsr] = useState(initialData?.esr || "8");
  const [mcv, setMcv] = useState(initialData?.mcv || "88.0");
  const [mch, setMch] = useState(initialData?.mch || "30.0");
  const [mchc, setMchc] = useState(initialData?.mchc || "34.0");

  // Morphology & Remarks
  const [bloodMorphology, setBloodMorphology] = useState(
    initialData?.bloodMorphology || "Normocytic, normochromic RBCs. Adequate platelets. Normal WBC morphology."
  );
  const [remarks, setRemarks] = useState(initialData?.remarks || "");

  function handleSetRequestedNormal() {
    if (selected.reqWbcDiff) {
      setWbc("6.8");
      setNeutrophils("60");
      setBands("2");
      setLymphocytes("30");
      setMonocytes("5");
      setEosinophils("3");
      setBasophils("0");
      setBlast("0");
      setMyelocytes("0");
    }
    if (selected.reqHgbHct) {
      setRbc("4.8");
      setHemoglobin("14.5");
      setHematocrit("42.0");
    }
    if (selected.reqPlatelets) {
      setPlatelets("240");
    }
    if (selected.reqEsr) {
      setEsr("8");
    }
    if (selected.reqCoagulation) {
      setBleedingTime("3 min 30 sec");
      setCoagulationTime("6 min 00 sec");
      setProthrombinTime("12.5 sec");
    }
    if (selected.reqIndices) {
      setMcv("88.0");
      setMch("30.0");
      setMchc("34.0");
    }
    if (selected.reqMorphology) {
      setBloodMorphology("Normocytic, normochromic RBCs. Platelets adequate on smear.");
    }
    setRemarks("Requested hematology parameters evaluated and normal.");
  }

  function handleSetNormal() {
    setWbc("6.8");
    setRbc("4.8");
    setHemoglobin("14.5");
    setHematocrit("42.0");
    setPlatelets("240");
    setReticulocytes("1.2");

    setNeutrophils("60");
    setBands("2");
    setLymphocytes("30");
    setMonocytes("5");
    setEosinophils("3");
    setBasophils("0");
    setBlast("0");
    setMyelocytes("0");

    setBleedingTime("3 min 30 sec");
    setCoagulationTime("6 min 00 sec");
    setProthrombinTime("12.5 sec");
    setEsr("8");
    setMcv("88.0");
    setMch("30.0");
    setMchc("34.0");

    setBloodMorphology("Normocytic, normochromic RBCs. Normal WBC morphology. Platelets adequate on smear.");
    setRemarks("Complete blood count within normal clinical reference ranges.");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: HematologyPanelData = {
      type: "HEMATOLOGY",
      wbc,
      neutrophils,
      bands,
      lymphocytes,
      monocytes,
      eosinophils,
      basophils,
      blast,
      myelocytes,
      platelets,
      reticulocytes,
      rbc,
      hematocrit,
      hemoglobin,
      bleedingTime,
      coagulationTime,
      prothrombinTime,
      esr,
      mcv,
      mch,
      mchc,
      bloodMorphology,
      remarks,
    };
    await onSubmit(JSON.stringify(payload));
  }

  return (
    <form onSubmit={handleSubmit} className="bg-rose-50/40 dark:bg-rose-950/20 border-2 border-rose-500/40 dark:border-rose-700/60 rounded-xl p-5 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-rose-200 dark:border-rose-800/80 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-600 animate-pulse" />
          <div>
            <h4 className="font-bold text-rose-950 dark:text-rose-200 text-base">
              {testName ? testName : "Hematology & Complete Blood Count (CBC) Panel"}
            </h4>
            {testName && (testName.includes("-") || testName.includes("(")) && (
              <p className="text-xs text-rose-700 dark:text-rose-400 font-semibold">
                Specifically requested: {testName.replace(/^Hematology\s*(\(|\-)\s*/i, "").replace(/\)$/, "")}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {!selected.isFull && (
            <button
              type="button"
              onClick={handleSetRequestedNormal}
              className="text-xs font-semibold px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Fill Requested Normal
            </button>
          )}
          <button
            type="button"
            onClick={handleSetNormal}
            className="text-xs font-semibold px-2.5 py-1 bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 rounded-lg hover:bg-rose-200 dark:hover:bg-rose-800 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            Fill All Normal
          </button>
        </div>
      </div>

      {/* Doctor's Selected Test Banner */}
      <div className={`p-3.5 rounded-xl border-2 transition-all ${
        !selected.isFull
          ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/20 shadow-sm"
          : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800"
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
              !selected.isFull ? "bg-rose-700 text-white shadow-xs" : "bg-rose-200 dark:bg-rose-800 text-rose-950 dark:text-rose-200"
            }`}>
              {!selected.isFull ? "Doctor's Selective Order" : "Complete CBC / Full Panel"}
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
              {!selected.isFull
                ? `Doctor requested ${selected.selectedList.length} specific test(s). Highlighted in special rose border below:`
                : "All hematology parameters requested for full complete blood count."}
            </span>
          </div>
          {!selected.isFull && (
            <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-rose-300 dark:border-rose-700 shadow-2xs">
              ★ Look for rose highlighted boxes
            </span>
          )}
        </div>

        {!selected.isFull && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2.5 border-t border-rose-200/70 dark:border-rose-800/70">
            <span className="text-[11px] font-bold text-rose-950 dark:text-rose-100 flex items-center gap-1">
              Jump directly to ordered input box:
            </span>
            {isReqWbcDiff && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("hema-input-wbc");
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  el?.focus();
                }}
                className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-700 hover:bg-rose-800 text-white shadow-xs ring-2 ring-rose-300 dark:ring-rose-500 transition-all cursor-pointer hover:scale-105"
              >
                ★ WBC & Diff ↓
              </button>
            )}
            {isReqHgbHct && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("hema-input-hemoglobin");
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  el?.focus();
                }}
                className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-700 hover:bg-rose-800 text-white shadow-xs ring-2 ring-rose-300 dark:ring-rose-500 transition-all cursor-pointer hover:scale-105"
              >
                ★ Hemoglobin & Hct ↓
              </button>
            )}
            {isReqPlatelets && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("hema-input-platelets");
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  el?.focus();
                }}
                className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-700 hover:bg-rose-800 text-white shadow-xs ring-2 ring-rose-300 dark:ring-rose-500 transition-all cursor-pointer hover:scale-105"
              >
                ★ Platelets ↓
              </button>
            )}
            {isReqEsr && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("hema-input-esr");
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  el?.focus();
                }}
                className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-700 hover:bg-rose-800 text-white shadow-xs ring-2 ring-rose-300 dark:ring-rose-500 transition-all cursor-pointer hover:scale-105"
              >
                ★ E.S.R. ↓
              </button>
            )}
            {isReqCoagulation && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("hema-input-bleedingTime");
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  el?.focus();
                }}
                className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-700 hover:bg-rose-800 text-white shadow-xs ring-2 ring-rose-300 dark:ring-rose-500 transition-all cursor-pointer hover:scale-105"
              >
                ★ Coagulation Profile ↓
              </button>
            )}
            {isReqIndices && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("hema-input-mcv");
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  el?.focus();
                }}
                className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-700 hover:bg-rose-800 text-white shadow-xs ring-2 ring-rose-300 dark:ring-rose-500 transition-all cursor-pointer hover:scale-105"
              >
                ★ RBC Indices ↓
              </button>
            )}
            {isReqMorphology && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("hema-input-morphology");
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  el?.focus();
                }}
                className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-700 hover:bg-rose-800 text-white shadow-xs ring-2 ring-rose-300 dark:ring-rose-500 transition-all cursor-pointer hover:scale-105"
              >
                ★ Morphology Smear ↓
              </button>
            )}
            {selected.selectedList.map((testItem, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700"
              >
                ✓ {testItem}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 1. Core Blood Counts */}
      <div>
        <h5 className="text-[11px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 mb-2">
          1. General Cell Counts & Core Parameters
        </h5>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 text-xs">
          {/* WBC */}
          <div className={`p-2.5 rounded-xl transition-all ${
            selected.reqWbcDiff
              ? "border-2 border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/70 dark:bg-rose-950/40 shadow-sm"
              : !selected.isFull
              ? "border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75"
              : "border border-rose-200 dark:border-rose-800 bg-white/70 dark:bg-slate-900/50"
          }`}>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5 flex items-center justify-between">
              <span>W.B.C.</span>
              {selected.reqWbcDiff ? (
                <span className="text-[10px] bg-rose-700 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs">★ ORDERED</span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">(Optional)</span>
              ) : null}
            </label>
            <div className="text-[10px] text-slate-400 mb-1">4.0 - 11.0 ×10³/µL</div>
            <input
              id="hema-input-wbc"
              type="text"
              value={wbc}
              onChange={(e) => setWbc(e.target.value)}
              className={getInputClass(isReqWbcDiff)}
            />
          </div>

          {/* RBC */}
          <div className={`p-2.5 rounded-xl transition-all ${
            selected.reqHgbHct
              ? "border-2 border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/70 dark:bg-rose-950/40 shadow-sm"
              : !selected.isFull
              ? "border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75"
              : "border border-rose-200 dark:border-rose-800 bg-white/70 dark:bg-slate-900/50"
          }`}>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5 flex items-center justify-between">
              <span>R.B.C.</span>
              {selected.reqHgbHct ? (
                <span className="text-[10px] bg-rose-700 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs">★ ORDERED</span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">(Optional)</span>
              ) : null}
            </label>
            <div className="text-[10px] text-slate-400 mb-1">4.0 - 5.5 ×10⁶/µL</div>
            <input
              id="hema-input-rbc"
              type="text"
              value={rbc}
              onChange={(e) => setRbc(e.target.value)}
              className={getInputClass(isReqRbc)}
            />
          </div>

          {/* Hemoglobin */}
          <div className={`p-2.5 rounded-xl transition-all ${
            selected.reqHgbHct
              ? "border-2 border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/70 dark:bg-rose-950/40 shadow-sm"
              : !selected.isFull
              ? "border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75"
              : "border border-rose-200 dark:border-rose-800 bg-white/70 dark:bg-slate-900/50"
          }`}>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5 flex items-center justify-between">
              <span>Hemoglobin</span>
              {selected.reqHgbHct ? (
                <span className="text-[10px] bg-rose-700 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs">★ ORDERED</span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">(Optional)</span>
              ) : null}
            </label>
            <div className="text-[10px] text-slate-400 mb-1">12.0 - 17.5 g/dL</div>
            <input
              id="hema-input-hemoglobin"
              type="text"
              value={hemoglobin}
              onChange={(e) => setHemoglobin(e.target.value)}
              className={getInputClass(isReqHgbHct)}
            />
          </div>

          {/* Hematocrit */}
          <div className={`p-2.5 rounded-xl transition-all ${
            selected.reqHgbHct
              ? "border-2 border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/70 dark:bg-rose-950/40 shadow-sm"
              : !selected.isFull
              ? "border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75"
              : "border border-rose-200 dark:border-rose-800 bg-white/70 dark:bg-slate-900/50"
          }`}>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5 flex items-center justify-between">
              <span>Hematocrit</span>
              {selected.reqHgbHct ? (
                <span className="text-[10px] bg-rose-700 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs">★ ORDERED</span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">(Optional)</span>
              ) : null}
            </label>
            <div className="text-[10px] text-slate-400 mb-1">36 - 52 %</div>
            <input
              id="hema-input-hematocrit"
              type="text"
              value={hematocrit}
              onChange={(e) => setHematocrit(e.target.value)}
              className={getInputClass(isReqHgbHct)}
            />
          </div>

          {/* Platelets */}
          <div className={`p-2.5 rounded-xl transition-all ${
            selected.reqPlatelets
              ? "border-2 border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/70 dark:bg-rose-950/40 shadow-sm"
              : !selected.isFull
              ? "border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75"
              : "border border-rose-200 dark:border-rose-800 bg-white/70 dark:bg-slate-900/50"
          }`}>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5 flex items-center justify-between">
              <span>Platelets</span>
              {selected.reqPlatelets ? (
                <span className="text-[10px] bg-rose-700 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs">★ ORDERED</span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">(Optional)</span>
              ) : null}
            </label>
            <div className="text-[10px] text-slate-400 mb-1">150 - 450 ×10³/µL</div>
            <input
              id="hema-input-platelets"
              type="text"
              value={platelets}
              onChange={(e) => setPlatelets(e.target.value)}
              className={getInputClass(isReqPlatelets)}
            />
          </div>

          {/* Reticulocytes */}
          <div className={`p-2.5 rounded-xl transition-all ${
            selected.reqReticulocytes
              ? "border-2 border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/70 dark:bg-rose-950/40 shadow-sm"
              : !selected.isFull
              ? "border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75"
              : "border border-rose-200 dark:border-rose-800 bg-white/70 dark:bg-slate-900/50"
          }`}>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5 flex items-center justify-between">
              <span>Reticulocytes</span>
              {selected.reqReticulocytes ? (
                <span className="text-[10px] bg-rose-700 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs">★ ORDERED</span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">(Optional)</span>
              ) : null}
            </label>
            <div className="text-[10px] text-slate-400 mb-1">0.5 - 2.5 %</div>
            <input
              id="hema-input-reticulocytes"
              type="text"
              value={reticulocytes}
              onChange={(e) => setReticulocytes(e.target.value)}
              className={getInputClass(isReqReticulocytes)}
            />
          </div>
        </div>
      </div>

      {/* 2. Differential Count */}
      <div className={`p-3.5 rounded-xl transition-all ${
        selected.reqWbcDiff
          ? "border-2 border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/70 dark:bg-rose-950/40 shadow-sm"
          : !selected.isFull
          ? "border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75"
          : "border border-rose-200 dark:border-rose-800 bg-white/70 dark:bg-slate-900/50"
      }`}>
        <h5 className="text-[11px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 mb-2.5 flex items-center justify-between">
          <span>2. Differential White Cell Count (%)</span>
          {selected.reqWbcDiff ? (
            <span className="text-[10px] text-white bg-rose-700 px-2 py-0.5 rounded-full font-extrabold shadow-2xs">★ ORDERED</span>
          ) : !selected.isFull ? (
            <span className="text-[10px] text-slate-400 font-normal italic">(Optional / Not requested)</span>
          ) : null}
        </h5>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Neutrophils</label>
            <div className="text-[9px] text-slate-400 mb-1">40 - 75%</div>
            <input
              id="hema-input-neutrophils"
              type="text"
              value={neutrophils}
              onChange={(e) => setNeutrophils(e.target.value)}
              className={getInputClass(isReqWbcDiff)}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Bands</label>
            <div className="text-[9px] text-slate-400 mb-1">0 - 5%</div>
            <input
              id="hema-input-bands"
              type="text"
              value={bands}
              onChange={(e) => setBands(e.target.value)}
              className={getInputClass(isReqWbcDiff)}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Lymphocytes</label>
            <div className="text-[9px] text-slate-400 mb-1">20 - 45%</div>
            <input
              id="hema-input-lymphocytes"
              type="text"
              value={lymphocytes}
              onChange={(e) => setLymphocytes(e.target.value)}
              className={getInputClass(isReqWbcDiff)}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Monocytes</label>
            <div className="text-[9px] text-slate-400 mb-1">2 - 10%</div>
            <input
              id="hema-input-monocytes"
              type="text"
              value={monocytes}
              onChange={(e) => setMonocytes(e.target.value)}
              className={getInputClass(isReqWbcDiff)}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Eosinophils</label>
            <div className="text-[9px] text-slate-400 mb-1">1 - 6%</div>
            <input
              id="hema-input-eosinophils"
              type="text"
              value={eosinophils}
              onChange={(e) => setEosinophils(e.target.value)}
              className={getInputClass(isReqWbcDiff)}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Basophils</label>
            <div className="text-[9px] text-slate-400 mb-1">0 - 1%</div>
            <input
              id="hema-input-basophils"
              type="text"
              value={basophils}
              onChange={(e) => setBasophils(e.target.value)}
              className={getInputClass(isReqWbcDiff)}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Blast</label>
            <div className="text-[9px] text-slate-400 mb-1">0%</div>
            <input
              id="hema-input-blast"
              type="text"
              value={blast}
              onChange={(e) => setBlast(e.target.value)}
              className={getInputClass(isReqWbcDiff)}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Myelocytes</label>
            <div className="text-[9px] text-slate-400 mb-1">0%</div>
            <input
              id="hema-input-myelocytes"
              type="text"
              value={myelocytes}
              onChange={(e) => setMyelocytes(e.target.value)}
              className={getInputClass(isReqWbcDiff)}
            />
          </div>
        </div>
      </div>

      {/* 3. Coagulation, ESR & RBC Indices */}
      <div>
        <h5 className="text-[11px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 mb-2">
          3. Coagulation, E.S.R. & RBC Indices
        </h5>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 text-xs">
          {/* Bleeding Time */}
          <div className={`p-2.5 rounded-xl transition-all ${
            selected.reqCoagulation
              ? "border-2 border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/70 dark:bg-rose-950/40 shadow-sm"
              : !selected.isFull
              ? "border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75"
              : "border border-rose-200 dark:border-rose-800 bg-white/70 dark:bg-slate-900/50"
          }`}>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5 flex items-center justify-between">
              <span>Bleeding Time</span>
              {selected.reqCoagulation ? (
                <span className="text-[10px] bg-rose-700 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs">★ ORDERED</span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">(Optional)</span>
              ) : null}
            </label>
            <div className="text-[9px] text-slate-400 mb-1">2 - 7 min</div>
            <input
              id="hema-input-bleedingTime"
              type="text"
              value={bleedingTime}
              onChange={(e) => setBleedingTime(e.target.value)}
              className={getInputClass(isReqCoagulation)}
            />
          </div>

          {/* Coagulation Time */}
          <div className={`p-2.5 rounded-xl transition-all ${
            selected.reqCoagulation
              ? "border-2 border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/70 dark:bg-rose-950/40 shadow-sm"
              : !selected.isFull
              ? "border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75"
              : "border border-rose-200 dark:border-rose-800 bg-white/70 dark:bg-slate-900/50"
          }`}>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5 flex items-center justify-between">
              <span>Coagulation Time</span>
              {selected.reqCoagulation ? (
                <span className="text-[10px] bg-rose-700 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs">★ ORDERED</span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">(Optional)</span>
              ) : null}
            </label>
            <div className="text-[9px] text-slate-400 mb-1">5 - 11 min</div>
            <input
              id="hema-input-coagulationTime"
              type="text"
              value={coagulationTime}
              onChange={(e) => setCoagulationTime(e.target.value)}
              className={getInputClass(isReqCoagulation)}
            />
          </div>

          {/* Prothrombin Time */}
          <div className={`p-2.5 rounded-xl transition-all ${
            selected.reqCoagulation
              ? "border-2 border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/70 dark:bg-rose-950/40 shadow-sm"
              : !selected.isFull
              ? "border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75"
              : "border border-rose-200 dark:border-rose-800 bg-white/70 dark:bg-slate-900/50"
          }`}>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5 flex items-center justify-between">
              <span>Prothrombin Time</span>
              {selected.reqCoagulation ? (
                <span className="text-[10px] bg-rose-700 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs">★ ORDERED</span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">(Optional)</span>
              ) : null}
            </label>
            <div className="text-[9px] text-slate-400 mb-1">11 - 13.5 sec</div>
            <input
              id="hema-input-prothrombinTime"
              type="text"
              value={prothrombinTime}
              onChange={(e) => setProthrombinTime(e.target.value)}
              className={getInputClass(isReqCoagulation)}
            />
          </div>

          {/* ESR */}
          <div className={`p-2.5 rounded-xl transition-all ${
            selected.reqEsr
              ? "border-2 border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/70 dark:bg-rose-950/40 shadow-sm"
              : !selected.isFull
              ? "border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75"
              : "border border-rose-200 dark:border-rose-800 bg-white/70 dark:bg-slate-900/50"
          }`}>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5 flex items-center justify-between">
              <span>E.S.R.</span>
              {selected.reqEsr ? (
                <span className="text-[10px] bg-rose-700 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs">★ ORDERED</span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">(Optional)</span>
              ) : null}
            </label>
            <div className="text-[9px] text-slate-400 mb-1">0 - 20 mm/hr</div>
            <input
              id="hema-input-esr"
              type="text"
              value={esr}
              onChange={(e) => setEsr(e.target.value)}
              className={getInputClass(isReqEsr)}
            />
          </div>

          {/* MCV */}
          <div className={`p-2.5 rounded-xl transition-all ${
            selected.reqIndices
              ? "border-2 border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/70 dark:bg-rose-950/40 shadow-sm"
              : !selected.isFull
              ? "border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75"
              : "border border-rose-200 dark:border-rose-800 bg-white/70 dark:bg-slate-900/50"
          }`}>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5 flex items-center justify-between">
              <span>MCV</span>
              {selected.reqIndices ? (
                <span className="text-[10px] bg-rose-700 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs">★ ORDERED</span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">(Optional)</span>
              ) : null}
            </label>
            <div className="text-[9px] text-slate-400 mb-1">80 - 100 fL</div>
            <input
              id="hema-input-mcv"
              type="text"
              value={mcv}
              onChange={(e) => setMcv(e.target.value)}
              className={getInputClass(isReqIndices)}
            />
          </div>

          {/* MCH */}
          <div className={`p-2.5 rounded-xl transition-all ${
            selected.reqIndices
              ? "border-2 border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/70 dark:bg-rose-950/40 shadow-sm"
              : !selected.isFull
              ? "border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75"
              : "border border-rose-200 dark:border-rose-800 bg-white/70 dark:bg-slate-900/50"
          }`}>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5 flex items-center justify-between">
              <span>MCH</span>
              {selected.reqIndices ? (
                <span className="text-[10px] bg-rose-700 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs">★ ORDERED</span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">(Optional)</span>
              ) : null}
            </label>
            <div className="text-[9px] text-slate-400 mb-1">27 - 33 pg</div>
            <input
              id="hema-input-mch"
              type="text"
              value={mch}
              onChange={(e) => setMch(e.target.value)}
              className={getInputClass(isReqIndices)}
            />
          </div>

          {/* MCHC */}
          <div className={`p-2.5 rounded-xl transition-all ${
            selected.reqIndices
              ? "border-2 border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/70 dark:bg-rose-950/40 shadow-sm"
              : !selected.isFull
              ? "border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75"
              : "border border-rose-200 dark:border-rose-800 bg-white/70 dark:bg-slate-900/50"
          }`}>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5 flex items-center justify-between">
              <span>MCHC</span>
              {selected.reqIndices ? (
                <span className="text-[10px] bg-rose-700 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs">★ ORDERED</span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">(Optional)</span>
              ) : null}
            </label>
            <div className="text-[9px] text-slate-400 mb-1">32 - 36 g/dL</div>
            <input
              id="hema-input-mchc"
              type="text"
              value={mchc}
              onChange={(e) => setMchc(e.target.value)}
              className={getInputClass(isReqIndices)}
            />
          </div>
        </div>
      </div>

      {/* 4. Morphology & Remarks */}
      <div>
        <h5 className="text-[11px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 mb-2">
          4. Blood Morphology & Remarks
        </h5>
        <div className="space-y-3 text-xs">
          <div className={`p-3.5 rounded-xl transition-all ${
            selected.reqMorphology
              ? "border-2 border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/70 dark:bg-rose-950/40 shadow-sm"
              : !selected.isFull
              ? "border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75"
              : "border border-rose-200 dark:border-rose-800 bg-white/70 dark:bg-slate-900/50"
          }`}>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Blood Morphology</span>
              {selected.reqMorphology ? (
                <span className="text-[10px] bg-rose-700 text-white font-extrabold px-2 py-0.5 rounded-full shadow-2xs">★ ORDERED</span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">(Optional / Not requested)</span>
              ) : null}
            </label>
            <input
              id="hema-input-morphology"
              type="text"
              value={bloodMorphology}
              onChange={(e) => setBloodMorphology(e.target.value)}
              className={getInputClass(isReqMorphology)}
              placeholder="e.g. Normocytic, normochromic RBCs. Adequate platelets."
            />
          </div>

          <div className="p-3.5 rounded-xl border border-rose-200/80 dark:border-rose-800/80 bg-white/70 dark:bg-slate-900/50">
            <label className="block font-bold text-xs text-slate-700 dark:text-slate-300 mb-1">Remarks & Interpretation</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              placeholder="Additional comments or interpretation..."
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2.5 pt-2 border-t border-rose-200 dark:border-rose-800/80">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="text-xs font-bold px-5 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          Save Hematology Results
        </button>
      </div>
    </form>
  );
}
