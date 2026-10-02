import Link from "next/link";
import { Users, Clock, Activity, ArrowRight } from "lucide-react";

type VisitWithPatient = {
  id: string;
  patient: { id: string; firstName: string; lastName: string; contactNumber: string | null };
  status: string;
  opdRoom: number | null;
  visitDate: Date;
};

export function ReceptionDashboard({ 
  opdRooms, 
  activeVisits 
}: { 
  opdRooms: number; 
  activeVisits: VisitWithPatient[]; 
}) {
  const rooms = Array.from({ length: opdRooms }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Reception Desk Overview</h2>
          <p className="text-slate-500 dark:text-slate-400">Live view of OPD queues and active patients.</p>
        </div>
        <Link 
          href="/patients/new" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          Register New Patient
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {rooms.map((roomNum) => {
          const roomVisits = activeVisits.filter(v => v.opdRoom === roomNum);
          const inProgress = roomVisits.find(v => v.status === "in_progress");
          const queued = roomVisits.filter(v => v.status === "scheduled").sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime());

          return (
            <div key={roomNum} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 px-5 py-3 flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  OPD Room {roomNum}
                </h3>
                <span className="text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full">
                  {roomVisits.length} total
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col gap-6">
                {/* Active Patient */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    Currently Inside
                  </h4>
                  {inProgress ? (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                      <p className="font-bold text-blue-900 dark:text-blue-100 text-base">
                        {inProgress.patient.firstName} {inProgress.patient.lastName}
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                        {inProgress.patient.contactNumber || "No Phone"}
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-center text-slate-400 text-sm">
                      Room is currently empty
                    </div>
                  )}
                </div>

                {/* Queue */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Waiting Queue ({queued.length})
                  </h4>
                  {queued.length > 0 ? (
                    <div className="space-y-2">
                      {queued.map((q, idx) => (
                        <Link href={`/patients/${q.patient.id}`} key={q.id} className="block group">
                          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between hover:border-blue-300 hover:shadow-sm transition-all">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}.</span>
                              <div>
                                <p className="font-medium text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-600">
                                  {q.patient.firstName} {q.patient.lastName}
                                </p>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No patients waiting in queue.</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Unassigned / Pending Triage */}
      {activeVisits.filter(v => v.opdRoom === null).length > 0 && (
        <div className="mt-8 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/50 rounded-xl p-6">
          <h3 className="font-bold text-amber-800 dark:text-amber-500 mb-4 flex items-center gap-2">
            Pending OPD Assignment (Auto-Routing Failed or Unassigned)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeVisits.filter(v => v.opdRoom === null).map(v => (
              <div key={v.id} className="bg-white dark:bg-slate-950 p-4 border border-amber-200 dark:border-amber-800/50 rounded-lg shadow-sm">
                <p className="font-bold text-slate-800 dark:text-slate-200">{v.patient.firstName} {v.patient.lastName}</p>
                <Link href={`/visits`} className="text-xs text-amber-600 hover:underline mt-2 inline-block font-medium">
                  Assign manually &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
