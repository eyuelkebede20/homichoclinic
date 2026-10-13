"use client";

import { useState } from "react";
import { Loader2, Sparkles, CheckCircle2, ShieldAlert } from "lucide-react";
import { StoolPanelData, parseStoolSelectedSubTests } from "../types/lab-panels";

interface StoolResultFormProps {
  testName?: string;
  initialData?: Partial<StoolPanelData>;
  onSubmit: (findingsJson: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function StoolResultForm({ testName, initialData, onSubmit, onCancel, loading = false }: StoolResultFormProps) {
  const selected = parseStoolSelectedSubTests(testName);

  const [appearance, setAppearance] = useState(initialData?.appearance || "Brownish");
  const [consistence, setConsistence] = useState(initialData?.consistence || "Formed");
  const [bloodGross, setBloodGross] = useState(initialData?.bloodGross || "Negative");
  const [occult, setOccult] = useState(initialData?.occult || "Negative");
  const [pus, setPus] = useState(initialData?.pus || "Nil");
  const [mucus, setMucus] = useState(initialData?.mucus || "Negative");
  const [bile, setBile] = useState(initialData?.bile || "Present");
  const [ovaAndParasite, setOvaAndParasite] = useState(initialData?.ovaAndParasite || "No ova or parasite seen");
  const [remarks, setRemarks] = useState(initialData?.remarks || "");

  function handleSetRequestedNormal() {
    if (selected.reqMacroscopic) {
      setAppearance("Brownish");
      setConsistence("Formed");
      setBloodGross("Negative");
      setPus("Nil");
      setMucus("Negative");
      setBile("Present");
    }
    if (selected.reqOccultBlood) {
      setOccult("Negative");
    }
    if (selected.reqOvaParasite) {
      setOvaAndParasite("No ova or parasite seen");
    }
    setRemarks("Requested stool parameters evaluated and normal.");
  }

  function handleSetNormal() {
    setAppearance("Brownish");
    setConsistence("Formed");
    setBloodGross("Negative");
    setOccult("Negative");
    setPus("Nil");
    setMucus("Negative");
    setBile("Present");
    setOvaAndParasite("No ova or parasite seen");
    setRemarks("Normal examination.");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: StoolPanelData = {
      type: "STOOL",
      appearance,
      consistence,
      bloodGross,
      occult,
      pus,
      mucus,
      bile,
      ovaAndParasite,
      remarks,
    };
    await onSubmit(JSON.stringify(payload));
  }

  return (
    <form onSubmit={handleSubmit} className="bg-emerald-50/40 dark:bg-emerald-950/20 border-2 border-emerald-500/40 dark:border-emerald-700/60 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-emerald-200 dark:border-emerald-800/80 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-base">
              {testName ? testName : "Stool Examination (Standard Panel)"}
            </h4>
            {testName && (testName.includes("-") || testName.includes("(")) && (
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                Specifically requested: {testName.replace(/^Stool\s*(\(|\-)\s*/i, "").replace(/\)$/, "")}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {!selected.isFull && (
            <button
              type="button"
              onClick={handleSetRequestedNormal}
              className="text-xs font-semibold px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Fill Requested Normal
            </button>
          )}
          <button
            type="button"
            onClick={handleSetNormal}
            className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Fill All Normal
          </button>
        </div>
      </div>

      {!selected.isFull && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2.5 shadow-2xs">
          <span className="font-extrabold text-[10px] uppercase bg-amber-500 text-white px-2 py-0.5 rounded-full">
            Selective Order
          </span>
          <span>Only the parameters marked <strong className="text-emerald-700 dark:text-emerald-300">★ REQUIRED</strong> below were requested by the doctor. Other sections are optional.</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
        {/* Appearance */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Appearance {selected.reqMacroscopic ? <span className="text-[10px] text-emerald-600 font-bold ml-1">★ REQUIRED</span> : <span className="text-[10px] text-slate-400 font-normal ml-1">(Optional)</span>}
          </label>
          <input
            type="text"
            value={appearance}
            onChange={(e) => setAppearance(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            placeholder="e.g. Brownish, Yellowish"
          />
          <div className="flex flex-wrap gap-1 mt-1">
            {["Brownish", "Yellowish", "Dark Brown", "Bloody"].map((val) => (
              <button
                type="button"
                key={val}
                onClick={() => setAppearance(val)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-100"
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Consistence */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Consistence {selected.reqMacroscopic ? <span className="text-[10px] text-emerald-600 font-bold ml-1">★ REQUIRED</span> : <span className="text-[10px] text-slate-400 font-normal ml-1">(Optional)</span>}
          </label>
          <input
            type="text"
            value={consistence}
            onChange={(e) => setConsistence(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            placeholder="e.g. Formed, Loose"
          />
          <div className="flex flex-wrap gap-1 mt-1">
            {["Formed", "Semi-formed", "Loose", "Watery"].map((val) => (
              <button
                type="button"
                key={val}
                onClick={() => setConsistence(val)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-100"
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Blood-Gross */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Blood-Gross {selected.reqMacroscopic ? <span className="text-[10px] text-emerald-600 font-bold ml-1">★ REQUIRED</span> : <span className="text-[10px] text-slate-400 font-normal ml-1">(Optional)</span>}
          </label>
          <input
            type="text"
            value={bloodGross}
            onChange={(e) => setBloodGross(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <div className="flex flex-wrap gap-1 mt-1">
            {["Negative", "Present (+)", "Trace"].map((val) => (
              <button
                type="button"
                key={val}
                onClick={() => setBloodGross(val)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-100"
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Occult Blood (FOBT) */}
        <div className={selected.reqOccultBlood ? "p-2 rounded-xl bg-white dark:bg-slate-900 border-2 border-emerald-500 shadow-xs" : ""}>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Occult Blood (FOBT) {selected.reqOccultBlood ? <span className="text-[10px] text-emerald-600 font-bold ml-1">★ REQUIRED</span> : <span className="text-[10px] text-slate-400 font-normal ml-1">(Optional)</span>}
          </label>
          <input
            type="text"
            value={occult}
            onChange={(e) => setOccult(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <div className="flex flex-wrap gap-1 mt-1">
            {["Negative", "Positive (+)", "Positive (++)"].map((val) => (
              <button
                type="button"
                key={val}
                onClick={() => setOccult(val)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-100"
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Pus */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Pus Cells {selected.reqMacroscopic ? <span className="text-[10px] text-emerald-600 font-bold ml-1">★ REQUIRED</span> : <span className="text-[10px] text-slate-400 font-normal ml-1">(Optional)</span>}
          </label>
          <input
            type="text"
            value={pus}
            onChange={(e) => setPus(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            placeholder="e.g. Nil, 0-2 /HPF"
          />
          <div className="flex flex-wrap gap-1 mt-1">
            {["Nil", "0-2 /HPF", "2-5 /HPF", "Many"].map((val) => (
              <button
                type="button"
                key={val}
                onClick={() => setPus(val)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-100"
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Mucus */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Mucus {selected.reqMacroscopic ? <span className="text-[10px] text-emerald-600 font-bold ml-1">★ REQUIRED</span> : <span className="text-[10px] text-slate-400 font-normal ml-1">(Optional)</span>}
          </label>
          <input
            type="text"
            value={mucus}
            onChange={(e) => setMucus(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <div className="flex flex-wrap gap-1 mt-1">
            {["Negative", "Present (+)", "Moderate"].map((val) => (
              <button
                type="button"
                key={val}
                onClick={() => setMucus(val)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-100"
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Bile */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Bile {selected.reqMacroscopic ? <span className="text-[10px] text-emerald-600 font-bold ml-1">★ REQUIRED</span> : <span className="text-[10px] text-slate-400 font-normal ml-1">(Optional)</span>}
          </label>
          <input
            type="text"
            value={bile}
            onChange={(e) => setBile(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <div className="flex flex-wrap gap-1 mt-1">
            {["Present", "Absent", "Normal"].map((val) => (
              <button
                type="button"
                key={val}
                onClick={() => setBile(val)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-100"
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Ova and Parasite */}
        <div className={`col-span-1 sm:col-span-2 lg:col-span-3 ${selected.reqOvaParasite ? "p-2.5 rounded-xl bg-white dark:bg-slate-900 border-2 border-emerald-500 shadow-xs" : ""}`}>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
            <span>Ova and Parasite (Microscopic) {selected.reqOvaParasite ? <span className="text-[10px] text-emerald-600 font-bold ml-1">★ REQUIRED</span> : <span className="text-[10px] text-slate-400 font-normal ml-1">(Optional)</span>}</span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-normal">Click chips to quickly insert parasites</span>
          </label>
          <input
            type="text"
            required={selected.reqOvaParasite}
            value={ovaAndParasite}
            onChange={(e) => setOvaAndParasite(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            placeholder="e.g. No ova or parasite seen, E. histolytica cysts, Giardia lamblia"
          />
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {[
              "No ova or parasite seen",
              "E. histolytica trophozoite",
              "E. histolytica cyst",
              "Giardia lamblia trophozoite",
              "Giardia lamblia cyst",
              "Ascaris lumbricoides ova",
              "Hookworm ova",
              "H. nana ova",
              "T. trichiura ova",
              "Strongyloides larvae"
            ].map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => {
                  if (p === "No ova or parasite seen") setOvaAndParasite(p);
                  else if (ovaAndParasite === "No ova or parasite seen" || !ovaAndParasite) setOvaAndParasite(p);
                  else setOvaAndParasite(`${ovaAndParasite}, ${p}`);
                }}
                className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100/70 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 transition-colors"
              >
                + {p}
              </button>
            ))}
          </div>
        </div>

        {/* Remarks */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-3">
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Remarks</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            placeholder="Enter any additional diagnostic notes or remarks..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-2.5 pt-2 border-t border-emerald-200 dark:border-emerald-800/80">
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
          className="text-xs font-bold px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          Save Stool Examination
        </button>
      </div>
    </form>
  );
}
