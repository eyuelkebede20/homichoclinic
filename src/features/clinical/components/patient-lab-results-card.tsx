"use client";

import { useState } from "react";
import { Search, FlaskConical, CheckCircle2, Clock, AlertTriangle, Printer } from "lucide-react";
import { formatToEthiopianDate } from "@/lib/date-utils";
import { StructuredLabResultView } from "./structured-lab-result-view";
import { openPrintLabResultWindow } from "../utils/print-lab-result";

interface PatientLabRequest {
  id: string;
  status: string;
  createdAt: Date | string;
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

export function PatientLabResultsCard({
  labRequests,
  patientInfo,
}: {
  labRequests: PatientLabRequest[];
  patientInfo?: {
    firstName: string;
    lastName: string;
    gender?: string | null;
    yob?: string | number | null;
    militaryId?: string | null;
    employeeId?: string | null;
    department?: string | null;
    rank?: string | null;
  };
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending">("all");

  const queryLower = searchQuery.toLowerCase().trim();

  const filteredRequests = labRequests.filter((req) => {
    // Status filter
    if (statusFilter === "completed" && req.status !== "completed") return false;
    if (statusFilter === "pending" && req.status === "completed") return false;

    // Search query filter
    if (!queryLower) return true;
    const testName = (req.test.name || "").toLowerCase();
    const findingsStr = (req.result?.findings || "").toLowerCase();
    const statusStr = (req.status || "").toLowerCase();

    return testName.includes(queryLower) || findingsStr.includes(queryLower) || statusStr.includes(queryLower);
  });

  return (
    <div className="bg-white dark:bg-slate-900/50 shadow-sm rounded-xl border border-slate-200 dark:border-slate-800/60 p-6 space-y-4">
      {/* Header with Title and Search Input */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Laboratory Results</h2>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {labRequests.length} Test{labRequests.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto print:hidden">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tests or findings..."
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

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                statusFilter === "all"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("completed")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                statusFilter === "completed"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Completed
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("pending")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                statusFilter === "pending"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Pending
            </button>
          </div>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
          {searchQuery || statusFilter !== "all" ? (
            <div className="space-y-1">
              <p className="font-medium">No lab results match the current filters.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="text-xs text-blue-600 dark:text-blue-400 underline font-medium hover:text-blue-700"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <p>No lab requests found for this patient.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60 p-4 space-y-3 print:bg-white print:border-slate-400 print:p-2.5 print-avoid-break"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2.5 print:pb-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm print:text-black">
                    {req.test.name}
                  </span>
                  <span className="text-xs text-slate-400 print:text-slate-600">
                    • {formatToEthiopianDate(req.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {req.result && (
                    <button
                      type="button"
                      onClick={() => {
                        openPrintLabResultWindow({
                          patient: patientInfo || { firstName: "Patient", lastName: "" },
                          testName: req.test.name,
                          findings: req.result?.findings,
                          date: req.createdAt,
                          isReadByDoctor: req.result?.isReadByDoctor,
                        });
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors shadow-2xs print:hidden"
                      title="Print official single-page A4 laboratory test slip"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print Slip
                    </button>
                  )}
                  {req.result && (
                    req.result.isReadByDoctor ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 print:border-black print:text-black print:bg-white">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 print:hidden" /> Reviewed by Doctor
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-950/60 px-2.5 py-0.5 text-xs font-bold text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800 print:border-black print:text-black print:bg-white">
                        <Clock className="w-3 h-3 text-blue-600 print:hidden" /> Pending Doctor Review
                      </span>
                    )
                  )}
                  {req.status === "completed" ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-bold text-green-800 dark:text-green-400">
                      Completed
                    </span>
                  ) : req.status === "cancelled" ? (
                    <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:text-red-400">
                      Cancelled
                    </span>
                  ) : req.status === "urgent" ? (
                    <span className="inline-flex items-center rounded-full bg-red-600 text-white px-2.5 py-0.5 text-xs font-extrabold shadow-sm animate-pulse">
                      ⚡ URGENT
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:text-yellow-400">
                      Pending
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-1">
                {req.result ? (
                  <StructuredLabResultView findings={req.result.findings} testName={req.test.name} />
                ) : (
                  <div className="p-4 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 italic">
                    Awaiting laboratory analysis and technician input...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
