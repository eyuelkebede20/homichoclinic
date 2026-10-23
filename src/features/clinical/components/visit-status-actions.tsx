"use client";

import { useState } from "react";
import { updateVisitStatus, completeVisitWithDiagnosis } from "../actions";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FinalDiagnosisModal } from "./final-diagnosis-modal";

export function VisitStatusActions({
  visitId,
  currentStatus,
  patientId,
  patientName = "Patient",
}: {
  visitId: string;
  currentStatus: string;
  patientId?: string;
  patientName?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const router = useRouter();

  async function update(status: "scheduled" | "in_progress" | "completed") {
    if (status === "completed" && patientId) {
      setShowDiagnosisModal(true);
      return;
    }

    setLoading(true);
    const res = await updateVisitStatus({ visitId, status });
    setLoading(false);
    if (res.error) toast.error(res.error);
    else {
      if (status === "in_progress" && patientId) {
        router.push(`/patients/${patientId}`);
      } else {
        router.refresh();
      }
    }
  }

  const handleConfirmDiagnosis = async (data: { finalDiagnosis: string; notes?: string }) => {
    if (!patientId) return;
    setLoading(true);
    const res = await completeVisitWithDiagnosis({
      visitId,
      patientId,
      finalDiagnosis: data.finalDiagnosis,
      notes: data.notes,
    });
    setLoading(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(`Visit completed with final diagnosis "${data.finalDiagnosis}".`);
      router.refresh();
    }
  };

  if (loading) return <Loader2 className="w-4 h-4 animate-spin inline-block text-slate-500" />;

  if (currentStatus === "scheduled") {
    return (
      <button
        onClick={() => update("in_progress")}
        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
      >
        Review Patient
      </button>
    );
  }

  if (currentStatus === "in_progress") {
    return (
      <>
        <button
          onClick={() => setShowDiagnosisModal(true)}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
          title="Mark patient as reviewed and record final diagnosis"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Mark as Reviewed
        </button>

        {showDiagnosisModal && (
          <FinalDiagnosisModal
            isOpen={showDiagnosisModal}
            onClose={() => setShowDiagnosisModal(false)}
            patientName={patientName}
            patientId={patientId || ""}
            title="Final Diagnosis & Conclude Consultation"
            confirmLabel="Save Diagnosis & Complete Review"
            onConfirm={handleConfirmDiagnosis}
          />
        )}
      </>
    );
  }

  return <span className="text-slate-400 text-xs">Done</span>;
}
