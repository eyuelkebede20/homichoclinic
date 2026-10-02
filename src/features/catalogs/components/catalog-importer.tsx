/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { importCatalogCSV } from "../actions-import";
import { Upload, Loader2, Download } from "lucide-react";
import * as XLSX from "xlsx";

export function CatalogImporter({ type }: { type: "DRUG" | "LAB_TEST" }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const downloadType = type === "DRUG" ? "drug" : "lab";

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let text = "";
      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        text = XLSX.utils.sheet_to_csv(worksheet);
      } else {
        text = await file.text();
      }

      const res = await importCatalogCSV({ csvText: text, type });
      if (res?.error) {
        setError(res.error);
      } else if (res?.data?.success) {
        setSuccess(res.data.success);
      } else {
        setSuccess("Imported successfully.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to import");
    } finally {
      setLoading(false);
      // Reset input
      e.target.value = "";
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <a 
        href={`/api/export/catalog?type=${downloadType}`}
        className="px-4 py-2 bg-slate-800 text-white font-medium rounded hover:bg-slate-700 shadow-sm text-sm flex items-center justify-center transition-colors"
      >
        <Download className="w-4 h-4 mr-2" />
        Download Template/Data
      </a>

      <div className="relative">
        <input
          type="file"
          accept=".csv, .xlsx, .xls"
          onChange={handleFileChange}
          disabled={loading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          title="Upload CSV to update or import catalog"
        />
        <button
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 shadow-sm text-sm flex items-center justify-center disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          {loading ? "Importing..." : "Import CSV / Excel"}
        </button>
      </div>

      {error && <div className="text-red-500 text-sm flex items-center">{error}</div>}
      {success && <div className="text-green-500 text-sm flex items-center">{success}</div>}
    </div>
  );
}
