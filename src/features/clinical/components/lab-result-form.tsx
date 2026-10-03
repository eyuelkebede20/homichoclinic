"use client";

import { useState } from "react";
import { submitLabResult } from "../actions";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function LabResultForm({ requestId }: { requestId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [findings, setFindings] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await submitLabResult({
      requestId,
      findings,
    });

    setLoading(false);

    if (result.success) {
      setIsOpen(false);
    } else {
      toast.error(result.error);
    }
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded text-sm font-medium transition-colors"
      >
        Enter Results
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-end gap-2 text-left bg-slate-50 dark:bg-slate-800/50 p-3 rounded shadow-inner border border-slate-200 dark:border-slate-700 min-w-[250px] w-full">
      <textarea
        required
        placeholder="Enter lab findings..."
        className="w-full text-sm rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        rows={2}
        value={findings}
        onChange={e => setFindings(e.target.value)}
      />
      <div className="flex flex-wrap gap-1 w-full mt-1">
        {["Positive", "Negative", "Normal", "Abnormal", "Clear"].map(chip => (
          <button
            key={chip}
            type="button"
            onClick={() => setFindings(findings ? `${findings} ${chip}` : chip)}
            className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button 
          type="button" 
          onClick={() => setIsOpen(false)}
          className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-2 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 flex items-center"
        >
          {loading && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
          Submit
        </button>
      </div>
    </form>
  );
}
