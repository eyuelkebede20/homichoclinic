"use client";

import { useState } from "react";
import { submitLabResult } from "../actions";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getLabPanelType } from "../types/lab-panels";
import { StoolResultForm } from "./stool-result-form";
import { UrineResultForm } from "./urine-result-form";
import { HematologyResultForm } from "./hematology-result-form";

export function LabResultForm({ requestId, testName = "" }: { requestId: string; testName?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [findings, setFindings] = useState("");

  const panelType = getLabPanelType(testName);

  async function handleStructuredSubmit(findingsJson: string) {
    setLoading(true);
    const result = await submitLabResult({
      requestId,
      findings: findingsJson,
    });
    setLoading(false);
    if (result.success) {
      setIsOpen(false);
      toast.success("Lab results submitted successfully.");
    } else {
      toast.error(result.error || "Failed to save results.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await handleStructuredSubmit(findings);
  }

  if (!isOpen) {
    const btnColor =
      panelType === "STOOL"
        ? "text-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
        : panelType === "URINE"
        ? "text-amber-700 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300"
        : panelType === "HEMATOLOGY"
        ? "text-rose-700 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950 dark:text-rose-300"
        : "text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300";

    return (
      <button 
        onClick={() => setIsOpen(true)}
        className={`${btnColor} px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm`}
      >
        {panelType ? `Enter ${testName} Report` : "Enter Results"}
      </button>
    );
  }

  if (panelType === "STOOL") {
    return (
      <div className="w-full">
        <StoolResultForm
          onSubmit={handleStructuredSubmit}
          onCancel={() => setIsOpen(false)}
          loading={loading}
        />
      </div>
    );
  }

  if (panelType === "URINE") {
    return (
      <div className="w-full">
        <UrineResultForm
          onSubmit={handleStructuredSubmit}
          onCancel={() => setIsOpen(false)}
          loading={loading}
        />
      </div>
    );
  }

  if (panelType === "HEMATOLOGY") {
    return (
      <div className="w-full">
        <HematologyResultForm
          onSubmit={handleStructuredSubmit}
          onCancel={() => setIsOpen(false)}
          loading={loading}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-end gap-2 text-left bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl shadow-inner border border-slate-200 dark:border-slate-700 min-w-[250px] w-full">
      <textarea
        required
        placeholder="Enter lab findings..."
        className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        rows={2}
        value={findings}
        onChange={e => setFindings(e.target.value)}
      />
      <div className="flex flex-wrap gap-1 w-full mt-1">
        {["Positive (+)", "Negative", "Normal", "Reactive", "Non-Reactive", "Clear"].map(chip => (
          <button
            key={chip}
            type="button"
            onClick={() => setFindings(findings ? `${findings} ${chip}` : chip)}
            className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <button 
          type="button" 
          onClick={() => setIsOpen(false)}
          className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-2 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="text-xs bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 flex items-center font-bold"
        >
          {loading && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
          Submit Findings
        </button>
      </div>
    </form>
  );
}
