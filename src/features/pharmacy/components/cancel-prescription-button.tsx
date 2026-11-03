"use client";

import { useState } from "react";
import { cancelPrescription } from "../actions";
import { XCircle, Loader2 } from "lucide-react";
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
      className="inline-flex items-center justify-center p-2 rounded border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
      title="Cancel/Reject Prescription"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
    </button>
  );
}
