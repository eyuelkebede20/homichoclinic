"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  Search,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Package,
  ExternalLink,
  Ban,
  Pill,
  Filter,
  Check,
  RotateCcw,
  Loader2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { updateTemporaryDrugStock, setDrugOutOfStock } from "../actions";
import { importCatalogCSV } from "@/features/catalogs/actions-import";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface TrackedDrug {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
  description: string | null;
  price: number; // in cents
  initialStock: number | null; // Hamle stock
  amountInStock: number | null; // Current counted stock
  batchesCount: number;
}

export function TemporaryTrackingTable({ initialDrugs }: { initialDrugs: TrackedDrug[] }) {
  const router = useRouter();
  const [drugs, setDrugs] = useState<TrackedDrug[]>(initialDrugs);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "uncounted" | "instock" | "outofstock" | "discrepancy">("all");
  const [savingDrugId, setSavingDrugId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [, startTransition] = useTransition();

  // Summary statistics
  const stats = useMemo(() => {
    let uncounted = 0;
    let inStock = 0;
    let outOfStock = 0;
    let discrepancies = 0;

    drugs.forEach((d) => {
      if (d.amountInStock === null) {
        uncounted++;
      } else if (d.amountInStock === 0) {
        outOfStock++;
      } else {
        inStock++;
      }

      if (
        d.amountInStock !== null &&
        d.initialStock !== null &&
        d.amountInStock !== d.initialStock
      ) {
        discrepancies++;
      }
    });

    return {
      total: drugs.length,
      uncounted,
      inStock,
      outOfStock,
      discrepancies,
    };
  }, [drugs]);

  // Filtered drugs
  const filteredDrugs = useMemo(() => {
    return drugs.filter((drug) => {
      // Search match
      const q = search.trim().toLowerCase();
      if (q) {
        const matchName = drug.name.toLowerCase().includes(q);
        const matchCategory = (drug.category || "").toLowerCase().includes(q);
        if (!matchName && !matchCategory) return false;
      }

      // Filter Mode
      if (filterMode === "uncounted") {
        return drug.amountInStock === null;
      }
      if (filterMode === "instock") {
        return drug.amountInStock !== null && drug.amountInStock > 0;
      }
      if (filterMode === "outofstock") {
        return drug.amountInStock === 0;
      }
      if (filterMode === "discrepancy") {
        return (
          drug.amountInStock !== null &&
          drug.initialStock !== null &&
          drug.amountInStock !== drug.initialStock
        );
      }
      return true;
    });
  }, [drugs, search, filterMode]);

  // Handle direct stock input save
  async function handleSaveStock(drugId: string, customVal?: number) {
    const drug = drugs.find((d) => d.id === drugId);
    if (!drug) return;

    let targetCount: number | null = null;
    if (customVal !== undefined) {
      targetCount = customVal;
    } else {
      const raw = editingValues[drugId];
      if (raw === undefined || raw.trim() === "") {
        // Clear or keep unchanged
        return;
      }
      const parsed = parseInt(raw, 10);
      if (isNaN(parsed) || parsed < 0) {
        toast.error("Please enter a valid non-negative number.");
        return;
      }
      targetCount = parsed;
    }

    setSavingDrugId(drugId);

    // Optimistic UI update
    setDrugs((prev) =>
      prev.map((d) => (d.id === drugId ? { ...d, amountInStock: targetCount } : d))
    );

    try {
      const res = await updateTemporaryDrugStock({
        drugId,
        currentStock: targetCount,
      });

      if (res?.error) {
        toast.error(res.error);
        // Rollback
        setDrugs((prev) =>
          prev.map((d) => (d.id === drugId ? { ...d, amountInStock: drug.amountInStock } : d))
        );
      } else {
        toast.success(`Saved count for ${drug.name}: ${targetCount} units (in-stock synchronized)`);
        // Clear editing state for this drug
        setEditingValues((prev) => {
          const next = { ...prev };
          delete next[drugId];
          return next;
        });
        router.refresh();
      }
    } catch {
      toast.error("Failed to update stock quantity.");
      // Rollback
      setDrugs((prev) =>
        prev.map((d) => (d.id === drugId ? { ...d, amountInStock: drug.amountInStock } : d))
      );
    } finally {
      setSavingDrugId(null);
    }
  }

  // Handle Mark Out of Stock
  async function handleMarkOutOfStock(drugId: string) {
    const drug = drugs.find((d) => d.id === drugId);
    if (!drug) return;

    setSavingDrugId(drugId);
    // Optimistic UI
    setDrugs((prev) =>
      prev.map((d) => (d.id === drugId ? { ...d, amountInStock: 0 } : d))
    );

    try {
      const res = await setDrugOutOfStock({ drugId });
      if (res?.error) {
        toast.error(res.error);
        // Rollback
        setDrugs((prev) =>
          prev.map((d) => (d.id === drugId ? { ...d, amountInStock: drug.amountInStock } : d))
        );
      } else {
        toast.success(`Marked ${drug.name} as Out of Stock (0 units).`);
        router.refresh();
      }
    } catch {
      toast.error("Failed to mark drug as out of stock.");
      setDrugs((prev) =>
        prev.map((d) => (d.id === drugId ? { ...d, amountInStock: drug.amountInStock } : d))
      );
    } finally {
      setSavingDrugId(null);
    }
  }

  // Handle Excel/CSV import right inside the tab
  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const toastId = toast.loading("Processing drug import...");

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

      const res = await importCatalogCSV({ csvText: text, type: "DRUG" });
      if (res?.error) {
        toast.error(res.error, { id: toastId });
      } else {
        toast.success(res?.data?.success || "Import completed successfully!", {
          id: toastId,
        });
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to import file.", {
        id: toastId,
      });
    } finally {
      setIsImporting(false);
      if (e.target) e.target.value = "";
    }
  }

  // Handle Export to Excel
  function handleExportExcel() {
    const rows = filteredDrugs.map((d, index) => {
      const initial = d.initialStock;
      const current = d.amountInStock;
      let varianceStr = "Not Counted";
      if (current !== null && initial !== null) {
        const diff = current - initial;
        varianceStr = diff > 0 ? `+${diff}` : `${diff}`;
      }

      let status = "Not Counted";
      if (current === 0) status = "Out of Stock";
      else if (current !== null && current > 0) status = "In Stock";

      return {
        "No.": index + 1,
        "Medicine Name": d.name,
        "Unit / Measuring Unit": d.unit || "N/A",
        "Category": d.category || "Uncategorized",
        "Initial in Stock (Hamle)": initial !== null ? initial : "N/A",
        "Current in Stock": current !== null ? current : "Empty",
        "Variance / Discrepancy": varianceStr,
        "Status": status,
        "Unit Price (ETB)": (d.price / 100).toFixed(2),
        "Description": d.description || "",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Temporary Tracking");

    // Auto-fit column widths
    const maxCols = [
      { wch: 6 },
      { wch: 35 },
      { wch: 22 },
      { wch: 18 },
      { wch: 24 },
      { wch: 18 },
      { wch: 22 },
      { wch: 16 },
      { wch: 16 },
      { wch: 25 },
    ];
    worksheet["!cols"] = maxCols;

    const dateStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `Hamle_Medicine_Tracking_${dateStr}.xlsx`);
    toast.success("Excel sheet exported successfully!");
  }

  return (
    <div className="space-y-6">
      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          onClick={() => setFilterMode("all")}
          className={`p-4 rounded-xl border text-left transition-all ${
            filterMode === "all"
              ? "bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 shadow-sm ring-2 ring-blue-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">All Medicines</span>
            <Package className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {stats.total}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Total in registry</p>
        </button>

        <button
          onClick={() => setFilterMode("uncounted")}
          className={`p-4 rounded-xl border text-left transition-all ${
            filterMode === "uncounted"
              ? "bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 shadow-sm ring-2 ring-amber-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Needs Count</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {stats.uncounted}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Empty current stock</p>
        </button>

        <button
          onClick={() => setFilterMode("instock")}
          className={`p-4 rounded-xl border text-left transition-all ${
            filterMode === "instock"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 shadow-sm ring-2 ring-emerald-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-xs font-semibold uppercase tracking-wider">In Stock</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.inStock}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Physical count &gt; 0</p>
        </button>

        <button
          onClick={() => setFilterMode("outofstock")}
          className={`p-4 rounded-xl border text-left transition-all ${
            filterMode === "outofstock"
              ? "bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600 shadow-sm ring-2 ring-rose-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Out of Stock</span>
            <Ban className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {stats.outOfStock}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Count set to 0</p>
        </button>

        <button
          onClick={() => setFilterMode("discrepancy")}
          className={`p-4 rounded-xl border text-left transition-all col-span-2 sm:col-span-1 ${
            filterMode === "discrepancy"
              ? "bg-purple-50 dark:bg-purple-950/40 border-purple-400 dark:border-purple-600 shadow-sm ring-2 ring-purple-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Discrepancy</span>
            <TrendingDown className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {stats.discrepancies}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Current != Initial</p>
        </button>
      </div>

      {/* ── Table Controls Bar ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search medicine name or category…"
            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-inner"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Import Button */}
          <div className="relative">
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={handleImportFile}
              disabled={isImporting}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              title="Upload Hamle Stock Excel or CSV"
            />
            <button
              disabled={isImporting}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700 disabled:opacity-50"
            >
              {isImporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5 text-blue-500" />
              )}
              {isImporting ? "Importing…" : "Import Hamle Stock"}
            </button>
          </div>

          {/* Download Hamle Template (Excel) */}
          <a
            href="/api/export/catalog?type=drug&format=xlsx"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
            title="Download Excel template containing all registered drugs with hamle-input column"
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            Download Hamle Template
          </a>

          {/* Export to Excel */}
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            Export Excel
          </button>

          {/* Catalog Stocking Link */}
          <Link
            href="/pharmacy/catalog"
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Package className="w-3.5 h-3.5" />
            Full Stock Registry
            <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
          </Link>
        </div>
      </div>

      {/* ── Filter Pills ── */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-slate-400 font-medium flex items-center gap-1 mr-1">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        {[
          { id: "all", label: "All Items", count: stats.total },
          { id: "uncounted", label: "Needs Count", count: stats.uncounted },
          { id: "instock", label: "In Stock", count: stats.inStock },
          { id: "outofstock", label: "Out of Stock", count: stats.outOfStock },
          { id: "discrepancy", label: "Discrepancy", count: stats.discrepancies },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterMode(f.id as typeof filterMode)}
            className={`px-3 py-1 rounded-full font-medium transition-colors ${
              filterMode === f.id
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3.5">Medicine Name</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5 text-center">Unit</th>
                <th className="px-4 py-3.5 text-center">Initial in Stock (Hamle)</th>
                <th className="px-4 py-3.5 text-center">Current in Stock</th>
                <th className="px-4 py-3.5 text-center">Variance</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDrugs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Pill className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p className="font-medium text-slate-600 dark:text-slate-400">
                        No medicines match your search or filter.
                      </p>
                      {search && (
                        <button
                          onClick={() => setSearch("")}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Clear search filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDrugs.map((drug) => {
                  const initial = drug.initialStock;
                  const current = drug.amountInStock;
                  const isSaving = savingDrugId === drug.id;
                  const editValue = editingValues[drug.id];
                  const hasDraft = editValue !== undefined;

                  let variance: number | null = null;
                  if (current !== null && initial !== null) {
                    variance = current - initial;
                  }

                  return (
                    <tr
                      key={drug.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* 1. Medicine Name */}
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 max-w-xs">
                        <div className="flex items-center gap-2">
                          <Pill className="w-4 h-4 text-blue-500 shrink-0" />
                          <div>
                            <span className="font-semibold text-sm leading-tight block">
                              {drug.name}
                            </span>
                            {drug.description && (
                              <span className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1">
                                {drug.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Category */}
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                        {drug.category ? (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium">
                            {drug.category}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 italic">—</span>
                        )}
                      </td>

                      {/* 3. Measuring Unit */}
                      <td className="px-4 py-3 text-center text-xs">
                        {drug.unit ? (
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 font-semibold font-mono">
                            {drug.unit}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 italic">—</span>
                        )}
                      </td>

                      {/* 4. Initial in Stock (Hamle Month Baseline) */}
                      <td className="px-4 py-3 text-center">
                        {initial !== null ? (
                          <span className="inline-flex items-center justify-center font-bold font-mono text-sm px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {initial.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Not in import</span>
                        )}
                      </td>

                      {/* 4. Current in Stock (Editable Input & Direct Save) */}
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center justify-center gap-1">
                          <div className="relative">
                            <input
                              type="number"
                              min={0}
                              placeholder={current !== null ? String(current) : "Empty"}
                              value={hasDraft ? editValue : current !== null ? current : ""}
                              disabled={isSaving}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditingValues((prev) => ({
                                  ...prev,
                                  [drug.id]: val,
                                }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleSaveStock(drug.id);
                                }
                              }}
                              className={`w-24 px-2.5 py-1.5 text-center font-bold font-mono text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                current === null
                                  ? "bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 placeholder-amber-400"
                                  : current === 0
                                  ? "bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300"
                                  : "bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                              }`}
                            />
                            {isSaving && (
                              <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                              </div>
                            )}
                          </div>

                          {/* Save checkmark button if draft is present */}
                          {hasDraft && editValue !== "" && (
                            <button
                              onClick={() => handleSaveStock(drug.id)}
                              disabled={isSaving}
                              title="Save Count (or press Enter)"
                              className="p-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 5. Variance / Discrepancy */}
                      <td className="px-4 py-3 text-center">
                        {variance !== null ? (
                          variance === 0 ? (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              0 (Match)
                            </span>
                          ) : variance < 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300">
                              <TrendingDown className="w-3 h-3" />
                              {variance}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                              <TrendingUp className="w-3 h-3" />
                              +{variance}
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-slate-300 dark:text-slate-600 italic">
                            —
                          </span>
                        )}
                      </td>

                      {/* 6. Status Badge */}
                      <td className="px-4 py-3 text-center">
                        {current === null ? (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            Uncounted
                          </span>
                        ) : current === 0 ? (
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 inline-flex items-center gap-1">
                            <Ban className="w-3 h-3" />
                            Out of Stock
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            In Stock
                          </span>
                        )}
                      </td>

                      {/* 7. Action Buttons */}
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {/* Out of Stock Button */}
                          <button
                            onClick={() => handleMarkOutOfStock(drug.id)}
                            disabled={isSaving || current === 0}
                            title="Mark Out of Stock (sets quantity to 0)"
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                          >
                            <Ban className="w-3 h-3" />
                            Out of Stock
                          </button>

                          {/* Stock Button (Routes to catalog stocking flow) */}
                          <Link
                            href={`/pharmacy/catalog?q=${encodeURIComponent(drug.name)}`}
                            title={`Add stock / batches for ${drug.name}`}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 transition-colors flex items-center gap-1"
                          >
                            <Package className="w-3 h-3" />
                            Stock
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
