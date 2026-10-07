"use client";

import { useState } from "react";
import { approvePatient } from "../actions";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";

export function PendingApprovalBanner({ patientId, canApprove }: { patientId: string, canApprove: boolean }) {
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      const result = await approvePatient({ patientId });
      if (result.success) {
        toast.success("Patient registration approved.");
      } else {
        toast.error(result.error || "Failed to approve.");
      }
    } catch (e) {
      toast.error("Failed to approve.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-start sm:items-center gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5 sm:mt-0 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-400">Pending Approval</h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300/80">This staff/family registration was marked with &quot;paperwork provided&quot; and awaits Manager/Admin approval.</p>
        </div>
      </div>
      {canApprove && (
        <button
          onClick={handleApprove}
          disabled={loading}
          className="flex items-center justify-center whitespace-nowrap bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Approve Registration
        </button>
      )}
    </div>
  );
}
