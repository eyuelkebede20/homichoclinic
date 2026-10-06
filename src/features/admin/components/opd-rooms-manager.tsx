"use client";

import { useState } from "react";
import { Loader2, Plus, Minus, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateSystemSetting } from "../actions";

export function OpdRoomsManager({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSave(newCount: number) {
    if (newCount < 1) return;
    setLoading(true);
    setCount(newCount);
    const res = await updateSystemSetting("totalOpdRooms", newCount.toString());
    setLoading(false);
    
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(`Total OPD rooms updated to ${newCount}`);
      router.refresh();
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 shadow rounded-lg border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2">
          <Building2 className="w-5 h-5" />
          <h2 className="font-bold">Total OPD Rooms</h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Configure the total number of physical Outpatient Department (OPD) rooms available in the clinic.
        </p>
      </div>

      <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
        <button
          onClick={() => handleSave(count - 1)}
          disabled={loading || count <= 1}
          className="p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
        >
          <Minus className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        
        <div className="flex-1 text-center">
          <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{count}</span>
          <span className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">Rooms</span>
        </div>
        
        <button
          onClick={() => handleSave(count + 1)}
          disabled={loading}
          className="p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
        >
          <Plus className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        
        {loading && <Loader2 className="w-5 h-5 text-indigo-500 animate-spin absolute right-6 top-6" />}
      </div>
    </div>
  );
}
