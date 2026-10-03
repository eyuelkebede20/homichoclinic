/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Loader2, Activity } from "lucide-react";
import { updateVisitVitals } from "../actions";
import { useRouter } from "next/navigation";

export function NurseDashboard({ visits }: { visits: any[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Nurse Triage Dashboard</h2>
        <p className="text-slate-500 dark:text-slate-400">Record patient vitals before doctor consultation.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg shadow border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Waiting for Vitals</h2>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {visits.length === 0 && (
            <div className="p-8 text-center text-slate-500">No active patients waiting.</div>
          )}
          {visits.map(visit => (
            <NurseVitalsRow key={visit.id} visit={visit} />
          ))}
        </div>
      </div>
    </div>
  );
}

function NurseVitalsRow({ visit }: { visit: any }) {
  const existing = (visit.vitals as any) || {};
  const [weight, setWeight] = useState(existing.weight || "");
  const [bp, setBp] = useState(existing.bloodPressure || "");
  const [temp, setTemp] = useState(existing.temperature || "");
  const [hr, setHr] = useState(existing.heartRate || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!visit.vitals);
  const router = useRouter();

  async function handleSave() {
    setSaving(true);
    const res = await updateVisitVitals({
      visitId: visit.id,
      vitals: { weight, bloodPressure: bp, temperature: temp, heartRate: hr }
    });
    setSaving(false);
    if (res?.error) alert(res.error);
    else {
      setSaved(true);
      router.refresh();
    }
  }

  return (
    <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <div>
        <h3 className="font-bold text-blue-600 dark:text-blue-400">
          {visit.patient.firstName} {visit.patient.lastName}
        </h3>
        <p className="text-xs text-slate-500">
          OPD Room {visit.opdRoom} • Waiting since {new Date(visit.updatedAt).toLocaleTimeString()}
        </p>
        {saved && <span className="inline-block mt-1 text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded">Vitals Recorded</span>}
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        <input 
          type="text" 
          placeholder="Weight (kg)" 
          value={weight} 
          onChange={e => setWeight(e.target.value)}
          className="w-24 px-2 py-1.5 text-sm rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
        />
        <input 
          type="text" 
          placeholder="BP (mmHg)" 
          value={bp} 
          onChange={e => setBp(e.target.value)}
          className="w-24 px-2 py-1.5 text-sm rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
        />
        <input 
          type="text" 
          placeholder="Temp (°C)" 
          value={temp} 
          onChange={e => setTemp(e.target.value)}
          className="w-24 px-2 py-1.5 text-sm rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
        />
        <input 
          type="text" 
          placeholder="HR (bpm)" 
          value={hr} 
          onChange={e => setHr(e.target.value)}
          className="w-24 px-2 py-1.5 text-sm rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
          {saved ? "Update" : "Save"}
        </button>
      </div>
    </div>
  );
}
