"use client";

import { useState } from "react";
import { cancelPrescription } from "../actions";
import { RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CancelPrescriptionButton({ prescriptionId }: { prescriptionId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    const reason = prompt("Enter reason for returning this prescription back to the doctor (e.g. Wrong dosage, Drug interaction, Out of stock):");
    if (reason === null) return; // User cancelled prompt
    
    setLoading(true);
    const res = await cancelPrescription({ 
      prescriptionId,
      reason: reason.trim() || "Wrong medication / dosage specified by doctor"
    });
    setLoading(false);
    if (res.error) toast.error(res.error);
    else toast.success("Prescription returned back to doctor with reason.");
  }

  return (
    <button 
      onClick={handleCancel}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/40 text-xs font-semibold transition-colors disabled:opacity-50"
      title="Return Prescription to Doctor with Reason"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
      <span>Return</span>
    </button>
  );
}
