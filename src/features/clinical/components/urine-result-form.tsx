"use client";

import { useState } from "react";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { UrinePanelData, parseUrineSelectedSubTests } from "../types/lab-panels";

interface UrineResultFormProps {
  testName?: string;
  initialData?: Partial<UrinePanelData>;
  onSubmit: (findingsJson: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function UrineResultForm({ testName, initialData, onSubmit, onCancel, loading = false }: UrineResultFormProps) {
  const selected = parseUrineSelectedSubTests(testName);

  const isReqPhysical = selected.isFull || !!selected.reqPhysical;
  const isReqAlbumin = selected.isFull || !!selected.reqAlbumin || !!selected.reqDipstick;
  const isReqSugar = selected.isFull || !!selected.reqSugar || !!selected.reqDipstick;
  const isReqAcetone = selected.isFull || !!selected.reqAcetone || !!selected.reqDipstick;
  const isReqBile = selected.isFull || !!selected.reqBile || !!selected.reqDipstick;
  const isReqKetosteroids = selected.isFull || !!selected.reqKetosteroids;
  const isReqElectrolytes = selected.isFull || !!selected.reqElectrolytes;
  const isReqSediment = selected.isFull || !!selected.reqSediment;

  const getInputClass = (isFieldOrdered: boolean) => {
    if (selected.isFull) {
      return "w-full px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all";
    }
    if (isFieldOrdered) {
      return "w-full px-2.5 py-1.5 rounded-lg border-2 border-amber-400 dark:border-amber-400 ring-2 ring-amber-400/35 dark:ring-amber-500/40 bg-amber-50/80 dark:bg-amber-950/50 text-amber-950 dark:text-amber-100 font-semibold placeholder:text-amber-600/50 shadow-sm focus:ring-4 focus:ring-amber-400/50 focus:border-amber-500 focus:outline-none transition-all";
    }
    return "w-full px-2.5 py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 dark:text-slate-500 opacity-60 hover:opacity-90 focus:opacity-100 focus:border-slate-400 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700 focus:outline-none transition-all";
  };

  // Physical
  const [quantity, setQuantity] = useState(initialData?.quantity || "Random (20ml)");
  const [reaction, setReaction] = useState(initialData?.reaction || "Acidic (pH 6.0)");
  const [specificGravity, setSpecificGravity] = useState(initialData?.specificGravity || "1.020");

  // Chemical
  const [albuminQualitative, setAlbuminQualitative] = useState(initialData?.albuminQualitative || "Nil (Negative)");
  const [albuminQuantitative, setAlbuminQuantitative] = useState(initialData?.albuminQuantitative || "< 30 mg/dL");
  const [sugarQualitative, setSugarQualitative] = useState(initialData?.sugarQualitative || "Nil (Negative)");
  const [sugarQuantitative, setSugarQuantitative] = useState(initialData?.sugarQuantitative || "Normal");
  const [acetone, setAcetone] = useState(initialData?.acetone || "Negative");
  const [diaceticAcid, setDiaceticAcid] = useState(initialData?.diaceticAcid || "Negative");
  const [bilirubin, setBilirubin] = useState(initialData?.bilirubin || "Negative");
  const [urobilinogen, setUrobilinogen] = useState(initialData?.urobilinogen || "Normal (0.2-1.0 mg/dL)");
  const [urobilin, setUrobilin] = useState(initialData?.urobilin || "Negative");
  const [ketosteroids17, setKetosteroids17] = useState(initialData?.ketosteroids17 || "Normal");
  const [sodium, setSodium] = useState(initialData?.sodium || "Normal");
  const [potassium, setPotassium] = useState(initialData?.potassium || "Normal");

  // Microscopic & Remarks
  const [microscopic, setMicroscopic] = useState(
    initialData?.microscopic || "Pus cells: 0-2 /HPF, RBC: 0-1 /HPF, Epith cells: Few, Casts: Nil, Crystals: Nil"
  );
  const [remarks, setRemarks] = useState(initialData?.remarks || "");

  function handleSetRequestedNormal() {
    if (selected.reqPhysical) {
      setQuantity("Random (20ml)");
      setReaction("Acidic (pH 6.0)");
      setSpecificGravity("1.020");
    }
    if (selected.reqAlbumin || selected.reqDipstick) {
      setAlbuminQualitative("Nil (Negative)");
      setAlbuminQuantitative("< 30 mg/dL");
    }
    if (selected.reqSugar || selected.reqDipstick) {
      setSugarQualitative("Nil (Negative)");
      setSugarQuantitative("Normal");
    }
    if (selected.reqBile || selected.reqDipstick) {
      setBilirubin("Negative");
      setUrobilinogen("Normal (0.2-1.0 mg/dL)");
      setUrobilin("Negative");
    }
    if (selected.reqDipstick) {
      setAcetone("Negative");
      setDiaceticAcid("Negative");
      setKetosteroids17("Normal");
      setSodium("Normal");
      setPotassium("Normal");
    }
    if (selected.reqSediment) {
      setMicroscopic("Pus cells: 0-2 /HPF, RBC: 0-1 /HPF, Epith cells: Few, Casts: Nil, Crystals: Nil, Bacteria: None");
    }
    setRemarks("Requested urinalysis parameters evaluated and normal.");
  }

  function handleSetNormal() {
    setQuantity("Random (20ml)");
    setReaction("Acidic (pH 6.0)");
    setSpecificGravity("1.020");
    setAlbuminQualitative("Nil (Negative)");
    setAlbuminQuantitative("< 30 mg/dL");
    setSugarQualitative("Nil (Negative)");
    setSugarQuantitative("Normal");
    setAcetone("Negative");
    setDiaceticAcid("Negative");
    setBilirubin("Negative");
    setUrobilinogen("Normal (0.2-1.0 mg/dL)");
    setUrobilin("Negative");
    setKetosteroids17("Normal");
    setSodium("Normal");
    setPotassium("Normal");
    setMicroscopic("Pus cells: 0-2 /HPF, RBC: 0-1 /HPF, Epith cells: Few, Casts: Nil, Crystals: Nil, Bacteria: None");
    setRemarks("Normal urinalysis examination.");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: UrinePanelData = {
      type: "URINE",
      quantity,
      reaction,
      specificGravity,
      albuminQualitative,
      albuminQuantitative,
      sugarQualitative,
      sugarQuantitative,
      acetone,
      diaceticAcid,
      bilirubin,
      urobilinogen,
      urobilin,
      ketosteroids17,
      sodium,
      potassium,
      microscopic,
      remarks,
    };
    await onSubmit(JSON.stringify(payload));
  }

  return (
    <form onSubmit={handleSubmit} className="bg-amber-50/40 dark:bg-amber-950/20 border-2 border-amber-500/40 dark:border-amber-700/60 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-200 dark:border-amber-800/80 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
          <div>
            <h4 className="font-bold text-amber-900 dark:text-amber-200 text-base">
              {testName ? testName : "Urine Examination (Urinalysis Panel)"}
            </h4>
            {testName && (testName.includes("-") || testName.includes("(")) && (
              <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
                Specifically requested: {testName.replace(/^Urine\s*(\(|\-)\s*/i, "").replace(/\)$/, "")}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {!selected.isFull && (
            <button
              type="button"
              onClick={handleSetRequestedNormal}
              className="text-xs font-semibold px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Fill Requested Normal
            </button>
          )}
          <button
            type="button"
            onClick={handleSetNormal}
            className="text-xs font-semibold px-2.5 py-1 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Fill All Normal
          </button>
        </div>
      </div>

      {/* Doctor's Selected Test Banner */}
      <div className={`p-3.5 rounded-xl border-2 transition-all ${
        !selected.isFull
          ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20 shadow-sm"
          : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
              !selected.isFull ? "bg-amber-600 text-white shadow-xs" : "bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-200"
            }`}>
              {!selected.isFull ? "Doctor's Selective Order" : "Standard Routine Urinalysis"}
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
              {!selected.isFull
                ? `Doctor requested ${selected.selectedList.length} specific test(s). Highlighted in special amber border below:`
                : "All urine parameters requested for complete routine urinalysis."}
            </span>
          </div>
          {!selected.isFull && (
            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-700 shadow-2xs">
              ★ Look for amber highlighted boxes
            </span>
          )}
        </div>

        {!selected.isFull && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2.5 border-t border-amber-200/70 dark:border-amber-800/70">
            <span className="text-[11px] font-bold text-amber-950 dark:text-amber-100 flex items-center gap-1">
              Jump directly to ordered input box:
            </span>
            {isReqAlbumin && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("urine-input-albuminQual");
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  el?.focus();
                }}
                className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs ring-2 ring-amber-300 dark:ring-amber-500 transition-all cursor-pointer hover:scale-105"
              >
                ★ Albumin / Protein ↓
              </button>
            )}
            {isReqSugar && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("urine-input-sugarQual");
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  el?.focus();
                }}
                className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs ring-2 ring-amber-300 dark:ring-amber-500 transition-all cursor-pointer hover:scale-105"
              >
                ★ Sugar / Glucose ↓
              </button>
            )}
            {isReqSediment && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("urine-input-microscopic");
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  el?.focus();
                }}
                className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs ring-2 ring-amber-300 dark:ring-amber-500 transition-all cursor-pointer hover:scale-105"
              >
                ★ Microscopic Sediment ↓
              </button>
            )}
            {isReqPhysical && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("urine-input-quantity");
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  el?.focus();
                }}
                className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs ring-2 ring-amber-300 dark:ring-amber-500 transition-all cursor-pointer hover:scale-105"
              >
                ★ Physical Exam ↓
              </button>
            )}
            {isReqBile && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("urine-input-bilirubin");
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  el?.focus();
                }}
                className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs ring-2 ring-amber-300 dark:ring-amber-500 transition-all cursor-pointer hover:scale-105"
              >
                ★ Bile & Urobilinogen ↓
              </button>
            )}
            {isReqAcetone && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("urine-input-acetone");
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  el?.focus();
                }}
                className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs ring-2 ring-amber-300 dark:ring-amber-500 transition-all cursor-pointer hover:scale-105"
              >
                ★ Acetone (Ketones) ↓
              </button>
            )}
            {selected.selectedList.map((testItem, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700"
              >
                ✓ {testItem}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Section 1: Physical Examination */}
      <div className={`p-3.5 rounded-xl transition-all ${
        selected.reqPhysical
          ? "border-2 border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/70 dark:bg-amber-950/40 shadow-sm"
          : !selected.isFull
          ? "border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75"
          : "border border-amber-200 dark:border-amber-800 bg-white/70 dark:bg-slate-900/50"
      }`}>
        <h5 className="text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200 mb-2.5 flex items-center justify-between">
          <span>1. Physical Examination</span>
          {selected.reqPhysical ? (
            <span className="text-[10px] bg-amber-600 text-white font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
              ★ ORDERED
            </span>
          ) : !selected.isFull ? (
            <span className="text-[10px] text-slate-400 font-normal italic">
              (Optional / Not requested)
            </span>
          ) : null}
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Quantity</span>
              {isReqPhysical ? (
                <span className="text-[10px] bg-amber-600 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs border border-amber-300 animate-pulse">★ ORDERED</span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">Optional</span>
              ) : null}
            </label>
            <input
              id="urine-input-quantity"
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={getInputClass(isReqPhysical)}
              placeholder="e.g. 20ml, Random"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Reaction (pH)</span>
              {isReqPhysical ? (
                <span className="text-[10px] bg-amber-600 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs border border-amber-300 animate-pulse">★ ORDERED</span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">Optional</span>
              ) : null}
            </label>
            <input
              id="urine-input-reaction"
              type="text"
              value={reaction}
              onChange={(e) => setReaction(e.target.value)}
              className={getInputClass(isReqPhysical)}
            />
            <div className="flex flex-wrap gap-1 mt-1">
              {["Acidic (pH 5.5)", "Acidic (pH 6.0)", "Neutral (pH 7.0)", "Alkaline (pH 8.0)"].map((v) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => setReaction(v)}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-amber-200 text-slate-600 dark:text-slate-300 hover:bg-amber-100"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Specific Gravity</span>
              {isReqPhysical ? (
                <span className="text-[10px] bg-amber-600 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs border border-amber-300 animate-pulse">★ ORDERED</span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">Optional</span>
              ) : null}
            </label>
            <input
              id="urine-input-specificGravity"
              type="text"
              value={specificGravity}
              onChange={(e) => setSpecificGravity(e.target.value)}
              className={getInputClass(isReqPhysical)}
            />
            <div className="flex flex-wrap gap-1 mt-1">
              {["1.010", "1.015", "1.020", "1.025", "1.030"].map((v) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => setSpecificGravity(v)}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-amber-200 text-slate-600 dark:text-slate-300 hover:bg-amber-100"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Chemical Examination */}
      <div className="space-y-2">
        <h5 className="text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200 flex items-center justify-between">
          <span>2. Chemical Examination</span>
          {selected.reqDipstick ? (
            <span className="text-[10px] bg-amber-600 text-white font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
              ★ DIPSTICK ORDERED (ALL CHEMICAL TESTS)
            </span>
          ) : (selected.reqAlbumin || selected.reqSugar || selected.reqBile) ? (
            <span className="text-[10px] bg-amber-600 text-white font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
              ★ SELECTIVE CHEMICAL TESTS ORDERED
            </span>
          ) : !selected.isFull ? (
            <span className="text-[10px] text-slate-400 font-normal italic">
              (Optional / Not requested)
            </span>
          ) : null}
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {/* Albumin Qual */}
          <div className={`p-2.5 rounded-xl transition-all ${
            (selected.reqAlbumin || selected.reqDipstick)
              ? "border-2 border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/70 dark:bg-amber-950/40 shadow-sm"
              : !selected.isFull
              ? "border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75"
              : "border border-amber-200 dark:border-amber-800 bg-white/70 dark:bg-slate-900/50"
          }`}>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Albumin (Qualitative)</span>
              {(selected.reqAlbumin || selected.reqDipstick) ? (
                <span className="text-[10px] bg-amber-600 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs">★ ORDERED</span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">(Optional)</span>
              ) : null}
            </label>
            <input
              id="urine-input-albuminQual"
              type="text"
              value={albuminQualitative}
              onChange={(e) => setAlbuminQualitative(e.target.value)}
              className={getInputClass(isReqAlbumin)}
            />
            <div className="flex flex-wrap gap-1 mt-1">
              {["Nil (Negative)", "Trace", "+ (30mg)", "++ (100mg)", "+++ (300mg)"].map((v) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => setAlbuminQualitative(v)}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-amber-200 text-slate-600 dark:text-slate-300 hover:bg-amber-100"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Albumin Quant */}
          <div className={`p-2.5 rounded-xl transition-all ${
            (selected.reqAlbumin || selected.reqDipstick)
              ? "border-2 border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/70 dark:bg-amber-950/40 shadow-sm"
              : !selected.isFull
              ? "border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75"
              : "border border-amber-200 dark:border-amber-800 bg-white/70 dark:bg-slate-900/50"
          }`}>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Albumin (Quantitative)</span>
              {(selected.reqAlbumin || selected.reqDipstick) ? (
                <span className="text-[10px] bg-amber-600 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs">★ ORDERED</span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">(Optional)</span>
              ) : null}
            </label>
            <input
              id="urine-input-albuminQuant"
              type="text"
              value={albuminQuantitative}
              onChange={(e) => setAlbuminQuantitative(e.target.value)}
              className={getInputClass(isReqAlbumin)}
              placeholder="e.g. <30 mg/dL"
            />
          </div>

          {/* Sugar Qual */}
          <div className={`p-2.5 rounded-xl transition-all ${
            (selected.reqSugar || selected.reqDipstick)
              ? "border-2 border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/70 dark:bg-amber-950/40 shadow-sm"
              : !selected.isFull
              ? "border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75"
              : "border border-amber-200 dark:border-amber-800 bg-white/70 dark:bg-slate-900/50"
          }`}>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Sugar (Qualitative)</span>
              {(selected.reqSugar || selected.reqDipstick) ? (
                <span className="text-[10px] bg-amber-600 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs">★ ORDERED</span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">(Optional)</span>
              ) : null}
            </label>
            <input
              id="urine-input-sugarQual"
              type="text"
              value={sugarQualitative}
              onChange={(e) => setSugarQualitative(e.target.value)}
              className={getInputClass(isReqSugar)}
            />
            <div className="flex flex-wrap gap-1 mt-1">
              {["Nil (Negative)", "Trace", "+ (0.5%)", "++ (1%)", "+++ (2%)"].map((v) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => setSugarQualitative(v)}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-amber-200 text-slate-600 dark:text-slate-300 hover:bg-amber-100"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Sugar Quant */}
          <div className={`p-2.5 rounded-xl transition-all ${
            (selected.reqSugar || selected.reqDipstick)
              ? "border-2 border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/70 dark:bg-amber-950/40 shadow-sm"
              : !selected.isFull
              ? "border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75"
              : "border border-amber-200 dark:border-amber-800 bg-white/70 dark:bg-slate-900/50"
          }`}>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Sugar (Quantitative)</span>
              {(selected.reqSugar || selected.reqDipstick) ? (
                <span className="text-[10px] bg-amber-600 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs">★ ORDERED</span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">(Optional)</span>
              ) : null}
            </label>
            <input
              id="urine-input-sugarQuant"
              type="text"
              value={sugarQuantitative}
              onChange={(e) => setSugarQuantitative(e.target.value)}
              className={getInputClass(isReqSugar)}
              placeholder="e.g. Normal, 100 mg/dL"
            />
          </div>

          {/* Acetone */}
          <div className={`p-2.5 rounded-xl transition-all ${
            selected.reqDipstick
              ? "border-2 border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/70 dark:bg-amber-950/40 shadow-sm"
              : !selected.isFull
              ? "border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75"
              : "border border-amber-200 dark:border-amber-800 bg-white/70 dark:bg-slate-900/50"
          }`}>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Acetone (Ketones)</span>
              {selected.reqDipstick ? (
                <span className="text-[10px] bg-amber-600 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs">★ ORDERED</span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">(Optional)</span>
              ) : null}
            </label>
            <input
              id="urine-input-acetone"
              type="text"
              value={acetone}
              onChange={(e) => setAcetone(e.target.value)}
              className={getInputClass(isReqAcetone)}
            />
          </div>

          {/* Diacetic Acid */}
          <div className={`p-2.5 rounded-xl transition-all ${
            selected.reqDipstick
              ? "border-2 border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/70 dark:bg-amber-950/40 shadow-sm"
              : !selected.isFull
              ? "border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75"
              : "border border-amber-200 dark:border-amber-800 bg-white/70 dark:bg-slate-900/50"
          }`}>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Diacetic Acid</span>
              {selected.reqDipstick ? (
                <span className="text-[10px] bg-amber-600 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs">★ ORDERED</span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">(Optional)</span>
              ) : null}
            </label>
            <input
              id="urine-input-diaceticAcid"
              type="text"
              value={diaceticAcid}
              onChange={(e) => setDiaceticAcid(e.target.value)}
              className={getInputClass(isReqAcetone)}
            />
          </div>

          {/* Bilirubin */}
          <div className={`p-2.5 rounded-xl transition-all ${
            (selected.reqBile || selected.reqDipstick)
              ? "border-2 border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/70 dark:bg-amber-950/40 shadow-sm"
              : !selected.isFull
              ? "border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75"
              : "border border-amber-200 dark:border-amber-800 bg-white/70 dark:bg-slate-900/50"
          }`}>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Bilirubin</span>
              {(selected.reqBile || selected.reqDipstick) ? (
                <span className="text-[10px] bg-amber-600 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs">★ ORDERED</span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">(Optional)</span>
              ) : null}
            </label>
            <input
              id="urine-input-bilirubin"
              type="text"
              value={bilirubin}
              onChange={(e) => setBilirubin(e.target.value)}
              className={getInputClass(isReqBile)}
            />
          </div>

          {/* Urobilinogen */}
          <div className={`p-2.5 rounded-xl transition-all ${
            (selected.reqBile || selected.reqDipstick)
              ? "border-2 border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/70 dark:bg-amber-950/40 shadow-sm"
              : !selected.isFull
              ? "border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75"
              : "border border-amber-200 dark:border-amber-800 bg-white/70 dark:bg-slate-900/50"
          }`}>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Urobilinogen</span>
              {(selected.reqBile || selected.reqDipstick) ? (
                <span className="text-[10px] bg-amber-600 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs">★ ORDERED</span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">(Optional)</span>
              ) : null}
            </label>
            <input
              id="urine-input-urobilinogen"
              type="text"
              value={urobilinogen}
              onChange={(e) => setUrobilinogen(e.target.value)}
              className={getInputClass(isReqBile)}
            />
          </div>

          {/* Urobilin */}
          <div className={`p-2.5 rounded-xl transition-all ${
            (selected.reqBile || selected.reqDipstick)
              ? "border-2 border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/70 dark:bg-amber-950/40 shadow-sm"
              : !selected.isFull
              ? "border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75"
              : "border border-amber-200 dark:border-amber-800 bg-white/70 dark:bg-slate-900/50"
          }`}>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Urobilin</span>
              {(selected.reqBile || selected.reqDipstick) ? (
                <span className="text-[10px] bg-amber-600 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs">★ ORDERED</span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">(Optional)</span>
              ) : null}
            </label>
            <input
              id="urine-input-urobilin"
              type="text"
              value={urobilin}
              onChange={(e) => setUrobilin(e.target.value)}
              className={getInputClass(isReqBile)}
            />
          </div>

          {/* 17-Ketosteroids */}
          <div className={`p-2.5 rounded-xl ${isReqKetosteroids ? "border-2 border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/70 dark:bg-amber-950/40 shadow-sm" : !selected.isFull ? "border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75" : "border border-amber-200 dark:border-amber-800 bg-white/70 dark:bg-slate-900/50"}`}>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>17-Ketosteroids</span>
              {isReqKetosteroids && !selected.isFull ? (
                <span className="text-[10px] bg-amber-600 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs border border-amber-300 animate-pulse">★ ORDERED</span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">(Optional)</span>
              ) : null}
            </label>
            <input
              id="urine-input-ketosteroids"
              type="text"
              value={ketosteroids17}
              onChange={(e) => setKetosteroids17(e.target.value)}
              className={getInputClass(isReqKetosteroids)}
            />
          </div>

          {/* Sodium (Na) */}
          <div className={`p-2.5 rounded-xl ${isReqElectrolytes ? "border-2 border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/70 dark:bg-amber-950/40 shadow-sm" : !selected.isFull ? "border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75" : "border border-amber-200 dark:border-amber-800 bg-white/70 dark:bg-slate-900/50"}`}>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Sodium (Na)</span>
              {isReqElectrolytes && !selected.isFull ? (
                <span className="text-[10px] bg-amber-600 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs border border-amber-300 animate-pulse">★ ORDERED</span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">(Optional)</span>
              ) : null}
            </label>
            <input
              id="urine-input-sodium"
              type="text"
              value={sodium}
              onChange={(e) => setSodium(e.target.value)}
              className={getInputClass(isReqElectrolytes)}
            />
          </div>

          {/* Potassium (K) */}
          <div className={`p-2.5 rounded-xl ${isReqElectrolytes ? "border-2 border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/70 dark:bg-amber-950/40 shadow-sm" : !selected.isFull ? "border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75" : "border border-amber-200 dark:border-amber-800 bg-white/70 dark:bg-slate-900/50"}`}>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Potassium (K)</span>
              {isReqElectrolytes && !selected.isFull ? (
                <span className="text-[10px] bg-amber-600 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs border border-amber-300 animate-pulse">★ ORDERED</span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">(Optional)</span>
              ) : null}
            </label>
            <input
              id="urine-input-potassium"
              type="text"
              value={potassium}
              onChange={(e) => setPotassium(e.target.value)}
              className={getInputClass(isReqElectrolytes)}
            />
          </div>
        </div>
      </div>

      {/* Section 3: Microscopic & Remarks */}
      <div className={`p-3.5 rounded-xl transition-all ${
        selected.reqSediment
          ? "border-2 border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/70 dark:bg-amber-950/40 shadow-sm"
          : !selected.isFull
          ? "border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75"
          : "border border-amber-200 dark:border-amber-800 bg-white/70 dark:bg-slate-900/50"
      }`}>
        <h5 className="text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200 mb-2 flex items-center justify-between">
          <span>3. Microscopic Sediment Examination</span>
          {selected.reqSediment ? (
            <span className="text-[10px] bg-amber-600 text-white font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
              ★ ORDERED
            </span>
          ) : !selected.isFull ? (
            <span className="text-[10px] text-slate-400 font-normal italic">
              (Optional / Not requested)
            </span>
          ) : null}
        </h5>
        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex justify-between">
              <span>Microscopic Findings (Pus cells, RBC, Epithelial cells, Casts, Crystals, Bacteria)</span>
            </label>
            <input
              id="urine-input-microscopic"
              type="text"
              required={selected.reqSediment}
              value={microscopic}
              onChange={(e) => setMicroscopic(e.target.value)}
              className={getInputClass(isReqSediment)}
              placeholder="e.g. Pus cells: 2-4/HPF, RBC: 0-1/HPF, Epith cells: Few, Casts: Nil, Crystals: Nil"
            />
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {[
                "Pus cells: 0-2 /HPF",
                "Pus cells: 5-10 /HPF",
                "Pus cells: Many (>20/HPF)",
                "RBC: 0-1 /HPF",
                "RBC: 2-4 /HPF",
                "RBC: Gross / Many",
                "Epith cells: Few",
                "Epith cells: Moderate",
                "Casts: None seen",
                "Casts: Hyaline casts seen",
                "Crystals: CaOx seen",
                "Crystals: Uric acid seen",
                "Bacteria: None seen",
                "Bacteria: Present (+)",
                "Yeast cells seen",
                "T. vaginalis seen"
              ].map((chip) => (
                <button
                  type="button"
                  key={chip}
                  onClick={() => {
                    if (!microscopic) setMicroscopic(chip);
                    else setMicroscopic(`${microscopic}, ${chip}`);
                  }}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100/70 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:bg-amber-200 transition-colors"
                >
                  + {chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Remarks */}
      <div className="p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-800/80 bg-white/70 dark:bg-slate-900/50">
        <label className="block font-bold text-xs text-slate-700 dark:text-slate-300 mb-1">Remarks & Additional Diagnostic Notes</label>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs"
          placeholder="Additional comments or interpretation..."
        />
      </div>

      <div className="flex justify-end gap-2.5 pt-2 border-t border-amber-200 dark:border-amber-800/80">
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
          className="text-xs font-bold px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          Save Urine Examination
        </button>
      </div>
    </form>
  );
}
