"use client";

import { useState } from "react";
import { Loader2, Calendar } from "lucide-react";
import { createVisit } from "@/features/clinical/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function ScheduleAppointmentForm({ 
  patientId,
  doctors 
}: { 
  patientId: string;
  doctors: { id: string; name: string }[];
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const dateStr = fd.get("visitDate") as string;
    const timeStr = fd.get("visitTime") as string;
    const docId = fd.get("doctorId") as string;
    const notes = fd.get("notes") as string;

    const [year, month, day] = dateStr.split("-");
    const [hours, minutes] = timeStr.split(":");
    
    const visitDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes));

    const res = await createVisit({
      patientId,
      doctorId: docId || undefined,
      notes: notes || undefined,
      visitDate: visitDate.toISOString(),
      status: "scheduled"
    });

    setLoading(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Appointment Scheduled!");
      (e.target as HTMLFormElement).reset();
      router.refresh();
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 shadow rounded-lg border border-slate-200 dark:border-slate-800 p-6 mb-6">
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <Calendar className="w-5 h-5 text-indigo-500" />
        Schedule Future Appointment
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
            <input required type="date" name="visitDate" className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Time</label>
            <input required type="time" name="visitTime" className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Doctor (Optional)</label>
          <select name="doctorId" className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 text-sm">
            <option value="">Any Doctor / Walk-in Pool</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Reason / Notes</label>
          <input type="text" name="notes" placeholder="Follow-up, test review..." className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 text-sm" />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Schedule Appointment
          </button>
        </div>
      </form>
    </div>
  );
}
