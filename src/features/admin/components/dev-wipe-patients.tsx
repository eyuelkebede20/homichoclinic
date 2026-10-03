"use client";

import { useState } from "react";
import { wipeAllPatients } from "../actions-dev";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function DevWipePatients() {
  const [loading, setLoading] = useState(false);

  const handleWipe = async () => {
    if (process.env.NODE_ENV !== "development") {
      const confirm = window.confirm("WARNING: You are about to DELETE ALL PATIENTS AND RELATED CLINICAL RECORDS. This action CANNOT BE UNDONE. Type 'DELETE' to confirm.");
      if (confirm !== true) return;
    } else {
      const confirm = window.confirm("Are you sure you want to delete all patients from the database? This is for DEV use.");
      if (!confirm) return;
    }

    setLoading(true);
    try {
      const res = await wipeAllPatients();
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("All patients have been successfully deleted.");
        window.location.reload();
      }
    } catch (e: any) {
      toast.error("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-lg shadow-sm border border-red-200 dark:border-red-900 h-full flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Dev Tools: Wipe Patients
        </h3>
        <p className="text-sm text-red-600 dark:text-red-300 mt-2 opacity-90">
          This will instantly delete ALL patients, visits, prescriptions, and invoices from the database. Use this to reset the environment when imports go wrong.
        </p>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleWipe}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          {loading ? "Wiping Database..." : "Delete All Patients"}
        </button>
      </div>
    </div>
  );
}
