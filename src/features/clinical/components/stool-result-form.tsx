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
  const isReqAppCons = selected.isFull || !!selected.reqAppearance || !!selected.reqMacroscopic;
  const isReqBloodGross = selected.isFull || !!selected.reqGrossBlood || !!selected.reqMacroscopic;
  const isReqPus = selected.isFull || !!selected.reqPusMucus || !!selected.reqMacroscopic;
  const isReqMucus = selected.isFull || !!selected.reqPusMucus || !!selected.reqMacroscopic;
  const isReqBile = selected.isFull || !!selected.reqBile || !!selected.reqMacroscopic;
  const isReqOccult = selected.isFull || !!selected.reqOccultBlood;
  const isReqOva = selected.isFull || !!selected.reqOvaParasite;

  const getInputClass = (isFieldOrdered: boolean) => {
    if (selected.isFull) {
      return "w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all";
    }
    if (isFieldOrdered) {
      return "w-full px-2.5 py-1.5 rounded-lg border-2 border-emerald-400 dark:border-emerald-400 ring-2 ring-emerald-400/35 dark:ring-emerald-500/40 bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100 font-semibold placeholder:text-emerald-600/50 shadow-sm focus:ring-4 focus:ring-emerald-400/50 focus:border-emerald-500 focus:outline-none transition-all";
    }
    return "w-full px-2.5 py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 dark:text-slate-500 opacity-60 hover:opacity-90 focus:opacity-100 focus:border-slate-400 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700 focus:outline-none transition-all";
  };

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

      {/* Doctor's Selected Test Banner */}
      <div className={`p-3.5 rounded-xl border-2 transition-all ${
        !selected.isFull
          ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
          : "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
              !selected.isFull ? "bg-emerald-600 text-white shadow-xs" : "bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200"
            }`}>
              {!selected.isFull ? "Doctor's Selective Order" : "Standard Full Panel"}
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
              {!selected.isFull
                ? `Doctor requested ${selected.selectedList.length} specific test(s). Highlighted in special green border below:`
                : "All stool parameters requested for complete routine examination."}
            </span>
          </div>
          {!selected.isFull && (
            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-700 shadow-2xs">
              ★ Look for green highlighted boxes
            </span>
          )}
        </div>

        {!selected.isFull && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2.5 border-t border-emerald-200/70 dark:border-emerald-800/70">
            <span className="text-[11px] font-bold text-emerald-950 dark:text-emerald-100 flex items-center gap-1">
              Jump directly to ordered input box:
            </span>
            {isReqOccult && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("stool-input-occult");
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  el?.focus();
                }}
                className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-300 dark:ring-emerald-500 transition-all cursor-pointer hover:scale-105"
              >
                ★ Occult Blood (FOBT) ↓
              </button>
            )}
            {isReqOva && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("stool-input-ova");
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  el?.focus();
                }}
                className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-300 dark:ring-emerald-500 transition-all cursor-pointer hover:scale-105"
              >
                ★ Ova & Parasite ↓
              </button>
            )}
            {isReqAppCons && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("stool-input-appearance");
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  el?.focus();
                }}
                className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-300 dark:ring-emerald-500 transition-all cursor-pointer hover:scale-105"
              >
                ★ Macroscopic Examination ↓
              </button>
            )}
            {selected.selectedList.map((testItem, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700"
              >
                ✓ {testItem}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 1. Macroscopic Examination */}
      <div className={`p-3.5 rounded-xl transition-all ${
        selected.reqMacroscopic
          ? "border-2 border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm"
          : !selected.isFull
          ? "border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75"
          : "border border-emerald-200 dark:border-emerald-800 bg-white/70 dark:bg-slate-900/50"
      }`}>
        <div className="flex items-center justify-between mb-2.5">
          <h5 className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
            <span>1. Macroscopic & Physical Examination</span>
            {selected.reqMacroscopic ? (
              <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
                ★ ORDERED
              </span>
            ) : !selected.isFull ? (
              <span className="text-[10px] text-slate-400 font-normal italic">
                (Optional / Not requested)
              </span>
            ) : null}
          </h5>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {/* Appearance */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Appearance</span>
              {isReqAppCons ? (
                <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs border border-emerald-300 animate-pulse">
                  ★ ORDERED
                </span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">Optional</span>
              ) : null}
            </label>
            <input
              id="stool-input-appearance"
              type="text"
              value={appearance}
              onChange={(e) => setAppearance(e.target.value)}
              className={getInputClass(isReqAppCons)}
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
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Consistence</span>
              {isReqAppCons ? (
                <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs border border-emerald-300 animate-pulse">
                  ★ ORDERED
                </span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">Optional</span>
              ) : null}
            </label>
            <input
              id="stool-input-consistence"
              type="text"
              value={consistence}
              onChange={(e) => setConsistence(e.target.value)}
              className={getInputClass(isReqAppCons)}
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
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Blood-Gross</span>
              {isReqBloodGross ? (
                <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs border border-emerald-300 animate-pulse">
                  ★ ORDERED
                </span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">Optional</span>
              ) : null}
            </label>
            <input
              id="stool-input-bloodGross"
              type="text"
              value={bloodGross}
              onChange={(e) => setBloodGross(e.target.value)}
              className={getInputClass(isReqBloodGross)}
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

          {/* Pus */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Pus Cells</span>
              {isReqPus ? (
                <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs border border-emerald-300 animate-pulse">
                  ★ ORDERED
                </span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">Optional</span>
              ) : null}
            </label>
            <input
              id="stool-input-pus"
              type="text"
              value={pus}
              onChange={(e) => setPus(e.target.value)}
              className={getInputClass(isReqPus)}
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
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Mucus</span>
              {isReqMucus ? (
                <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs border border-emerald-300 animate-pulse">
                  ★ ORDERED
                </span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">Optional</span>
              ) : null}
            </label>
            <input
              id="stool-input-mucus"
              type="text"
              value={mucus}
              onChange={(e) => setMucus(e.target.value)}
              className={getInputClass(isReqMucus)}
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
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Bile</span>
              {isReqBile ? (
                <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs border border-emerald-300 animate-pulse">
                  ★ ORDERED
                </span>
              ) : !selected.isFull ? (
                <span className="text-[10px] text-slate-400 font-normal italic">Optional</span>
              ) : null}
            </label>
            <input
              id="stool-input-bile"
              type="text"
              value={bile}
              onChange={(e) => setBile(e.target.value)}
              className={getInputClass(isReqBile)}
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
        </div>
      </div>

      {/* 2. Occult Blood (FOBT) */}
      <div className={`p-3.5 rounded-xl transition-all ${
        selected.reqOccultBlood
          ? "border-2 border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm"
          : !selected.isFull
          ? "border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75"
          : "border border-emerald-200 dark:border-emerald-800 bg-white/70 dark:bg-slate-900/50"
      }`}>
        <div className="flex items-center justify-between mb-2">
          <label className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <span>2. Occult Blood (FOBT)</span>
            {selected.reqOccultBlood ? (
              <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
                ★ ORDERED
              </span>
            ) : !selected.isFull ? (
              <span className="text-[10px] text-slate-400 font-normal italic">
                (Optional / Not requested)
              </span>
            ) : null}
          </label>
        </div>
        <div className="max-w-md">
          <input
            id="stool-input-occult"
            type="text"
            value={occult}
            onChange={(e) => setOccult(e.target.value)}
            className={getInputClass(isReqOccult)}
          />
          <div className="flex flex-wrap gap-1 mt-1.5">
            {["Negative", "Positive (+)", "Positive (++)"].map((val) => (
              <button
                type="button"
                key={val}
                onClick={() => setOccult(val)}
                className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-100"
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Ova and Parasite */}
      <div className={`p-3.5 rounded-xl transition-all ${
        selected.reqOvaParasite
          ? "border-2 border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm"
          : !selected.isFull
          ? "border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 opacity-75"
          : "border border-emerald-200 dark:border-emerald-800 bg-white/70 dark:bg-slate-900/50"
      }`}>
        <div className="flex items-center justify-between mb-1.5">
          <label className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <span>3. Ova & Parasite (Microscopic Examination)</span>
            {selected.reqOvaParasite ? (
              <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
                ★ ORDERED
              </span>
            ) : !selected.isFull ? (
              <span className="text-[10px] text-slate-400 font-normal italic">
                (Optional / Not requested)
              </span>
            ) : null}
          </label>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-normal hidden sm:inline">Click chips to quickly insert parasites</span>
        </div>
        <input
          id="stool-input-ova"
          type="text"
          required={selected.reqOvaParasite}
          value={ovaAndParasite}
          onChange={(e) => setOvaAndParasite(e.target.value)}
          className={getInputClass(isReqOva)}
          placeholder="e.g. No ova or parasite seen, E. histolytica cysts, Giardia lamblia"
        />
        <div className="flex flex-wrap gap-1.5 mt-2">
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

      {/* 4. Remarks */}
      <div className="p-3.5 rounded-xl border border-emerald-200/80 dark:border-emerald-800/80 bg-white/70 dark:bg-slate-900/50">
        <label className="block font-bold text-xs text-slate-700 dark:text-slate-300 mb-1">
          Remarks & Additional Diagnostic Notes
        </label>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
          placeholder="Enter any additional diagnostic notes or remarks..."
        />
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
