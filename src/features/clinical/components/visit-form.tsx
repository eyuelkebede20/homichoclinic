"use client";

import { useState } from "react";
import { createVisit } from "@/features/clinical/actions";
import { Loader2, DoorOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { PatientSearchSelect } from "@/components/patient-search-select";
import { toast } from "sonner";

export function VisitForm({ patients, doctors }: { patients: {id: string, name: string}[], doctors: {id: string, name: string, currentOpdRoom?: number | null}[] }) {
  const [loading, setLoading] = useState(false);
  const [assignedRoom, setAssignedRoom] = useState<number | null>(null);
  const [patientId, setPatientId] = useState("");
  const [visitDate, setVisitDate] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const router = useRouter();

  const handleQuickDate = (daysToAdd: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setVisitDate(d.toISOString().slice(0, 16));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!patientId) {
      toast.success("Please select a patient.");
      return;
    }
    
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      patientId,
      doctorId: formData.get("doctorId") as string,
      notes: formData.get("notes") as string,
      status: "scheduled" as const,
      visitDate: visitDate || undefined,
    };

    const res = await createVisit(data);
    
    setLoading(false);
    if (res.error) toast.error(res.error);
    else {
      if (res.data?.opdRoom) {
        setAssignedRoom(res.data.opdRoom);
      }
      setPatientId("");
      (e.target as HTMLFormElement).reset();
      router.refresh();
    }
  }

  return (
    <>
      {assignedRoom && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm text-center p-8 animate-in fade-in zoom-in-95 duration-200 border border-blue-100 dark:border-blue-900">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <DoorOpen className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              OPD {assignedRoom}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              The patient has been automatically assigned. Please direct them to OPD Room {assignedRoom}.
            </p>
            <button 
              onClick={() => setAssignedRoom(null)} 
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900/50 p-6 shadow-sm rounded-xl border border-slate-200 dark:border-slate-800/60 space-y-5">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <DoorOpen className="w-5 h-5 text-blue-500" />
          Queue a Patient
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Patient</label>
            <PatientSearchSelect 
              patients={patients}
              selectedId={patientId}
              onChange={setPatientId}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assign Doctor</label>
            <select required name="doctorId" className="block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm">
              <option value="">-- Select Doctor --</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>
                  Dr. {d.name} {d.currentOpdRoom ? `(OPD ${d.currentOpdRoom})` : "(Off Duty)"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex justify-between items-end mb-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Visit Date & Time</label>
              <div className="flex gap-1">
                <button type="button" onClick={() => handleQuickDate(0)} className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300">Today</button>
                <button type="button" onClick={() => handleQuickDate(1)} className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300">Tmrw</button>
                <button type="button" onClick={() => handleQuickDate(7)} className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300">1Wk</button>
                <button type="button" onClick={() => handleQuickDate(30)} className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300">1Mo</button>
              </div>
            </div>
            <input required name="visitDate" type="datetime-local" value={visitDate} onChange={e => setVisitDate(e.target.value)} className="block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason / Notes</label>
            <input name="notes" type="text" placeholder="e.g. Follow-up for fever" className="block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm" />
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Schedule Visit"}
        </button>
      </form>
    </>
  );
}
