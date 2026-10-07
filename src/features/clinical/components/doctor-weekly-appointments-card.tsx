"use client";

import { useState } from "react";
import Link from "next/link";
import { User, X, Clock, CheckCircle } from "lucide-react";
import { calculateECAge } from "@/lib/ethiopian-calendar";

type WeeklyAppointment = {
  id: string;
  status: string;
  visitDate: Date;
  opdRoom: number | null;
  patientId: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    yob: string | null;
    gender: string | null;
    militaryId: string | null;
    employeeId: string | null;
  };
};

export function DoctorWeeklyAppointmentsCard({ appointments, count }: { appointments: WeeklyAppointment[], count: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full text-left bg-white dark:bg-slate-900/50 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 relative overflow-hidden hover:border-blue-400 hover:shadow-md transition-all group"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Clock className="w-24 h-24 text-blue-600" />
        </div>
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-blue-600 transition-colors">My Appointments This Week</h3>
        <p className="mt-2 text-4xl font-semibold text-slate-900 dark:text-slate-100">{count}</p>
        <p className="mt-2 text-xs text-blue-500 font-medium">Click to view schedule &rarr;</p>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-4xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">My Appointments This Week</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Overview of scheduled and completed visits</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-0">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-100 dark:border-slate-800/50 z-10">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <p className="text-slate-500 dark:text-slate-400">No appointments scheduled for this week.</p>
                      </td>
                    </tr>
                  ) : (
                    appointments.map(visit => (
                      <tr key={visit.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {new Date(visit.visitDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {new Date(visit.visitDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                              <User className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                              <Link href={`/patients/${visit.patientId}`} onClick={() => setIsOpen(false)} className="font-medium text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 text-sm">
                                {visit.patient.firstName} {visit.patient.lastName}
                              </Link>
                              <div className="flex items-center text-xs text-slate-500 mt-0.5 gap-2">
                                <span className="capitalize">{visit.patient.gender || "Unknown"}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                                <span>{calculateECAge(visit.patient.yob)}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {visit.status === "completed" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                              <CheckCircle className="w-3 h-3 text-emerald-500" /> Completed
                            </span>
                          ) : visit.status === "in_progress" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/60 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                              <Clock className="w-3 h-3 text-blue-500" /> In Progress
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                              <Clock className="w-3 h-3 text-slate-400" /> Scheduled
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                          {visit.opdRoom ? `OPD ${visit.opdRoom}` : "TBD"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
