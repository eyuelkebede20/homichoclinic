"use client";

import { useState } from "react";
import { triggerSystemUpdate } from "@/features/admin/actions";
import { DownloadCloud, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export function SystemUpdater() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: "error" | "success" | null, message: string }>({ type: null, message: "" });

  const handleUpdate = async () => {
    if (!confirm("Are you sure you want to pull the latest updates? If the system crashes, you may need to restart the server manually.")) return;
    
    setLoading(true);
    setResult({ type: null, message: "" });
    try {
      const res = await triggerSystemUpdate({});
      if (res?.data) {
        setResult({ type: "success", message: res.data.message || "Update successful!" });
      } else {
        setResult({ type: "error", message: res?.error || "Unknown error occurred" });
      }
    } catch (error: any) {
      setResult({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/60 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-sm h-full">
      <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
        <DownloadCloud className="h-6 w-6 text-blue-600 dark:text-blue-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">System Update</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
        Pull the latest code from the remote repository. Ensure you have backed up your database before proceeding.
      </p>

      {result.type && (
        <div className={`w-full text-left p-3 rounded-md mb-4 text-xs font-mono overflow-auto max-h-32 ${result.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          <div className="flex items-center gap-2 mb-1 font-sans font-bold">
            {result.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {result.type === "error" ? "Update Failed" : "Update Completed"}
          </div>
          <pre className="whitespace-pre-wrap">{result.message}</pre>
        </div>
      )}

      <button
        onClick={handleUpdate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
        {loading ? "Updating..." : "Pull Latest Updates"}
      </button>
    </div>
  );
}
