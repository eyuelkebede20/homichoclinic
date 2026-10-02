"use client";

import { Download } from "lucide-react";

export function DatabaseBackupButton() {
  return (
    <div className="bg-white dark:bg-slate-900 shadow rounded-lg border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full flex items-center justify-center mb-4">
        <Download className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Database Backup</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-1">
        Download a complete SQL backup of the clinic database. Safe to run at any time.
      </p>
      
      <a 
        href="/api/backup" 
        download
        className="w-full inline-flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded transition-colors"
      >
        <Download className="w-4 h-4" />
        Download Backup
      </a>
    </div>
  );
}
