"use client";

import { useState } from "react";
import { Database, Zap, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function DevSeedDatabase() {
  const [loading, setLoading] = useState(false);
  const [diseaseLoading, setDiseaseLoading] = useState(false);

  const handleSeed = async () => {
    const confirm = window.confirm("This will create default test accounts (admin, doctor, etc), core lab tests, and 220+ clinic diseases. Continue?");
    if (!confirm) return;

    setLoading(true);
    try {
      const res = await fetch("/api/seed-db");
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.error || "Failed to seed database.");
      }
    } catch (e: any) {
      toast.error("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDiseases = async () => {
    setDiseaseLoading(true);
    try {
      const res = await fetch("/api/seed-diseases");
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.error || "Failed to seed diseases.");
      }
    } catch (e: any) {
      toast.error("Error: " + e.message);
    } finally {
      setDiseaseLoading(false);
    }
  };

  return (
    <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-6 rounded-xl shadow-sm border border-emerald-200 dark:border-emerald-900/50 h-full flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Dev Tools: Seed DB & Diseases
        </h3>
        <p className="text-sm text-emerald-600 dark:text-emerald-300 mt-2 opacity-90">
          Quickly inject default staff accounts (admin, doctor, etc), core lab tests, and 220+ standardized clinical diagnoses. You can also visit <code className="px-1 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 font-mono text-xs">/seed-diseases</code> directly in your browser.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 justify-end">
        <button
          onClick={handleSeedDiseases}
          disabled={diseaseLoading || loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 text-xs font-bold rounded focus:outline-none disabled:opacity-50 transition-colors"
        >
          {diseaseLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-emerald-600" />}
          <span>Seed 220+ Diseases</span>
        </button>

        <button
          onClick={handleSeed}
          disabled={loading || diseaseLoading}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {loading ? "Seeding..." : "Seed Database Now"}
        </button>
      </div>
    </div>
  );
}
