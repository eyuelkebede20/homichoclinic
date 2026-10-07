"use client";

import { useState } from "react";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { HematologyPanelData } from "../types/lab-panels";

interface HematologyResultFormProps {
  initialData?: Partial<HematologyPanelData>;
  onSubmit: (findingsJson: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function HematologyResultForm({ initialData, onSubmit, onCancel, loading = false }: HematologyResultFormProps) {
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
      <div className="flex items-center justify-between border-b border-rose-200 dark:border-rose-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-600 animate-pulse" />
          <h4 className="font-bold text-rose-950 dark:text-rose-200 text-base">
            Hematology & Complete Blood Count (CBC) Panel
          </h4>
        </div>
        <button
          type="button"
          onClick={handleSetNormal}
          className="text-xs font-semibold px-2.5 py-1 bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 rounded-lg hover:bg-rose-200 dark:hover:bg-rose-800 transition-colors flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          Fill All Normal Values
        </button>
      </div>

      {/* 1. Core Blood Counts */}
      <div>
        <h5 className="text-[11px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 mb-2">
          1. General Cell Counts & Core Parameters
        </h5>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">W.B.C.</label>
            <div className="text-[10px] text-slate-400 mb-1">4.0 - 11.0 ×10³/µL</div>
            <input
              type="text"
              value={wbc}
              onChange={(e) => setWbc(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">R.B.C.</label>
            <div className="text-[10px] text-slate-400 mb-1">4.0 - 5.5 ×10⁶/µL</div>
            <input
              type="text"
              value={rbc}
              onChange={(e) => setRbc(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Hemoglobin</label>
            <div className="text-[10px] text-slate-400 mb-1">12.0 - 17.5 g/dL</div>
            <input
              type="text"
              value={hemoglobin}
              onChange={(e) => setHemoglobin(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Hematocrit</label>
            <div className="text-[10px] text-slate-400 mb-1">36 - 52 %</div>
            <input
              type="text"
              value={hematocrit}
              onChange={(e) => setHematocrit(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Platelets</label>
            <div className="text-[10px] text-slate-400 mb-1">150 - 450 ×10³/µL</div>
            <input
              type="text"
              value={platelets}
              onChange={(e) => setPlatelets(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Reticulocytes</label>
            <div className="text-[10px] text-slate-400 mb-1">0.5 - 2.5 %</div>
            <input
              type="text"
              value={reticulocytes}
              onChange={(e) => setReticulocytes(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. Differential Count */}
      <div>
        <h5 className="text-[11px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 mb-2">
          2. Differential White Cell Count (%)
        </h5>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Neutrophils</label>
            <div className="text-[9px] text-slate-400 mb-1">40 - 75%</div>
            <input
              type="text"
              value={neutrophils}
              onChange={(e) => setNeutrophils(e.target.value)}
              className="w-full px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-center focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Bands</label>
            <div className="text-[9px] text-slate-400 mb-1">0 - 5%</div>
            <input
              type="text"
              value={bands}
              onChange={(e) => setBands(e.target.value)}
              className="w-full px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-center focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Lymphocytes</label>
            <div className="text-[9px] text-slate-400 mb-1">20 - 45%</div>
            <input
              type="text"
              value={lymphocytes}
              onChange={(e) => setLymphocytes(e.target.value)}
              className="w-full px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-center focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Monocytes</label>
            <div className="text-[9px] text-slate-400 mb-1">2 - 10%</div>
            <input
              type="text"
              value={monocytes}
              onChange={(e) => setMonocytes(e.target.value)}
              className="w-full px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-center focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Eosinophils</label>
            <div className="text-[9px] text-slate-400 mb-1">1 - 6%</div>
            <input
              type="text"
              value={eosinophils}
              onChange={(e) => setEosinophils(e.target.value)}
              className="w-full px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-center focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Basophils</label>
            <div className="text-[9px] text-slate-400 mb-1">0 - 1%</div>
            <input
              type="text"
              value={basophils}
              onChange={(e) => setBasophils(e.target.value)}
              className="w-full px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-center focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Blast</label>
            <div className="text-[9px] text-slate-400 mb-1">0%</div>
            <input
              type="text"
              value={blast}
              onChange={(e) => setBlast(e.target.value)}
              className="w-full px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-center focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Myelocytes</label>
            <div className="text-[9px] text-slate-400 mb-1">0%</div>
            <input
              type="text"
              value={myelocytes}
              onChange={(e) => setMyelocytes(e.target.value)}
              className="w-full px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-center focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 3. Coagulation, ESR & RBC Indices */}
      <div>
        <h5 className="text-[11px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 mb-2">
          3. Coagulation, E.S.R. & RBC Indices
        </h5>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Bleeding Time</label>
            <div className="text-[9px] text-slate-400 mb-1">2 - 7 min</div>
            <input
              type="text"
              value={bleedingTime}
              onChange={(e) => setBleedingTime(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Coagulation Time</label>
            <div className="text-[9px] text-slate-400 mb-1">5 - 11 min</div>
            <input
              type="text"
              value={coagulationTime}
              onChange={(e) => setCoagulationTime(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Prothrombin Time</label>
            <div className="text-[9px] text-slate-400 mb-1">11 - 13.5 sec</div>
            <input
              type="text"
              value={prothrombinTime}
              onChange={(e) => setProthrombinTime(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">E.S.R.</label>
            <div className="text-[9px] text-slate-400 mb-1">0 - 20 mm/hr</div>
            <input
              type="text"
              value={esr}
              onChange={(e) => setEsr(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">MCV</label>
            <div className="text-[9px] text-slate-400 mb-1">80 - 100 fL</div>
            <input
              type="text"
              value={mcv}
              onChange={(e) => setMcv(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">MCH</label>
            <div className="text-[9px] text-slate-400 mb-1">27 - 33 pg</div>
            <input
              type="text"
              value={mch}
              onChange={(e) => setMch(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">MCHC</label>
            <div className="text-[9px] text-slate-400 mb-1">32 - 36 g/dL</div>
            <input
              type="text"
              value={mchc}
              onChange={(e) => setMchc(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
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
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Blood Morphology</label>
            <input
              type="text"
              value={bloodMorphology}
              onChange={(e) => setBloodMorphology(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              placeholder="e.g. Normocytic, normochromic RBCs. Adequate platelets."
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Remarks</label>
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
