"use client";

import { useState } from "react";
import { Loader2, Activity, PlusCircle, CheckCircle2 } from "lucide-react";
import { addClinicalNote, toggleAdmissionStatus } from "../actions";
import { useRouter } from "next/navigation";

export function ClinicalDashboard({ 
  patientId, 
  admissionStatus 
}: { 
  patientId: string;
  admissionStatus: string;
}) {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const router = useRouter();

  async function handleStatusToggle() {
    setLoading(true);
    const res = await toggleAdmissionStatus({ patientId, currentStatus: admissionStatus });
    setLoading(false);
    if (res.error) alert(res.error);
    else router.refresh();
  }

  async function handleNoteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setLoading(true);
    const res = await addClinicalNote({ patientId, content: note });
    setLoading(false);
    if (res.error) alert(res.error);
    else {
      setNote("");
      router.refresh();
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 shadow rounded-lg border border-slate-200 dark:border-slate-800 p-6 mb-6">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          Clinical Dashboard
        </h2>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${admissionStatus === "Inpatient" ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"}`}>
            {admissionStatus}
          </span>
          <button
            onClick={handleStatusToggle}
            disabled={loading}
            className="text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-1.5 px-3 rounded border border-slate-300 dark:border-slate-600 transition-colors"
          >
            {admissionStatus === "Inpatient" ? "Discharge to Outpatient" : "Admit to Inpatient"}
          </button>
        </div>
      </div>

      <form onSubmit={handleNoteSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Add Clinical Note / System Entry
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="Write diagnosis, observation, or clinical notes here..."
            className="block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !note.trim()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
            Save Clinical Note
          </button>
        </div>
      </form>
    </div>
  );
}
