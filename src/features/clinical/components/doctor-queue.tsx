"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { VisitStatusActions } from "./visit-status-actions";

type QueueVisit = {
  id: string;
  status: string;
  updatedAt: Date;
  patientId: string;
  patient: {
    firstName: string;
    lastName: string;
    labRequests: unknown[];
  };
};

export function DoctorPatientQueue({ visits }: { visits: QueueVisit[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter
  const filtered = visits.filter(v => {
    const name = `${v.patient.firstName} ${v.patient.lastName}`.toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  // Paginate
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentVisits = filtered.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-white dark:bg-slate-900/50 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">Active Patient Queue</h2>
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search queue..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>
      
      <ul className="divide-y divide-slate-200 dark:divide-slate-800 flex-1">
        {currentVisits.map(visit => (
          <li key={visit.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <Link href={`/patients/${visit.patientId}`} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                {visit.patient.firstName} {visit.patient.lastName}
              </Link>
              <p className="text-xs text-slate-500 mt-1">Waiting since: {new Date(visit.updatedAt).toLocaleTimeString()}</p>
            </div>
            
            <div className="flex items-center gap-3">
              {visit.patient.labRequests.length > 0 ? (
                <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-400">
                  {visit.patient.labRequests.length} Lab Result(s) Ready
                </span>
              ) : visit.status === "scheduled" ? (
                <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-400">
                  New Patient
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:text-yellow-400">
                  In Progress
                </span>
              )}
              
              <div className="border-l border-slate-200 dark:border-slate-700 pl-3 h-6 flex items-center">
                <VisitStatusActions visitId={visit.id} currentStatus={visit.status} patientId={visit.patientId} />
              </div>
            </div>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="p-8 text-center text-slate-500">
            {searchTerm ? "No patients match your search." : "No active patients in your queue."}
          </li>
        )}
      </ul>
      
      {totalPages > 1 && (
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
          <p className="text-xs text-slate-500">
            Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(startIndex + itemsPerPage, filtered.length)}</span> of <span className="font-medium">{filtered.length}</span>
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
