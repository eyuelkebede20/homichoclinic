"use client";

import { useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { importPatientsFromCSV } from "../actions-import";

export function CsvUploader({ userId, role }: { userId: string, role: string }) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    
    try {
      const text = await file.text();
      const res = await importPatientsFromCSV(text, userId, role);
      if (res.error) {
        alert(res.error);
      } else {
        alert(res.success);
        setFile(null); // reset
      }
    } catch (err) {
      alert("Failed to read file.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleUpload} className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-6">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Upload CSV File</h3>
      
      <div className="flex items-center gap-4">
        <input 
          type="file" 
          accept=".csv" 
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300
            cursor-pointer border border-slate-200 dark:border-slate-800 rounded-md
          "
        />
        
        <button 
          type="submit" 
          disabled={!file || loading}
          className="whitespace-nowrap px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center shadow-sm"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Upload className="w-5 h-5 mr-2" />
          )}
          {loading ? "Importing..." : "Start Import"}
        </button>
      </div>
    </form>
  );
}
