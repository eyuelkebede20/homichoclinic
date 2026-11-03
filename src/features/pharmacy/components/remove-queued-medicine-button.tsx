"use client";

import { useState } from "react";
import { deletePrescriptionItem } from "../actions";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function RemoveQueuedMedicineButton({
  itemId,
  drugName,
  className,
}: {
  itemId: string;
  drugName?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();

    const name = drugName || "this medicine";
    if (!confirm(`Are you sure you want to remove "${name}" from the queue before it is dispensed?`)) {
      return;
    }

    setLoading(true);
    const res = await deletePrescriptionItem({ itemId });
    setLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`"${name}" removed from queue.`);
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={loading}
      className={
        className ||
        "p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-50"
      }
      title={drugName ? `Remove ${drugName} before dispensing` : "Remove medicine before dispensing"}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
      ) : (
        <X className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
