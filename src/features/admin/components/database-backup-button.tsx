"use client";

import { Download, Upload, Loader2, AlertTriangle } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

export function DatabaseBackupButton() {
  const [restoring, setRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("WARNING: Restoring a database backup may overwrite existing data and cause irreversible changes. Are you absolutely sure you want to proceed?")) {
      e.target.value = "";
      return;
    }

    setRestoring(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/backup/restore", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success("Database restored successfully!");
      } else {
        const errorText = await res.text();
        toast.error(`Restore failed: ${errorText}`);
      }
    } catch (error: any) {
      toast.error(`Restore failed: ${error.message}`);
    } finally {
      setRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900/50 shadow-sm rounded-xl border border-slate-200 dark:border-slate-800/60 p-6 flex flex-col items-center justify-center text-center h-full">
      <div className="w-12 h-12 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full flex items-center justify-center mb-4">
        <Download className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Database Backup</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-1">
        Download a complete SQL backup of the clinic database, or restore an existing backup.
      </p>
      
      <div className="flex w-full gap-3">
        <a 
          href="/api/backup" 
          download
          className="flex-1 inline-flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded transition-colors text-sm"
        >
          <Download className="w-4 h-4" />
          Export
        </a>
        
        <div className="flex-1 relative">
          <input 
            type="file" 
            accept=".sql"
            ref={fileInputRef}
            onChange={handleRestore}
            disabled={restoring}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            title="Import an SQL Backup"
          />
          <button 
            disabled={restoring}
            className="w-full inline-flex justify-center items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 rounded transition-colors disabled:opacity-50 text-sm"
          >
            {restoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {restoring ? "Restoring..." : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
