"use client";

import { useState } from "react";
import { deletePrescription } from "../actions";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function DeletePrescriptionButton({ prescriptionId }: { prescriptionId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this prescription from the pharmacy queue?")) {
      return;
    }

    setLoading(true);
    const res = await deletePrescription({ prescriptionId });
    setLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Prescription deleted from pharmacy queue.");
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold transition-colors disabled:opacity-50"
      title="Delete Prescription from Queue"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Trash2 className="w-3.5 h-3.5" />
      )}
      <span>Delete</span>
    </button>
  );
}
