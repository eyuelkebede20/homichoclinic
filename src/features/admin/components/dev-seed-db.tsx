"use client";

import { useState } from "react";
import { Database, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function DevSeedDatabase() {
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    const confirm = window.confirm("This will create default test accounts (admin, doctor, etc) and some basic catalog items if they do not exist. Continue?");
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

  return (
    <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-6 rounded-xl shadow-sm border border-emerald-200 dark:border-emerald-900/50 h-full flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Dev Tools: Seed Test Users
        </h3>
        <p className="text-sm text-emerald-600 dark:text-emerald-300 mt-2 opacity-90">
          This will quickly inject the default staff accounts (admin@clinic.com, doctor@clinic.com, etc) and default passwords into the database.
        </p>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSeed}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {loading ? "Seeding..." : "Seed Database Now"}
        </button>
      </div>
    </div>
  );
}
