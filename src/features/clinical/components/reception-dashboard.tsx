/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Link from "next/link";
import { Users, Clock, Activity, Power, RotateCcw, AlertCircle, Loader2 } from "lucide-react";
import { ReceptionPatientSearch } from "./reception-patient-search";
import { CancelVisitButton } from "./cancel-visit-button";
import { toggleOpdRoom, resetOpdQueue } from "../actions";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

type VisitWithPatient = {
  id: string;
  patient: { 
    id: string; 
    firstName: string; 
    lastName: string; 
    contactNumber: string | null;
    patientType?: string;
    militaryId?: string | null;
    employeeId?: string | null;
    rank?: string | null;
  };
  status: string;
  opdRoom: number | null;
  visitDate: Date;
};

export function ReceptionDashboard({ 
  activeOpds, 
  activeVisits,
  activeDoctors,
  totalRoomsCount
}: { 
  activeOpds: number[]; 
  activeVisits: VisitWithPatient[];
  activeDoctors?: { name: string, currentOpdRoom: number | null }[];
  totalRoomsCount?: number;
}) {
  const router = useRouter();
  const [loadingRoom, setLoadingRoom] = useState<number | null>(null);
  const [searchOpd, setSearchOpd] = useState("");
  const [resetModal, setResetModal] = useState<{ isOpen: boolean; room: number | null }>({
    isOpen: false,
    room: null,
  });
  const [clearWaitingToday, setClearWaitingToday] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const totalRooms = Array.from({ length: totalRoomsCount || 5 }, (_, i) => i + 1);

  // Auto-refresh the dashboard every 5 seconds to show real-time queue updates
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 5000);
    return () => clearInterval(interval);
  }, [router]);

  async function handleToggleRoom(room: number) {
    setLoadingRoom(room);
    const newRooms = activeOpds.includes(room) ? activeOpds.filter(r => r !== room) : [...activeOpds, room];
    await toggleOpdRoom({ rooms: newRooms });
    setLoadingRoom(null);
    router.refresh();
  }

  async function handleResetQueue() {
    setIsResetting(true);
    try {
      const res = await resetOpdQueue({
        opdRoom: resetModal.room,
        clearWaitingToday,
      });

      if (res?.error) {
        toast.error("Failed to reset OPD queue", { description: res.error });
      } else if (res?.data) {
        const { staleCount, todayCount, totalCleared } = res.data;
        if (totalCleared > 0) {
          toast.success(
            `OPD queue reset: cleared ${staleCount} stale visit(s)${todayCount > 0 ? ` and ${todayCount} waiting visit(s)` : ""}. Locked patients are now unblocked!`
          );
        } else {
          toast.info("OPD queue is already clean. No stale un-attended visits found.");
        }
        setResetModal({ isOpen: false, room: null });
        setClearWaitingToday(false);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred while resetting the queue");
    } finally {
      setIsResetting(false);
    }
  }

  const filteredRooms = totalRooms.filter(room => {
    if (!searchOpd) return true;
    const q = searchOpd.toLowerCase().trim();
    if (room.toString() === q || `opd ${room}`.toLowerCase().includes(q)) return true;

    // Match doctor assigned to room
    const doctorInRoom = activeDoctors?.some(d => d.currentOpdRoom === room && d.name.toLowerCase().includes(q));
    if (doctorInRoom) return true;

    // Match patient or personnel in this room
    const roomVisits = activeVisits.filter(v => v.opdRoom === room);
    return roomVisits.some(v => {
      const p = v.patient;
      const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
      const idMatch = (p.militaryId || p.employeeId || "").toLowerCase();
      const phoneMatch = p.contactNumber || "";
      const roleMatch = (p.patientType || "").toLowerCase();
      const rankMatch = (p.rank || "").toLowerCase();
      return fullName.includes(q) || idMatch.includes(q) || phoneMatch.includes(q) || roleMatch.includes(q) || rankMatch.includes(q);
    });
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Reception Desk Overview</h2>
          <p className="text-slate-500 dark:text-slate-400">Live view of OPD queues and active patients.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row flex-1 max-w-2xl mx-4 gap-4 w-full">
          <ReceptionPatientSearch />
          <div className="relative flex-1 min-w-[200px]">
            <input 
              type="text" 
              placeholder="Search OPD..." 
              value={searchOpd}
              onChange={(e) => setSearchOpd(e.target.value)}
              className="w-full pl-3 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            type="button"
            onClick={() => {
              setClearWaitingToday(false);
              setResetModal({ isOpen: true, room: null });
            }}
            className="bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 px-3.5 py-2 rounded-lg font-medium shadow-xs flex items-center gap-2 whitespace-nowrap text-sm transition-colors cursor-pointer"
            title="Reset OPD Queue and clear stale un-attended visits from past days"
          >
            <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            Reset OPD Queue
          </button>
          <Link 
            href="/patients/new" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2 whitespace-nowrap text-sm"
          >
            <Users className="w-4 h-4" />
            Register New
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {filteredRooms.map(room => {
          const isActive = activeOpds.includes(room);
          const roomVisits = activeVisits.filter(v => v.opdRoom === room);
          const inProgress = roomVisits.find(v => v.status === "in_progress");
          const waiting = roomVisits.filter(v => v.status === "scheduled");
          
          return (
            <div key={room} className={`bg-white dark:bg-slate-900/50 rounded-xl shadow-sm border overflow-hidden flex flex-col transition-all duration-200 ${
              isActive 
                ? "border-green-400 dark:border-green-600 ring-1 ring-green-400/50 dark:ring-green-600/50" 
                : "border-slate-200 dark:border-slate-800/40 opacity-60 grayscale-[50%]"
            }`}>
              <div className={`px-4 py-3 border-b flex justify-between items-center ${
                isActive 
                  ? "bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800/60" 
                  : "bg-slate-100/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/40"
              }`}>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold ${isActive ? "text-green-800 dark:text-green-300" : "text-slate-500 dark:text-slate-400"}`}>
                      OPD {room}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isActive ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400 shadow-sm" : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                      {isActive ? "Online" : "Offline"}
                    </span>
                  </div>
                  {activeDoctors && activeDoctors.some(d => d.currentOpdRoom === room) && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1 flex items-center gap-1.5">
                      <Users className="w-3 h-3" />
                      <div className="flex items-center gap-1">
                        {activeDoctors.filter(d => d.currentOpdRoom === room).map((d, i) => (
                          <span key={i} className="flex items-center gap-1">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Dr. {d.name}
                            {i < activeDoctors.filter(doc => doc.currentOpdRoom === room).length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </div>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    type="button"
                    onClick={() => {
                      setClearWaitingToday(false);
                      setResetModal({ isOpen: true, room });
                    }}
                    className="p-1.5 rounded-full text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors cursor-pointer"
                    title={`Reset OPD ${room} Queue`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleToggleRoom(room)}
                    disabled={loadingRoom === room}
                    className={`p-1.5 rounded-full transition-colors ${isActive ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-green-100 text-green-600 hover:bg-green-200"}`}
                    title={isActive ? "Take Offline" : "Bring Online"}
                  >
                    <Power className={`w-3.5 h-3.5 ${loadingRoom === room ? "animate-pulse" : ""}`} />
                  </button>
                </div>
              </div>

              <div className="flex-1 p-4 flex flex-col">
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Inside Now
                  </h4>
                  {inProgress ? (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-2.5 flex justify-between items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <Link href={`/patients/${inProgress.patient.id}`} className="font-semibold text-sm text-blue-700 dark:text-blue-400 hover:underline truncate block">
                          {inProgress.patient.firstName} {inProgress.patient.lastName}
                        </Link>
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {inProgress.patient.patientType && (
                            <span className={`px-1.5 py-0.2 rounded font-bold ${
                              inProgress.patient.patientType === "Soldier"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                                : inProgress.patient.patientType === "Civilian Staff"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                            }`}>
                              {inProgress.patient.rank ? `${inProgress.patient.rank} ` : ""}{inProgress.patient.patientType}
                            </span>
                          )}
                          {(inProgress.patient.militaryId || inProgress.patient.employeeId) && (
                            <span className="font-mono bg-white/80 dark:bg-slate-900 px-1 rounded border border-slate-200 dark:border-slate-800">
                              {inProgress.patient.militaryId || inProgress.patient.employeeId}
                            </span>
                          )}
                        </div>
                      </div>
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
                        <div key={v.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 gap-2">
                          <div className="min-w-0 flex-1">
                            <Link href={`/patients/${v.patient.id}`} className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 truncate block">
                              {v.patient.firstName} {v.patient.lastName}
                            </Link>
                            <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {v.patient.patientType && (
                                <span className={`px-1.5 py-0.2 rounded font-bold ${
                                  v.patient.patientType === "Soldier"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                                    : v.patient.patientType === "Civilian Staff"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                                }`}>
                                  {v.patient.rank ? `${v.patient.rank} ` : ""}{v.patient.patientType}
                                </span>
                              )}
                              {(v.patient.militaryId || v.patient.employeeId) && (
                                <span className="font-mono bg-white/80 dark:bg-slate-900 px-1 rounded border border-slate-200 dark:border-slate-800">
                                  {v.patient.militaryId || v.patient.employeeId}
                                </span>
                              )}
                            </div>
                          </div>
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

      {resetModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    {resetModal.room ? `Reset OPD ${resetModal.room} Queue` : "Reset OPD Queue"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Clear stale visits and unblock patients who were not seen.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  Releases locked patients:
                </p>
                <p className="leading-relaxed">
                  Patients who were sent to the OPD on previous days but were never attended will be cancelled and freed so they can be re-admitted today.
                </p>
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors">
                <input 
                  type="checkbox" 
                  checked={clearWaitingToday} 
                  onChange={(e) => setClearWaitingToday(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <div className="text-xs space-y-0.5">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Also clear today&apos;s waiting queue
                  </span>
                  <p className="text-slate-500 dark:text-slate-400">
                    {resetModal.room 
                      ? `Cancel all currently waiting patients in OPD ${resetModal.room}` 
                      : "Cancel all currently waiting patients across all OPD rooms"}
                  </p>
                </div>
              </label>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={() => {
                    setResetModal({ isOpen: false, room: null });
                    setClearWaitingToday(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={handleResetQueue}
                  className="px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      Confirm Reset
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}