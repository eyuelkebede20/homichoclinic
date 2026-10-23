"use client";

import { useState, useEffect, useMemo } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  Search,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookOpen,
  Tag,
  Stethoscope,
  Filter
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { ClinicDisease, DEFAULT_CLINIC_DISEASES } from "@/features/clinical/types/diseases";
import {
  getClinicDiseases,
  addClinicDisease,
  importDiseasesCSV,
  resetClinicDiseasesToDefault,
  clearClinicDiseases,
  deleteClinicDisease
} from "@/features/clinical/actions";

export function DiseaseImporter({ initialDiseases }: { initialDiseases?: ClinicDisease[] }) {
  const [diseases, setDiseases] = useState<ClinicDisease[]>(initialDiseases || DEFAULT_CLINIC_DISEASES);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [importResult, setImportResult] = useState<{ created: number; updated: number; total: number; errors: string[] } | null>(null);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");

  // Single Add state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [newAmharic, setNewAmharic] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Load latest diseases on mount
  useEffect(() => {
    getClinicDiseases().then((list) => {
      if (list && list.length > 0) {
        setDiseases(list);
      }
    }).catch(console.error);
  }, []);

  // Filter diseases by search and category
  const filteredDiseases = useMemo(() => {
    return diseases.filter((d) => {
      if (selectedCategory !== "All" && d.category !== selectedCategory) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        d.name.toLowerCase().includes(q) ||
        (d.code || "").toLowerCase().includes(q) ||
        (d.category || "").toLowerCase().includes(q) ||
        (d.amharic || "").toLowerCase().includes(q)
      );
    });
  }, [diseases, selectedCategory, searchQuery]);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set<string>(["All"]);
    diseases.forEach((d) => {
      if (d.category) set.add(d.category);
    });
    return Array.from(set);
  }, [diseases]);

  // Download template with "disease code" and "diseasename" columns
  const handleDownloadTemplate = () => {
    const csvContent =
      "disease code,diseasename,category,amharic\n" +
      "A09,Acute Gastroenteritis (AGE),Gastrointestinal,አጣዳፊ የተቅማጥና ማስመለስ በሽታ\n" +
      "A01.0,Typhoid Fever,Gastrointestinal,የታይፎይድ ትኩሳት\n" +
      "J18.9,Pneumonia,Respiratory,የሳንባ ምች\n" +
      "J06.9,Acute Upper Respiratory Tract Infection (URTI),Respiratory,የላይኛው የመተንፈሻ አካል ኢንፌክሽን\n" +
      "I10,Essential Hypertension,Cardiovascular,የደም ግፊት በሽታ\n" +
      "E11.9,Type 2 Diabetes Mellitus,Endocrine,ዓይነት 2 የስኳር በሽታ\n" +
      "K27.9,Peptic Ulcer Disease (PUD) / Gastritis,Gastrointestinal,የጨጓራ ቁስለት / የጨጓራ ህመም\n" +
      "B54,Malaria,Infectious,የወባ በሽታ\n" +
      "N39.0,Urinary Tract Infection (UTI),Infectious,የሽንት ቧንቧ ኢንፌክሽን\n" +
      "M54.5,Musculoskeletal Strain / Low Back Pain,Musculoskeletal,የጡንቻና የወገብ / የጀርባ ህመም\n" +
      "L23.9,Allergic Dermatitis / Eczema,Dermatology,የቆዳ አለርጂ\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "disease_catalog_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Downloaded sample template with 'disease code' and 'diseasename' columns.");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please choose a file to import.");
      return;
    }

    setLoading(true);
    setImportResult(null);

    try {
      let text = "";
      if (file.name.toLowerCase().endsWith(".csv")) {
        text = await file.text();
      } else {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        text = XLSX.utils.sheet_to_csv(worksheet);
      }

      const res = await importDiseasesCSV({ csvText: text, mode: importMode });

      if (res.error) {
        toast.error(res.error);
      } else if (res.data) {
        setImportResult(res.data);
        toast.success(`Successfully imported ${res.data.created} new diseases (Total: ${res.data.total})`);
        const updatedList = await getClinicDiseases();
        setDiseases(updatedList);
      }
    } catch (err: any) {
      console.error("Import error:", err);
      toast.error("Failed to parse file: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
      setFile(null);
    }
  };

  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error("Disease name is required.");
      return;
    }

    setAddLoading(true);
    try {
      const res = await addClinicDisease({
        name: newName.trim(),
        code: newCode.trim() || undefined,
        category: newCategory.trim() || "General",
        amharic: newAmharic.trim() || undefined
      });

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`Added "${newName}" to disease catalog!`);
        if (res?.data?.diseases) {
          setDiseases(res.data.diseases);
        }
        setNewName("");
        setNewCode("");
        setNewAmharic("");
        setShowAddForm(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add disease");
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteDisease = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the clinic catalog?`)) return;
    try {
      const res = await deleteClinicDisease({ id });
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`Removed "${name}" from catalog.`);
        setDiseases((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const handleResetToDefault = async () => {
    if (!confirm("Reset clinic disease catalog to the prebuilt standard list (40+ Ethiopian clinic diagnoses)?")) return;
    setLoading(true);
    try {
      const res = await resetClinicDiseasesToDefault({});
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`Reset catalog to standard prebuilt list (${res?.data?.count} diseases).`);
        const updated = await getClinicDiseases();
        setDiseases(updated);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to reset");
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("DANGER: Are you sure you want to wipe ALL diseases from the catalog? This cannot be undone.")) return;
    setLoading(true);
    try {
      const res = await clearClinicDiseases({});
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Clinic disease catalog cleared.");
        setDiseases([]);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to clear");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ──────────────────────────────────────────────────────────── */}
      {/* 1. TOP BANNER & IMPORT CARD                                  */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Disease Catalog & Importer
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 font-bold">
                  {diseases.length} Diseases
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Import prebuilt disease lists with <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-indigo-600 font-bold">&quot;disease code&quot;</code> and <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-indigo-600 font-bold">&quot;diseasename&quot;</code> columns.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              Download Template (.csv)
            </button>

            <button
              onClick={() => setShowAddForm((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Single Disease
            </button>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Upload Excel (.xlsx, .xls) or CSV
            </label>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors bg-slate-50/50 dark:bg-slate-950/40">
              <UploadCloud className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {file ? file.name : "Click to select or drag and drop an Excel or CSV file"}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Must include columns: <strong className="text-indigo-600">disease code</strong> and <strong className="text-indigo-600">diseasename</strong>
              </p>
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileChange}
                className="mt-3 block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-semibold">Import Mode:</span>
                <label className="inline-flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="merge"
                    checked={importMode === "merge"}
                    onChange={() => setImportMode("merge")}
                    className="text-indigo-600"
                  />
                  <span>Merge & Append</span>
                </label>
                <label className="inline-flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === "replace"}
                    onChange={() => setImportMode("replace")}
                    className="text-indigo-600"
                  />
                  <span>Replace Entire Catalog</span>
                </label>
              </div>

              <button
                onClick={handleImport}
                disabled={loading || !file}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-sm transition-all"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                Import Prebuilt Disease List
              </button>
            </div>

            {importResult && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl space-y-1 text-xs">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Import Completed Successfully
                </div>
                <p className="text-slate-700 dark:text-slate-300">
                  Added <strong>{importResult.created}</strong> new diseases, updated <strong>{importResult.updated}</strong> existing. Total catalog now has <strong>{importResult.total}</strong> diseases.
                </p>
                {importResult.errors && importResult.errors.length > 0 && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    {importResult.errors.length} warnings/skipped rows.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Quick Management Shortcuts */}
          <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Catalog Actions & Presets
              </h3>
              <p className="text-[11px] text-slate-500 mb-4">
                Restore the default standard list of 40+ common clinic diagnoses (WHO/ICD-10) or reset the catalog.
              </p>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl transition-colors shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                  Restore Standard Prebuilt Catalog
                </button>

                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 rounded-xl transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Wipe Entire Catalog
                </button>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-3">
              Standard columns: <strong>disease code</strong>, <strong>diseasename</strong>
            </div>
          </div>
        </div>

        {/* Single Add Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddSingle}
            className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl space-y-3 animate-in slide-in-from-top-2 duration-150"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                Add Single Disease to Catalog
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                ✕ Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Disease Code (e.g., A09)
                </label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="e.g. A09, J18.9"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Disease Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Acute Gastroenteritis"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Gastrointestinal"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <input
                type="text"
                value={newAmharic}
                onChange={(e) => setNewAmharic(e.target.value)}
                placeholder="Amharic Translation (optional, e.g., አጣዳፊ የተቅማጥና ማስመለስ በሽታ)"
                className="max-w-md px-3 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 font-amharic"
              />

              <button
                type="submit"
                disabled={addLoading || !newName.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-xs"
              >
                {addLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Save Disease
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 2. LIVE CATALOG DIRECTORY & SEARCH TABLE                     */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Live Disease Directory
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
              {filteredDiseases.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <div className="flex items-center gap-1 overflow-x-auto text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search code or disease name..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 border-b border-slate-200 dark:border-slate-800">
              <tr className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="p-3 w-12 text-center">#</th>
                <th className="p-3 w-32">Disease Code</th>
                <th className="p-3">Disease Name (Generalized Diagnosis)</th>
                <th className="p-3">Category</th>
                <th className="p-3">Amharic Translation</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {filteredDiseases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No diseases found matching &ldquo;{searchQuery}&rdquo;.
                  </td>
                </tr>
              ) : (
                filteredDiseases.map((d, index) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 text-center font-mono text-slate-400 text-[11px]">
                      {index + 1}
                    </td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-700">
                        {d.code || "—"}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                      {d.name}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                        {d.category || "General"}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 font-amharic text-[11px]">
                      {d.amharic || "—"}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteDisease(d.id, d.name)}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded transition-colors"
                        title="Remove from catalog"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
