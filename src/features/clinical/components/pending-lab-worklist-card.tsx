"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { LabResultForm } from "./lab-result-form";
import { GroupedLabRequest } from "../types/lab-panels";

export function PendingLabWorklistCard({
  groupedRequests,
  canResult,
}: {
  groupedRequests: GroupedLabRequest<any>[];
  canResult: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const queryLower = searchQuery.toLowerCase().trim();

  const filtered = groupedRequests.filter((req) => {
    if (!queryLower) return true;
    const patientName = `${req.patient.firstName} ${req.patient.lastName}`.toLowerCase();
    const idStr = `${req.patient.militaryId || ""} ${req.patient.employeeId || ""}`.toLowerCase();
    const testName = (req.testName || "").toLowerCase();
    return patientName.includes(queryLower) || idStr.includes(queryLower) || testName.includes(queryLower);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <span>Pending Tests</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
            {filtered.length}
          </span>
        </h2>
      </div>

      <div className="bg-white dark:bg-slate-900/50 shadow-sm rounded-xl border border-slate-200 dark:border-slate-800/60 overflow-hidden min-h-[300px]">
        {/* Card Header with Search Input */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pending tests by patient, MRN, or test..."
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

        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
            {searchQuery ? (
              <div className="space-y-1">
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  No pending tests match &ldquo;{searchQuery}&rdquo;
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
              "No active lab requests."
            )}
          </div>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {filtered.map((req) => (
              <li key={req.id} className="p-4 bg-blue-50/30 dark:bg-blue-900/10 hover:bg-blue-50/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">
                      {req.patient.firstName} {req.patient.lastName}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(req.createdAt).toLocaleString()}
                      {(req.patient.militaryId || req.patient.employeeId) && (
                        <span className="ml-1 text-slate-400">
                          • ID: {req.patient.militaryId || req.patient.employeeId}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {req.linkedRequestIds.length > 1 && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 text-[10px] font-bold text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {req.linkedRequestIds.length} combined
                      </span>
                    )}
                    {req.isUrgent ? (
                      <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/50 px-2.5 py-0.5 text-xs font-bold text-red-800 dark:text-red-300 animate-pulse border border-red-200 dark:border-red-800">
                        URGENT
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:text-yellow-400">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-sm text-slate-700 dark:text-slate-300 mb-4 font-medium">
                  Test: {req.testName}
                </div>
                <div className="flex justify-end gap-2">
                  {canResult ? (
                    <LabResultForm
                      requestId={req.id}
                      testName={req.testName}
                      linkedRequestIds={req.linkedRequestIds}
                    />
                  ) : (
                    <span className="text-slate-400 text-xs">View Only</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
