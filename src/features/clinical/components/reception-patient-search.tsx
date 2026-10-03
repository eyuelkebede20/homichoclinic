/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, UserPlus } from "lucide-react";
import { searchPatientsFast } from "@/features/patients/actions";
import { createVisit } from "@/features/clinical/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function ReceptionPatientSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [admittingId, setAdmittingId] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // We only skip fetching if length is exactly 1 (to avoid 1-char searches). 
    // If length is 0, we fetch recommendations.
    if (query.length === 1) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      return;
    }
    
    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await searchPatientsFast({ query: query.length === 0 ? "" : query });
      setLoading(false);
      if (res?.data) {
        setResults(res.data);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  async function handleAdmit(patientId: string) {
    setAdmittingId(patientId);
    const res = await createVisit({ patientId, status: "scheduled", notes: "" });
    setAdmittingId(null);
    if (res?.error) {
      toast.error("Error admitting patient", { description: res.error });
    } else {
      setQuery("");
      // Optionally blur the input here
      router.refresh(); // Refresh dashboard to show the new patient in queue
    }
  }

  return (
    <div className="relative w-full max-w-xl z-50">
      <div className="relative">
        <input
          type="text"
          placeholder="Search by name or phone number..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-slate-200"
        />
        <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        {loading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />}
      </div>

      {isFocused && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {query.length === 0 && (
             <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
               Recent Patients
             </div>
          )}
          {results.map(p => (
            <div key={p.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex justify-between items-center transition-colors">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">{p.firstName} {p.lastName}</p>
                <p className="text-xs text-slate-500">{p.contactNumber || "No Phone"} • DOB: {new Date(p.dateOfBirth).getFullYear()}</p>
              </div>
              <button
                onClick={(e) => { e.preventDefault(); handleAdmit(p.id); }}
                disabled={admittingId === p.id}
                className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 hover:dark:bg-blue-900/50 px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {admittingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Admit to OPD
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}