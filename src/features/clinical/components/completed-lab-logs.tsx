"use client";

import { useState } from "react";
import { Search, ChevronDown, ChevronUp, CheckCircle2, FlaskConical, Printer } from "lucide-react";
import { formatToEthiopianDate } from "@/lib/date-utils";
import { StructuredLabResultView } from "./structured-lab-result-view";
import { formatLabSummary } from "../types/lab-panels";
import { openPrintLabResultWindow } from "../utils/print-lab-result";

interface CompletedLabRequestItem {
  id: string;
  updatedAt: Date | string;
  createdAt: Date | string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    militaryId?: string | null;
    employeeId?: string | null;
  };
  test: {
    id: string;
    name: string;
  };
  result?: {
    id: string;
    findings: string | null;
    isReadByDoctor?: boolean;
    createdAt?: Date | string;
  } | null;
}

export function CompletedLabLogs({
  requests,
}: {
  requests: CompletedLabRequestItem[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const queryLower = searchQuery.toLowerCase().trim();

  const filteredRequests = requests.filter((req) => {
    if (!queryLower) return true;
    const patientName = `${req.patient.firstName} ${req.patient.lastName}`.toLowerCase();
    const idStr = `${req.patient.militaryId || ""} ${req.patient.employeeId || ""}`.toLowerCase();
    const testName = (req.test.name || "").toLowerCase();
    const findingsStr = (req.result?.findings || "").toLowerCase();
    return (
      patientName.includes(queryLower) ||
      idStr.includes(queryLower) ||
      testName.includes(queryLower) ||
      findingsStr.includes(queryLower)
    );
  });

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <span>Recent Completed Logs</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {filteredRequests.length}
          </span>
        </h2>
      </div>

      <div className="bg-white dark:bg-slate-900/50 shadow-sm rounded-xl border border-slate-200 dark:border-slate-800/60 overflow-hidden min-h-[300px]">
        {/* Card Header with Search Key */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search completed logs by patient, MRN, test, findings..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 text-xs font-bold w-4 h-4 flex items-center justify-center rounded"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Content list */}
        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
            {searchQuery ? (
              <div className="space-y-1">
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  No completed logs match &ldquo;{searchQuery}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-blue-600 dark:text-blue-400 underline font-medium hover:text-blue-700"
                >
                  Clear search
                </button>
              </div>
            ) : (
              "No completed logs found."
            )}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[600px] overflow-y-auto">
            {filteredRequests.map((req) => {
              const isExpanded = expandedIds.has(req.id);
              return (
                <li key={req.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  <div className="flex justify-between items-start mb-1.5">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm block">
                        {req.patient.firstName} {req.patient.lastName}
                      </span>
                      {(req.patient.militaryId || req.patient.employeeId) && (
                        <span className="text-[11px] text-slate-400">
                          ID: {req.patient.militaryId || req.patient.employeeId}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      {formatToEthiopianDate(req.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Test: {req.test.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          openPrintLabResultWindow({
                            patient: req.patient,
                            testName: req.test.name,
                            findings: req.result?.findings,
                            date: req.updatedAt,
                            isReadByDoctor: req.result?.isReadByDoctor,
                          });
                        }}
                        className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 transition-colors"
                        title="Print official single-page A4 laboratory test slip"
                      >
                        <Printer className="w-3 h-3" /> Print Slip
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleExpand(req.id)}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <>
                            Hide Details <ChevronUp className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            View Full Details <ChevronDown className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Summary row when collapsed */}
                  {!isExpanded ? (
                    <div className="bg-slate-50/80 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-slate-500 dark:text-slate-400 mr-1">Findings:</span>
                      <span>{formatLabSummary(req.result?.findings)}</span>
                    </div>
                  ) : (
                    /* Full structured panel view when expanded */
                    <div className="pt-2">
                      <StructuredLabResultView
                        findings={req.result?.findings}
                        testName={req.test.name}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
