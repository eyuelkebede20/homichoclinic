"use client";

import { Download, Upload, Loader2, Database, ShieldCheck, ChevronDown } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

export function DatabaseBackupButton() {
  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async (format: "sql.gz" | "backup" | "sql" = "sql.gz") => {
    setShowFormatMenu(false);
    setExporting(true);
    const toastId = toast.loading(`Generating database backup (${format})...`);

    try {
      const res = await fetch(`/api/backup?format=${format}`);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Backup generation failed.");
      }

      // Extract filename from Content-Disposition header if available
      const disposition = res.headers.get("content-disposition");
      let filename = `homichoclinic_backup.${format}`;
      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Backup downloaded: ${filename}`, { id: toastId });
    } catch (error: any) {
      toast.error(`Export failed: ${error.message}`, { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmed = confirm(
      `WARNING: Restoring a database backup replaces the current database data.\n\n` +
      `File: ${file.name}\n` +
      `Size: ${(file.size / 1024).toFixed(1)} KB\n\n` +
      `The system will restore the data and automatically reconcile the schema to match the current application version.\n\n` +
      `Are you absolutely sure you want to proceed?`
    );

    if (!confirmed) {
      e.target.value = "";
      return;
    }

    setRestoring(true);
    const toastId = toast.loading("Restoring database and updating schema...");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/backup/restore", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        toast.success(
          data.message || "Database restored and reconciled successfully! Reloading in 2s...",
          { id: toastId, duration: 4000 }
        );
        setTimeout(() => {
          window.location.reload();
        }, 1800);
      } else {
        const errMsg = data?.error || (await res.text()) || "Restore failed.";
        toast.error(`Restore failed: ${errMsg}`, { id: toastId });
      }
    } catch (error: any) {
      toast.error(`Restore failed: ${error.message}`, { id: toastId });
    } finally {
      setRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900/50 shadow-sm rounded-xl border border-slate-200 dark:border-slate-800/60 p-6 flex flex-col items-center justify-center text-center h-full relative">
      <div className="w-12 h-12 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full flex items-center justify-center mb-3">
        <Database className="w-6 h-6" />
      </div>

      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Database Backup</h3>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-full">
          <ShieldCheck className="w-3 h-3" />
          Auto-Sync
        </span>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-sm flex-1">
        Export a complete database backup with version stamp, or restore from any <code className="text-indigo-600 dark:text-indigo-400">.sql.gz</code>, <code className="text-indigo-600 dark:text-indigo-400">.backup</code>, or <code className="text-indigo-600 dark:text-indigo-400">.sql</code> file. Restored backups automatically reconcile to the current schema.
      </p>

      <div className="flex w-full gap-2 relative">
        {/* Export Button Group */}
        <div className="flex-1 flex rounded-lg shadow-sm">
          <button
            type="button"
            onClick={() => handleExport("sql.gz")}
            disabled={exporting || restoring}
            className="flex-1 inline-flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium px-3 py-2 rounded-l-lg transition-colors text-xs"
            title="Export compressed SQL backup (.sql.gz - universally compatible across PostgreSQL versions)"
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {exporting ? "Dumping..." : "Export"}
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFormatMenu((prev) => !prev)}
              disabled={exporting || restoring}
              className="bg-indigo-700 hover:bg-indigo-800 text-white px-2 py-2 rounded-r-lg border-l border-indigo-500 flex items-center justify-center transition-colors text-xs"
              title="More export formats"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showFormatMenu && (
              <div className="absolute left-0 bottom-full mb-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 z-30 text-left text-xs">
                <button
                  type="button"
                  onClick={() => handleExport("sql.gz")}
                  className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex flex-col"
                >
                  <span className="font-semibold">Compressed SQL (.sql.gz)</span>
                  <span className="text-[10px] text-slate-500">Universal, compact, portable</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport("backup")}
                  className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex flex-col"
                >
                  <span className="font-semibold">Custom Binary (.backup)</span>
                  <span className="text-[10px] text-slate-500">PostgreSQL pg_restore format</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport("sql")}
                  className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex flex-col"
                >
                  <span className="font-semibold">Plain SQL (.sql)</span>
                  <span className="text-[10px] text-slate-500">Uncompressed text script</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Import Button */}
        <div className="flex-1 relative">
          <input
            type="file"
            accept=".backup,.sql,.gz,.sql.gz"
            ref={fileInputRef}
            onChange={handleRestore}
            disabled={exporting || restoring}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
            title="Import a Database Backup (.sql.gz, .backup, .sql)"
          />
          <button
            type="button"
            disabled={exporting || restoring}
            className="w-full inline-flex justify-center items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 text-xs"
          >
            {restoring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {restoring ? "Restoring..." : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
