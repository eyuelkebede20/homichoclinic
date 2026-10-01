"use client";

import { useState } from "react";
import { submitLabResult } from "../actions";
import { Loader2 } from "lucide-react";

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
      alert(result.error);
    }
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded"
      >
        Enter Results
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-end gap-2 text-left bg-slate-50 p-3 rounded shadow-inner border border-slate-200 min-w-[250px]">
      <textarea
        required
        placeholder="Enter lab findings..."
        className="w-full text-sm rounded border-slate-300 p-2"
        rows={2}
        value={findings}
        onChange={e => setFindings(e.target.value)}
      />
      <div className="flex gap-2">
        <button 
          type="button" 
          onClick={() => setIsOpen(false)}
          className="text-xs text-slate-500 hover:text-slate-700 px-2"
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
