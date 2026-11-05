"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { updateVisitStatus } from "../actions";
import { toast } from "sonner";

export function CancelVisitButton({ visitId }: { visitId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleCancel(e: React.MouseEvent) {
    e.preventDefault(); // Prevent link navigation if inside a link, but we'll move it outside anyway
    if (!confirm("Are you sure you want to remove this patient from the queue?")) return;
    
    setLoading(true);
    const res = await updateVisitStatus({ visitId: visitId, status: "cancelled" });
    setLoading(false);
    
    if (res?.error) {
      toast.error(res.error);
    }
  }

  return (
    <button 
      onClick={handleCancel}
      disabled={loading}
      className="p-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:text-rose-300 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 rounded transition-colors disabled:opacity-50"
      title="Remove from Queue"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
    </button>
  );
}
