"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, CheckCircle, Clock, FlaskConical, Stethoscope, User, FileText, Pill, AlertTriangle } from "lucide-react";
import { VisitStatusActions } from "./visit-status-actions";
import { calculateECAge } from "@/lib/ethiopian-calendar";

type QueueVisit = {
  id: string;
  status: string;
  updatedAt: Date;
  patientId: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    yob: string | null;
    gender: string | null;
    militaryId: string | null;
    employeeId: string | null;
    labRequests: unknown[];
  };
};

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
];

export function DoctorPatientQueue({ visits }: { visits: QueueVisit[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter
  const filtered = visits.filter(v => {
    const name = `${v.patient.firstName} ${v.patient.lastName}`.toLowerCase();
    const id = (v.patient.militaryId || v.patient.employeeId || "").toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || id.includes(searchTerm.toLowerCase());
  });

  // Paginate
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentVisits = filtered.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-white dark:bg-slate-900/60 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800/80 overflow-hidden flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900/20 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">Active Patient Queue</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review and attend to your current patients</p>
        </div>
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>
      
      {/* Table Container */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800/50">
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status & Wait Time</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Flags</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Quick Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {currentVisits.map((visit, idx) => (
              <tr 
                key={visit.id} 
                className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-200"
              >
                {/* Patient Info */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-white/30 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
                      <User className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <Link href={`/patients/${visit.patientId}`} className="font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm">
                        {visit.patient.firstName} {visit.patient.lastName}
                      </Link>
                      <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mt-1 gap-2">
                        <span className="capitalize">{visit.patient.gender || "Unknown"}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                        <span>{calculateECAge(visit.patient.yob)}</span>
                        {(visit.patient.militaryId || visit.patient.employeeId) && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                            <span className="font-mono text-[10px] text-slate-400">{visit.patient.militaryId || visit.patient.employeeId}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Status & Wait Time */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col items-start gap-1.5">
                    {visit.status === "scheduled" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                        <Clock className="w-3 h-3 text-slate-400" /> Waiting
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/60 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                        <Stethoscope className="w-3 h-3 text-blue-500" /> In Progress
                      </span>
                    )}
                    <p className="text-[11px] text-slate-400">
                      Since {new Date(visit.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </td>

                {/* Flags / Lab Results */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {(() => {
                    const labReqs = (visit.patient.labRequests as any[]) || [];
                    const urgentReqs = labReqs.filter((r) => r.status === "urgent");
                    const completedReqs = labReqs.filter((r) => r.status === "completed");

                    if (urgentReqs.length > 0) {
                      return (
                        <div className="flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-100 dark:bg-red-950/70 border border-red-300 dark:border-red-700 px-2.5 py-1 text-xs font-extrabold text-red-700 dark:text-red-300 shadow-sm animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                            ⚡ STAT / URGENT LAB ({urgentReqs.length})
                          </span>
                          {completedReqs.length > 0 && (
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold ml-1">
                              +{completedReqs.length} Result Ready
                            </span>
                          )}
                        </div>
                      );
                    }

                    if (completedReqs.length > 0) {
                      return (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 shadow-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {completedReqs.length} Result{completedReqs.length > 1 ? "s" : ""} Ready
                        </span>
                      );
                    }

                    return <span className="text-xs text-slate-400 dark:text-slate-600 italic">No alerts</span>;
                  })()}
                </td>

                {/* Quick Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    {/* Impeccable Icon Actions */}
                    <Link 
                      href={`/patients/${visit.patientId}#medical-history`}
                      title="View Medical History"
                      className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                    >
                      <FileText className="w-4 h-4" />
                    </Link>
                    <Link 
                      href={`/patients/${visit.patientId}#prescription`}
                      title="Prescribe Medication"
                      className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                    >
                      <Pill className="w-4 h-4" />
                    </Link>
                    <Link 
                      href={`/patients/${visit.patientId}#lab-request`}
                      title="Order Lab Tests"
                      className="p-2 text-fuchsia-500 hover:text-fuchsia-700 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20 rounded-lg transition-all"
                    >
                      <FlaskConical className="w-4 h-4" />
                    </Link>

                    {/* Divider */}
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

                    {/* Status Toggle Component */}
                    <VisitStatusActions visitId={visit.id} currentStatus={visit.status} patientId={visit.patientId} />
                  </div>
                </td>
              </tr>
            ))}
            
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                      <CheckCircle className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 font-medium">
                      {searchTerm ? "No patients match your search." : "No active patients in your queue."}
                    </p>
                    <p className="text-slate-400 text-sm mt-1">You're all caught up!</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20 flex justify-between items-center">
          <p className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{startIndex + 1}</span> to <span className="font-semibold text-slate-700 dark:text-slate-300">{Math.min(startIndex + itemsPerPage, filtered.length)}</span> of <span className="font-semibold text-slate-700 dark:text-slate-300">{filtered.length}</span>
          </p>
          <div className="flex gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
            >
              <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
