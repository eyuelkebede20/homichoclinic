"use client";

import { useState } from "react";
import { importPatientsCSV } from "../actions-import";
import { Loader2, UploadCloud, AlertCircle, CheckCircle2 } from "lucide-react";
import * as XLSX from "xlsx";

export function PatientImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number; errors: string[] } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const text = XLSX.utils.sheet_to_csv(worksheet);

      const res = await importPatientsCSV({ csvText: text });
      
      if (res.error) {
        alert(res.error);
      } else if (res.data) {
        setResult(res.data);
      }
    } catch (err: any) {
      alert("Failed to read file: Please ensure it's a valid Excel or CSV file.");
    } finally {
      setLoading(false);
      setFile(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-indigo-500" />
            Bulk Import Patients & Families
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Upload an Excel (.xlsx) or CSV file containing staff members and their dependents.
          </p>
        </div>
        <a href="/sample.csv" download className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
          Download Sample File
        </a>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded text-sm text-indigo-800 dark:text-indigo-300 mb-6">
        <p className="font-medium mb-1">Standard Columns (All Optional):</p>
        <code className="bg-white/50 dark:bg-black/20 px-2 py-1 rounded text-xs">FirstName, LastName</code>
        
        <p className="font-medium mt-3 mb-1">Additional Columns (All Optional):</p>
        <code className="bg-white/50 dark:bg-black/20 px-2 py-1 rounded text-xs leading-loose">
          Phone, DateOfBirth, Gender, Discount, Relationship, PrimaryPhone
        </code>
        
        <p className="mt-3 text-xs opacity-90">
          <strong>Tip:</strong> If importing families, set the staff member&apos;s <code className="px-1">Phone</code>. Then for their spouse/child, set <code className="px-1">Relationship</code> (e.g. &quot;Child&quot;) and put the staff member&apos;s phone number in <code className="px-1">PrimaryPhone</code>. The system will automatically link them!
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <input 
          type="file" 
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-500 dark:text-slate-400
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-indigo-50 file:text-indigo-700
            dark:file:bg-indigo-900/30 dark:file:text-indigo-400
            hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50
            cursor-pointer"
        />
        
        <button
          onClick={handleImport}
          disabled={!file || loading}
          className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Import"}
        </button>
      </div>

      {result && (
        <div className="mt-6 p-4 rounded border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
          <h4 className="flex items-center gap-2 font-semibold text-green-800 dark:text-green-400">
            <CheckCircle2 className="w-5 h-5" />
            Import Complete
          </h4>
          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
            Successfully imported <strong>{result.created}</strong> new patients.
          </p>
          
          {result.errors.length > 0 && (
            <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800/50">
              <h5 className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-500 mb-2">
                <AlertCircle className="w-4 h-4" />
                Warnings ({result.errors.length})
              </h5>
              <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1 max-h-32 overflow-y-auto list-disc pl-5">
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
