/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { Loader2, TestTube, CheckCircle2 } from "lucide-react";
import { enterLabResult } from "../actions";
import { useRouter } from "next/navigation";

export function LabDashboard({ requests }: { requests: any[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Laboratory Queue</h2>
        <p className="text-slate-500 dark:text-slate-400">Pending requests and result entry.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 shadow rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 dark:text-slate-200">Pending Tests</h3>
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
            {requests.length} Pending
          </span>
        </div>
        
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {requests.length === 0 ? (
            <div className="p-8 text-center text-slate-500 italic">No pending lab requests.</div>
          ) : (
            requests.map(req => <LabRequestRow key={req.id} request={req} />)
          )}
        </div>
      </div>
    </div>
  );
}

function LabRequestRow({ request }: { request: any }) {
  const [findings, setFindings] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleSave() {
    if (!findings.trim()) return alert("Please enter findings.");
    setSaving(true);
    const res = await enterLabResult({ requestId: request.id, findings });
    setSaving(false);
    if (res.error) alert(res.error);
    else router.refresh();
  }

  return (
    <div className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <TestTube className="w-4 h-4 text-purple-500" />
          <h4 className="font-bold text-slate-800 dark:text-slate-200">{request.test.name}</h4>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
            {request.status}
          </span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          <span className="font-medium">Patient:</span> {request.patient.firstName} {request.patient.lastName}
        </p>
        <p className="text-xs text-slate-500">
          Requested at {new Date(request.createdAt).toLocaleTimeString()}
        </p>
      </div>

      <div className="w-full md:w-1/2 flex gap-2">
        <textarea
          placeholder="Enter lab findings/results here..."
          value={findings}
          onChange={e => setFindings(e.target.value)}
          className="flex-1 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
          rows={2}
        />
        <button
          onClick={handleSave}
          disabled={saving || !findings.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors flex flex-col justify-center items-center gap-1 min-w-[80px]"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Save
        </button>
      </div>
    </div>
  );
}