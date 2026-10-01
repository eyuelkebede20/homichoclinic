"use client";

import { useState } from "react";
import { updateVisitStatus } from "../actions";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function VisitStatusActions({ visitId, currentStatus }: { visitId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function update(status: "scheduled" | "in_progress" | "completed") {
    setLoading(true);
    const res = await updateVisitStatus({ visitId, status });
    setLoading(false);
    if (res.error) alert(res.error);
    else router.refresh();
  }

  if (loading) return <Loader2 className="w-4 h-4 animate-spin inline-block text-slate-500" />;

  if (currentStatus === "scheduled") {
    return (
      <button onClick={() => update("in_progress")} className="text-blue-600 hover:text-blue-900 text-xs font-medium border border-blue-600 px-2 py-1 rounded">
        Check-In
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
