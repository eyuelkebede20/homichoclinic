"use client";

import { useState } from "react";
import { wipeAllCatalogs } from "../actions-dev";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function DevWipeCatalogs() {
  const [loading, setLoading] = useState(false);

  const handleWipe = async () => {
    if (process.env.NODE_ENV !== "development") {
      const confirm = window.confirm("WARNING: You are about to DELETE ALL DRUGS AND LAB TESTS. This action CANNOT BE UNDONE. Type 'DELETE' to confirm.");
      if (confirm !== true) return;
    } else {
      const confirm = window.confirm("Are you sure you want to delete all Pharmacy and Lab items from the database? This is for DEV use.");
      if (!confirm) return;
    }

    setLoading(true);
    try {
      const res = await wipeAllCatalogs();
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("All Pharmacy & Lab catalogs have been successfully deleted.");
        window.location.reload();
      }
    } catch (e: any) {
      toast.error("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-orange-50/50 dark:bg-orange-900/10 p-6 rounded-xl shadow-sm border border-orange-200 dark:border-orange-900/50 h-full flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-semibold text-orange-700 dark:text-orange-400 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Dev Tools: Wipe Catalogs
        </h3>
        <p className="text-sm text-orange-600 dark:text-orange-300 mt-2 opacity-90">
          This will instantly delete ALL Drugs and Lab Tests from the catalog database. Use this to reset the catalogs if an initial CSV import gets messed up.
        </p>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleWipe}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          {loading ? "Wiping Catalogs..." : "Delete All Catalogs"}
        </button>
      </div>
    </div>
  );
}
