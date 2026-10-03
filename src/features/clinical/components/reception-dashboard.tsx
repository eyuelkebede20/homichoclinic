/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Link from "next/link";
import { Users, Clock, Activity, Power } from "lucide-react";
import { ReceptionPatientSearch } from "./reception-patient-search";
import { CancelVisitButton } from "./cancel-visit-button";
import { toggleOpdRoom } from "../actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

type VisitWithPatient = {
  id: string;
  patient: { id: string; firstName: string; lastName: string; contactNumber: string | null };
  status: string;
  opdRoom: number | null;
  visitDate: Date;
};

export function ReceptionDashboard({ 
  activeOpds, 
  activeVisits 
}: { 
  activeOpds: number[]; 
  activeVisits: VisitWithPatient[]; 
}) {
  const router = useRouter();
  const [loadingRoom, setLoadingRoom] = useState<number | null>(null);
  const totalRooms = [1, 2, 3, 4, 5]; // Assume 5 rooms in the clinic

  async function handleToggleRoom(room: number) {
    setLoadingRoom(room);
    const newRooms = activeOpds.includes(room) ? activeOpds.filter(r => r !== room) : [...activeOpds, room];
    await toggleOpdRoom({ rooms: newRooms });
    setLoadingRoom(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Reception Desk Overview</h2>
          <p className="text-slate-500 dark:text-slate-400">Live view of OPD queues and active patients.</p>
        </div>
        
        <div className="flex-1 max-w-xl mx-4">
          <ReceptionPatientSearch />
        </div>

        <Link 
          href="/patients/new" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2 whitespace-nowrap"
        >
          <Users className="w-4 h-4" />
          Register New
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {totalRooms.map(room => {
          const isActive = activeOpds.includes(room);
          const roomVisits = activeVisits.filter(v => v.opdRoom === room);
          const inProgress = roomVisits.find(v => v.status === "in_progress");
          const waiting = roomVisits.filter(v => v.status === "scheduled");
          
          return (
            <div key={room} className={`bg-white dark:bg-slate-900 rounded-lg shadow border overflow-hidden flex flex-col ${isActive ? "border-slate-200 dark:border-slate-800" : "border-slate-200 dark:border-slate-800 opacity-70"}`}>
              <div className={`px-4 py-3 border-b flex justify-between items-center ${isActive ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800" : "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800"}`}>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200">OPD {room}</h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isActive ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                    {isActive ? "Online" : "Offline"}
                  </span>
                </div>
                <button 
                  onClick={() => handleToggleRoom(room)}
                  disabled={loadingRoom === room}
                  className={`p-1.5 rounded-full transition-colors ${isActive ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-green-100 text-green-600 hover:bg-green-200"}`}
                  title={isActive ? "Take Offline" : "Bring Online"}
                >
                  <Power className={`w-3 h-3 ${loadingRoom === room ? "animate-pulse" : ""}`} />
                </button>
              </div>

              <div className="flex-1 p-4 flex flex-col">
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Inside Now
                  </h4>
                  {inProgress ? (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded p-2 flex justify-between items-center">
                      <Link href={`/patients/${inProgress.patient.id}`} className="font-medium text-sm text-blue-700 dark:text-blue-400 hover:underline truncate">
                        {inProgress.patient.firstName} {inProgress.patient.lastName}
                      </Link>
                      <CancelVisitButton visitId={inProgress.id} />
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">Empty</p>
                  )}
                </div>

                <div className="flex-1">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Waiting Queue ({waiting.length})
                  </h4>
                  <div className="space-y-2">
                    {waiting.length === 0 ? (
                      <p className="text-sm text-slate-400 italic">No one waiting</p>
                    ) : (
                      waiting.map(v => (
                        <div key={v.id} className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                          <Link href={`/patients/${v.patient.id}`} className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 truncate mr-2">
                            {v.patient.firstName} {v.patient.lastName}
                          </Link>
                          <CancelVisitButton visitId={v.id} />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}