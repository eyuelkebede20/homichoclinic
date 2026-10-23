"use client";

import { useState } from "react";
import { wipeAllMedicines } from "../actions-dev";
import { Pill, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function DevWipeDrugs() {
  const [loading, setLoading] = useState(false);

  const handleWipe = async () => {
    const confirm = window.confirm(
      "DANGER: Are you sure you want to delete ALL medicines and stock batches from the pharmacy catalog? This cannot be undone."
    );
    if (!confirm) return;

    setLoading(true);
    try {
      const res = await wipeAllMedicines();
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("All medicines and pharmacy stock have been wiped.");
        window.location.reload();
      }
    } catch (e: any) {
      toast.error("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-rose-50/50 dark:bg-rose-950/20 p-6 rounded-xl shadow-sm border border-rose-200 dark:border-rose-900/50 h-full flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2">
          <Pill className="w-5 h-5" />
          Dev Tools: Wipe All Medicines
        </h3>
        <p className="text-sm text-rose-600 dark:text-rose-300 mt-2 opacity-90">
          This will delete all seeded drugs, medicines, and active inventory batches from the database without touching lab tests or patient history.
        </p>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleWipe}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          {loading ? "Wiping Medicines..." : "Delete All Medicines"}
        </button>
      </div>
    </div>
  );
}
