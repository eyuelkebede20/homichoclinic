"use client";

import { useState } from "react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { wipeAllMedicines, wipeAllLabTests } from "@/features/admin/actions-dev";
import { toast } from "sonner";

export function WipeCatalogButton({ type }: { type: "DRUG" | "LAB_TEST" }) {
  const [loading, setLoading] = useState(false);
  const isDrug = type === "DRUG";

  const handleWipe = async () => {
    const itemName = isDrug ? "all medicines and inventory batches" : "all laboratory tests";
    const confirm = window.confirm(
      `WARNING: Are you sure you want to DELETE ${itemName} from the catalog? This action CANNOT be undone.`
    );
    if (!confirm) return;

    setLoading(true);
    try {
      const res = isDrug ? await wipeAllMedicines() : await wipeAllLabTests();
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`Successfully deleted ${itemName}.`);
        window.location.reload();
      }
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleWipe}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50"
      title={`Delete all ${isDrug ? "medicines" : "lab tests"} from the database`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
      ) : (
        <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
      )}
      <span>{isDrug ? "Delete All Medicines" : "Delete All Lab Tests"}</span>
    </button>
  );
}
