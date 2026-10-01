"use client";

import { useState } from "react";
import { cancelPrescription } from "../actions";
import { XCircle, Loader2 } from "lucide-react";

export function CancelPrescriptionButton({ prescriptionId }: { prescriptionId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel/reject this prescription?")) return;
    setLoading(true);
    const res = await cancelPrescription({ prescriptionId });
    setLoading(false);
    if (res.error) alert(res.error);
  }

  return (
    <button 
      onClick={handleCancel}
      disabled={loading}
      className="inline-flex items-center justify-center p-2 rounded border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
      title="Cancel/Reject Prescription"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
    </button>
  );
}
