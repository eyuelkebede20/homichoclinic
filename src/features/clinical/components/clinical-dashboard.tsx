"use client";

import { useState } from "react";
import { Loader2, Activity, PlusCircle } from "lucide-react";
import { addClinicalNote, toggleAdmissionStatus } from "../actions";
import { useRouter } from "next/navigation";

export function ClinicalDashboard({ 
  patientId, 
  admissionStatus,
  activeVisit
}: { 
  patientId: string;
  admissionStatus: string;
  activeVisit?: any;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleStatusToggle() {
    setLoading(true);
    const res = await toggleAdmissionStatus({ patientId, currentStatus: admissionStatus });
    setLoading(false);
    if (res.error) alert(res.error);
    else router.refresh();
  }

  async function handleNoteSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const data = {
      patientId,
      bp: fd.get("bp") as string || undefined,
      heartRate: fd.get("hr") ? Number(fd.get("hr")) : undefined,
      temp: fd.get("temp") ? Number(fd.get("temp")) : undefined,
      weight: fd.get("weight") ? Number(fd.get("weight")) : undefined,
      subjective: fd.get("subjective") as string || undefined,
      objective: fd.get("objective") as string || undefined,
      assessment: fd.get("assessment") as string || undefined,
      plan: fd.get("plan") as string || undefined,
      content: fd.get("content") as string || "SOAP Entry"
    };

    const res = await addClinicalNote(data);
    setLoading(false);
    if (res.error) alert(res.error);
    else {
      (e.target as HTMLFormElement).reset();
      router.refresh();
    }
  }

  const vitals = activeVisit?.vitals || {};

  return (
    <div className="bg-white dark:bg-slate-900 shadow rounded-lg border border-slate-200 dark:border-slate-800 p-6 mb-6">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          Clinical Dashboard
        </h2>
        <div className="flex items-center gap-3">
          <span className={"px-3 py-1 rounded-full text-xs font-semibold " + (admissionStatus === "Inpatient" ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200")}>
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

      <form onSubmit={handleNoteSubmit} className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3 border-b border-slate-100 dark:border-slate-800 pb-1">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Vitals</h3>
            {activeVisit?.vitals && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Pre-filled by Nurse</span>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500">BP (mmHg)</label>
              <input name="bp" defaultValue={vitals.bloodPressure || ""} placeholder="120/80" className="mt-1 block w-full rounded border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500">Heart Rate (bpm)</label>
              <input name="hr" type="number" defaultValue={vitals.heartRate || ""} placeholder="72" className="mt-1 block w-full rounded border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500">Temp (C)</label>
              <input name="temp" type="number" step="0.1" defaultValue={vitals.temperature || ""} placeholder="37.0" className="mt-1 block w-full rounded border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500">Weight (kg)</label>
              <input name="weight" type="number" step="0.1" defaultValue={vitals.weight || ""} placeholder="70.5" className="mt-1 block w-full rounded border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 text-sm" />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 border-b border-slate-100 dark:border-slate-800 pb-1">SOAP Notes</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-500">Subjective (Symptoms)</label>
              <textarea name="subjective" rows={2} className="mt-1 block w-full rounded border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500">Objective (Observations)</label>
              <textarea name="objective" rows={2} className="mt-1 block w-full rounded border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500">Assessment (Diagnosis)</label>
              <textarea name="assessment" rows={2} required className="mt-1 block w-full rounded border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 text-sm border-blue-200 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500">Plan (Treatment)</label>
              <textarea name="plan" rows={2} className="mt-1 block w-full rounded border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 text-sm" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
            Save Clinical Record
          </button>
        </div>
      </form>
    </div>
  );
}