"use client";

import { useState } from "react";
import { updateVisitStatus } from "../actions";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function VisitStatusActions({ visitId, currentStatus, patientId }: { visitId: string, currentStatus: string, patientId?: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function update(status: "scheduled" | "in_progress" | "completed") {
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

  if (loading) return <Loader2 className="w-4 h-4 animate-spin inline-block text-slate-500" />;

  if (currentStatus === "scheduled") {
    return (
      <button onClick={() => update("in_progress")} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors shadow-sm">
        Review Patient
      </button>
    );
  }
  if (currentStatus === "in_progress") {
    return (
      <button onClick={() => update("completed")} className="text-green-600 hover:text-green-900 text-xs font-medium border border-green-600 px-2 py-1 rounded">
        Mark Complete
      </button>
    );
  }

  return <span className="text-slate-400 text-xs">Done</span>;
}
