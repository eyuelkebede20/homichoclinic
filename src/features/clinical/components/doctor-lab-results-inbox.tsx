"use client";

import { useState } from "react";
import { CheckCircle2, ChevronRight, ChevronDown, FlaskConical, Droplet, Activity, TestTube } from "lucide-react";
import { dismissLabResult } from "../actions";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { parseLabFindings, getLabPanelType } from "../types/lab-panels";
import { StructuredLabResultView } from "./structured-lab-result-view";

export function DoctorLabResultsInbox({
  results
}: {
  results: { id: string; findings: string | null; request: { id: string; test: { name: string }, patient: { id?: string; firstName: string; lastName: string } } }[]
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const router = useRouter();

  if (results.length === 0) return null;

  async function handleDismiss(id: string) {
    setLoading(id);
    const res = await dismissLabResult({ resultId: id });
    setLoading(null);
    if (!res.error) {
      router.refresh();
    }
  }

  function toggleExpand(id: string) {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  }

  return (
    <div className="bg-white dark:bg-slate-900/80 rounded-2xl shadow-sm border border-indigo-200/80 dark:border-indigo-900/60 overflow-hidden mb-8 transition-all">
      <div className="px-6 py-4 border-b border-indigo-100 dark:border-indigo-950 flex justify-between items-center bg-indigo-50/70 dark:bg-indigo-950/40">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-indigo-950 dark:text-indigo-100 flex items-center gap-2">
              Incoming Laboratory Reports
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-200/80 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                {results.length} New
              </span>
            </h2>
          </div>
        </div>
      </div>

      <ul className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[500px] overflow-y-auto">
        {results.map(res => {
          const isExpanded = expandedIds.has(res.id);
          const panelType = getLabPanelType(res.request.test.name);

          const getIcon = () => {
            if (panelType === "STOOL") return <FlaskConical className="w-4 h-4 text-emerald-600" />;
            if (panelType === "URINE") return <Droplet className="w-4 h-4 text-amber-600" />;
            if (panelType === "HEMATOLOGY") return <Activity className="w-4 h-4 text-rose-600" />;
            return <TestTube className="w-4 h-4 text-indigo-600" />;
          };

          return (
            <li key={res.id} className="p-4 sm:p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-slate-100 dark:bg-slate-800">
                      {getIcon()}
                    </div>
                    <Link
                      href={`/patients/${(res.request as any).patientId || (res.request.patient as any).id}`}
                      className="font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm flex items-center gap-1"
                    >
                      {res.request.patient.firstName} {res.request.patient.lastName}
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {res.request.test.name}
                    </span>
                  </div>

                  {!isExpanded && (
                    <div className="text-xs text-slate-600 dark:text-slate-400 pl-7">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Summary: </span>
                      {(() => {
                        const p = parseLabFindings(res.findings);
                        if (p.isStructured && p.data) {
                          if (p.type === "STOOL") {
                            const d = p.data as any;
                            return `${d.consistence || "Formed"} • ${d.ovaAndParasite || "No parasites"}${d.remarks ? ` (${d.remarks})` : ""}`;
                          }
                          if (p.type === "URINE") {
                            const d = p.data as any;
                            return `${d.reaction || "Acidic"} • Microscopic: ${d.microscopic || "Normal"}${d.remarks ? ` (${d.remarks})` : ""}`;
                          }
                          if (p.type === "HEMATOLOGY") {
                            const d = p.data as any;
                            return `WBC: ${d.wbc || "N/A"}, Hgb: ${d.hemoglobin || "N/A"}, Plt: ${d.platelets || "N/A"}${d.remarks ? ` (${d.remarks})` : ""}`;
                          }
                        }
                        return res.findings || "No findings recorded.";
                      })()}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => toggleExpand(res.id)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline px-2.5 py-1.5 flex items-center gap-1"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" /> Hide Full Report
                      </>
                    ) : (
                      <>
                        <ChevronRight className="w-3.5 h-3.5" /> View Full Report
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDismiss(res.id)}
                    disabled={loading === res.id}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mark Reviewed
                  </button>
                </div>
              </div>

              {/* Full Expanded Result Slip */}
              {isExpanded && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <StructuredLabResultView findings={res.findings} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
