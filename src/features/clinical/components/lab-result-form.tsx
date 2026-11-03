"use client";

import { useState, useEffect } from "react";
import { submitLabResult } from "../actions";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { getLabPanelType } from "../types/lab-panels";
import { StoolResultForm } from "./stool-result-form";
import { UrineResultForm } from "./urine-result-form";
import { HematologyResultForm } from "./hematology-result-form";

export function LabResultForm({ 
  requestId, 
  testName = "",
  linkedRequestIds
}: { 
  requestId: string; 
  testName?: string;
  linkedRequestIds?: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [findings, setFindings] = useState("");

  const panelType = getLabPanelType(testName);

  // Close modal on Escape key and prevent background scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  async function handleStructuredSubmit(findingsJson: string) {
    setLoading(true);
    const result = await submitLabResult({
      requestId,
      linkedRequestIds,
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

  const btnColor =
    panelType === "STOOL"
      ? "text-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
      : panelType === "URINE"
      ? "text-amber-700 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300"
      : panelType === "HEMATOLOGY"
      ? "text-rose-700 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950 dark:text-rose-300"
      : "text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300";

  return (
    <>
      <button 
        type="button"
        onClick={() => setIsOpen(true)}
        className={`${btnColor} px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500`}
      >
        {panelType ? `Enter ${testName} Report` : "Enter Results"}
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label={`Enter lab findings for ${testName}`}
        >
          <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 my-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Laboratory Diagnostic Input: {testName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Record official clinical findings and reference metrics
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {panelType === "STOOL" ? (
              <StoolResultForm
                testName={testName}
                onSubmit={handleStructuredSubmit}
                onCancel={() => setIsOpen(false)}
                loading={loading}
              />
            ) : panelType === "URINE" ? (
              <UrineResultForm
                testName={testName}
                onSubmit={handleStructuredSubmit}
                onCancel={() => setIsOpen(false)}
                loading={loading}
              />
            ) : panelType === "HEMATOLOGY" ? (
              <HematologyResultForm
                testName={testName}
                onSubmit={handleStructuredSubmit}
                onCancel={() => setIsOpen(false)}
                loading={loading}
              />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Diagnostic Findings & Clinical Interpretation *
                  </label>
                  <textarea
                    required
                    placeholder="Enter lab findings and comments..."
                    className="w-full text-sm rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[120px]"
                    rows={4}
                    value={findings}
                    onChange={e => setFindings(e.target.value)}
                  />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-400 block mb-1.5">Quick Result Chips:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {["Positive (+)", "Negative (-)", "Normal", "Reactive", "Non-Reactive", "Clear", "Turbid", "Inconclusive"].map(chip => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setFindings(findings ? `${findings} ${chip}` : chip)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800/80 bg-blue-50/70 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    type="button" 
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center shadow-sm disabled:opacity-50 transition-colors"
                  >
                    {loading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                    Submit Findings
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
