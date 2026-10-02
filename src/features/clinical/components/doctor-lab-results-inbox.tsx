"use client";

import { useState } from "react";
import { CheckCircle2, Beaker, ChevronRight } from "lucide-react";
import { dismissLabResult } from "../actions";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function DoctorLabResultsInbox({
  results
}: {
  results: import('@prisma/client').Prisma.LabResultGetPayload<{}>[]
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  if (results.length === 0) return null;

  async function handleDismiss(id: string) {
    setLoading(id);
    const res = await dismissLabResult({ resultId: id });
    setLoading(null);
    if (!res.error) {
      router.refresh();
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow border border-indigo-200 dark:border-indigo-800 overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-indigo-100 dark:border-indigo-900 flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/30">
        <h2 className="text-lg font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
          <Beaker className="w-5 h-5" />
          New Lab Results ({results.length})
        </h2>
      </div>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
        {results.map(res => (
          <li key={res.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex justify-between items-center group">
            <div>
              <Link href={`/patients/${res.request.patientId}`} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                {res.request.patient.firstName} {res.request.patient.lastName}
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">
                {res.request.test.name}
              </p>
              <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                <span className="font-semibold">Findings:</span> {res.findings}
              </p>
            </div>
            
            <button
              onClick={() => handleDismiss(res.id)}
              disabled={loading === res.id}
              className="flex items-center gap-1 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Mark Reviewed
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
