"use client";

import { useState } from "react";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { UrinePanelData } from "../types/lab-panels";

interface UrineResultFormProps {
  initialData?: Partial<UrinePanelData>;
  onSubmit: (findingsJson: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function UrineResultForm({ initialData, onSubmit, onCancel, loading = false }: UrineResultFormProps) {
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
      <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
          <h4 className="font-bold text-amber-900 dark:text-amber-200 text-base">
            Urine Examination (Urinalysis Panel)
          </h4>
        </div>
        <button
          type="button"
          onClick={handleSetNormal}
          className="text-xs font-semibold px-2.5 py-1 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          Fill All Normal
        </button>
      </div>

      {/* Section 1: Physical Examination */}
      <div>
        <h5 className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-2">
          1. Physical Examination
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Quantity</label>
            <input
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              placeholder="e.g. 20ml, Random"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Reaction (pH)</label>
            <input
              type="text"
              value={reaction}
              onChange={(e) => setReaction(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Specific Gravity</label>
            <input
              type="text"
              value={specificGravity}
              onChange={(e) => setSpecificGravity(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
      <div>
        <h5 className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-2">
          2. Chemical Examination
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Albumin Qual */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Albumin (Qualitative)</label>
            <input
              type="text"
              value={albuminQualitative}
              onChange={(e) => setAlbuminQualitative(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Albumin (Quantitative)</label>
            <input
              type="text"
              value={albuminQuantitative}
              onChange={(e) => setAlbuminQuantitative(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              placeholder="e.g. <30 mg/dL"
            />
          </div>

          {/* Sugar Qual */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Sugar (Qualitative)</label>
            <input
              type="text"
              value={sugarQualitative}
              onChange={(e) => setSugarQualitative(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Sugar (Quantitative)</label>
            <input
              type="text"
              value={sugarQuantitative}
              onChange={(e) => setSugarQuantitative(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              placeholder="e.g. Normal, 100 mg/dL"
            />
          </div>

          {/* Acetone */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Acetone (Ketones)</label>
            <input
              type="text"
              value={acetone}
              onChange={(e) => setAcetone(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Diacetic Acid */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Diacetic Acid</label>
            <input
              type="text"
              value={diaceticAcid}
              onChange={(e) => setDiaceticAcid(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Bilirubin */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Bilirubin</label>
            <input
              type="text"
              value={bilirubin}
              onChange={(e) => setBilirubin(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Urobilinogen */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Urobilinogen</label>
            <input
              type="text"
              value={urobilinogen}
              onChange={(e) => setUrobilinogen(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Urobilin */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Urobilin</label>
            <input
              type="text"
              value={urobilin}
              onChange={(e) => setUrobilin(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* 17-Ketosteroids */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">17-Ketosteroids</label>
            <input
              type="text"
              value={ketosteroids17}
              onChange={(e) => setKetosteroids17(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Sodium (Na) */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Sodium (Na)</label>
            <input
              type="text"
              value={sodium}
              onChange={(e) => setSodium(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Potassium (K) */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Potassium (K)</label>
            <input
              type="text"
              value={potassium}
              onChange={(e) => setPotassium(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Microscopic & Remarks */}
      <div>
        <h5 className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-2">
          3. Microscopic Sediment Examination & Remarks
        </h5>
        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex justify-between">
              <span>Microscopic Findings (Pus cells, RBC, Epithelial cells, Casts, Crystals, Bacteria)</span>
            </label>
            <input
              type="text"
              required
              value={microscopic}
              onChange={(e) => setMicroscopic(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
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

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              placeholder="Additional comments or interpretation..."
            />
          </div>
        </div>
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
