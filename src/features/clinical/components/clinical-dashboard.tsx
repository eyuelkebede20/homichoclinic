"use client";

import { useState } from "react";
import { Loader2, Activity, Heart, Thermometer, Scale, Save, CheckCircle2, Stethoscope } from "lucide-react";
import { addClinicalNote, toggleAdmissionStatus } from "../actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function ClinicalDashboard({ 
  patientId, 
  admissionStatus = "Outpatient",
  activeVisit
}: { 
  patientId: string;
  admissionStatus?: string | null;
  activeVisit?: any;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleStatusToggle() {
    setLoading(true);
    const res = await toggleAdmissionStatus({ patientId, currentStatus: admissionStatus });
    setLoading(false);
    if (res.error) toast.error(res.error);
    else router.refresh();
  }

  async function handleNoteSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const data = {
      patientId,
      bp: (fd.get("bp") as string)?.trim() || undefined,
      heartRate: fd.get("hr") && !isNaN(parseFloat(fd.get("hr") as string)) ? parseFloat(fd.get("hr") as string) : undefined,
      temp: fd.get("temp") && !isNaN(parseFloat(fd.get("temp") as string)) ? parseFloat(fd.get("temp") as string) : undefined,
      weight: fd.get("weight") && !isNaN(parseFloat(fd.get("weight") as string)) ? parseFloat(fd.get("weight") as string) : undefined,
      subjective: (fd.get("subjective") as string)?.trim() || undefined,
      objective: (fd.get("objective") as string)?.trim() || undefined,
      assessment: (fd.get("assessment") as string)?.trim() || undefined,
      plan: (fd.get("plan") as string)?.trim() || undefined,
      content: (fd.get("content") as string)?.trim() || "SOAP Entry"
    };

    const res = await addClinicalNote(data);
    setLoading(false);
    if (res.error) toast.error(res.error);
    else {
      (e.target as HTMLFormElement).reset();
      router.refresh();
    }
  }

  const vitals = activeVisit?.vitals || {};
  const hasNurseVitals = !!(vitals.bloodPressure || vitals.heartRate || vitals.temperature || vitals.weight);

  return (
    <div className="bg-white dark:bg-slate-900 shadow-sm rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 mb-5 transition-all">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3.5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Clinical Examination & Record
          </h2>
          <p className="text-xs text-slate-500">Record patient vitals and SOAP consultation notes</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            admissionStatus === "Inpatient" 
              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800" 
              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
          }`}>
            {admissionStatus || "Outpatient"}
          </span>
          <button
            onClick={handleStatusToggle}
            disabled={loading}
            className="text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
          >
            {admissionStatus === "Inpatient" ? "Discharge to Outpatient" : "Admit to Inpatient"}
          </button>
        </div>
      </div>

      <form onSubmit={handleNoteSubmit} className="space-y-3.5">
        {/* Vitals Telemetry Row - Tight, Clean, Focused */}
        <div className="bg-slate-50/70 dark:bg-slate-950/40 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Patient Vital Signs
              </span>
            </div>
            {hasNurseVitals ? (
              <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 px-2 py-0.5 rounded-md font-semibold border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                Pre-filled by Nurse
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 italic">Enter current visit vitals</span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Blood Pressure */}
            <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-indigo-500" />
                  Blood Pressure
                </span>
                <span className="text-[10px] text-slate-400 font-mono">mmHg</span>
              </div>
              <input
                name="bp"
                defaultValue={vitals.bloodPressure || ""}
                placeholder="120/80"
                className="w-full bg-transparent px-1.5 py-0.5 text-sm font-mono font-medium text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
              />
            </div>

            {/* Heart Rate */}
            <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-rose-500" />
                  Heart Rate
                </span>
                <span className="text-[10px] text-slate-400 font-mono">bpm</span>
              </div>
              <input
                name="hr"
                type="number"
                defaultValue={vitals.heartRate || ""}
                placeholder="72"
                className="w-full bg-transparent px-1.5 py-0.5 text-sm font-mono font-medium text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
              />
            </div>

            {/* Temperature */}
            <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
                <span className="flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-amber-500" />
                  Temperature
                </span>
                <span className="text-[10px] text-slate-400 font-mono">°C</span>
              </div>
              <input
                name="temp"
                type="number"
                step="0.1"
                defaultValue={vitals.temperature || ""}
                placeholder="37.0"
                className="w-full bg-transparent px-1.5 py-0.5 text-sm font-mono font-medium text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
              />
            </div>

            {/* Weight */}
            <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
                <span className="flex items-center gap-1">
                  <Scale className="w-3 h-3 text-emerald-500" />
                  Weight
                </span>
                <span className="text-[10px] text-slate-400 font-mono">kg</span>
              </div>
              <input
                name="weight"
                type="number"
                step="0.1"
                defaultValue={vitals.weight || ""}
                placeholder="70.5"
                className="w-full bg-transparent px-1.5 py-0.5 text-sm font-mono font-medium text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
              />
            </div>
          </div>
        </div>

        {/* SOAP Consultation Notes - Compact & Structured */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              SOAP Consultation Notes
            </h3>
            <span className="text-[11px] text-slate-400">Assessment is required</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Subjective <span className="font-normal text-slate-400">(Chief complaint, history)</span>
              </label>
              <textarea
                name="subjective"
                rows={2}
                placeholder="Patient symptoms and complaints..."
                className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Objective <span className="font-normal text-slate-400">(Examination, findings)</span>
              </label>
              <textarea
                name="objective"
                rows={2}
                placeholder="Physical examination and observations..."
                className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Assessment <span className="text-rose-500">*</span> <span className="font-normal text-slate-400">(Diagnosis)</span>
              </label>
              <textarea
                name="assessment"
                rows={2}
                required
                placeholder="Working or confirmed clinical diagnosis..."
                className="block w-full rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/20 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Plan <span className="font-normal text-slate-400">(Therapy, orders, advice)</span>
              </label>
              <textarea
                name="plan"
                rows={2}
                placeholder="Management plan, counseling, follow-up..."
                className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 transition-all shadow-xs"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Clinical Record
          </button>
        </div>
      </form>
    </div>
  );
}