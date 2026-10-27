"use client";

import { useState, useEffect, useRef } from "react";
import { wipeAllDiseases } from "../actions-dev";
import {
  addClinicDisease,
  importDiseasesCSV,
  resetClinicDiseasesToDefault,
  getClinicDiseases,
} from "@/features/clinical/actions";
import {
  Activity,
  Trash2,
  Plus,
  FileSpreadsheet,
  UploadCloud,
  RotateCcw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Pill,
  Download,
  X,
  Sparkles,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export function DevWipeDiseases() {
  const [loading, setLoading] = useState(false);
  const [diseaseCount, setDiseaseCount] = useState<number | null>(null);

  // Quick Add State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [newAmharic, setNewAmharic] = useState("");
  const [newMedicines, setNewMedicines] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Quick Import State
  const [showImportForm, setShowImportForm] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load count
  const refreshCount = async () => {
    try {
      const list = await getClinicDiseases();
      setDiseaseCount(Array.isArray(list) ? list.length : 0);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshCount();
  }, []);

  // 1. Wipe All Diseases
  const handleWipe = async () => {
    const confirm = window.confirm(
      "DANGER: Are you sure you want to DELETE ALL diseases and diagnoses from the catalog? This will leave the catalog completely empty (0 diseases)."
    );
    if (!confirm) return;

    setLoading(true);
    try {
      const res = await wipeAllDiseases();
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("All diseases have been wiped from the catalog.");
        setDiseaseCount(0);
        window.location.reload();
      }
    } catch (e: any) {
      toast.error("Error: " + (e.message || "Wipe failed"));
    } finally {
      setLoading(false);
    }
  };

  // 2. Restore Standard Defaults
  const handleRestoreDefault = async () => {
    if (!confirm("Restore standard prebuilt clinic catalog (40+ diagnoses)?")) return;
    setLoading(true);
    try {
      const res = await resetClinicDiseasesToDefault({});
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`Restored standard catalog (${res?.data?.count || 40} diagnoses).`);
        await refreshCount();
      }
    } catch (e: any) {
      toast.error("Error: " + (e.message || "Restore failed"));
    } finally {
      setLoading(false);
    }
  };

  // 3. Quick Add One Disease
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
        amharic: newAmharic.trim() || undefined,
        recommendedMedicines: newMedicines.trim() || undefined,
      });

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`Added "${newName}" to disease catalog!`);
        setNewName("");
        setNewCode("");
        setNewAmharic("");
        setNewMedicines("");
        setShowAddForm(false);
        await refreshCount();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add disease");
    } finally {
      setAddLoading(false);
    }
  };

  // 4. Quick Import Excel/CSV
  const handleImport = async () => {
    if (!importFile) {
      toast.error("Please choose an Excel or CSV file first.");
      return;
    }

    setImportLoading(true);
    try {
      let text = "";
      if (importFile.name.toLowerCase().endsWith(".csv")) {
        text = await importFile.text();
      } else {
        const buffer = await importFile.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error("Excel workbook contains no sheets.");
        }
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        text = XLSX.utils.sheet_to_csv(worksheet);
      }

      const res = await importDiseasesCSV({ csvText: text, mode: importMode });
      if (res?.error) {
        toast.error(res.error);
      } else if (res?.data) {
        toast.success(
          `Imported ${res.data.created} new diseases (Total: ${res.data.total}).`
        );
        setImportFile(null);
        setShowImportForm(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        await refreshCount();
      }
    } catch (err: any) {
      toast.error("Import failed: " + (err.message || "Unknown error"));
    } finally {
      setImportLoading(false);
    }
  };

  // Download Sample Excel Template
  const handleDownloadExcelTemplate = () => {
    const templateData = [
      {
        "disease code": "J18.9",
        "diseasename": "Pneumonia",
        "category": "Respiratory",
        "amharic": "የሳንባ ምች",
        "recommended medicines": "Amoxicillin 500mg, Azithromycin 500mg, Paracetamol 500mg",
      },
      {
        "disease code": "A09",
        "diseasename": "Acute Gastroenteritis (AGE)",
        "category": "Gastrointestinal",
        "amharic": "አጣዳፊ የተቅማጥና ማስመለስ በሽታ",
        "recommended medicines": "Oral Rehydration Salts (ORS), Zinc Sulfate 20mg, Ciprofloxacin 500mg",
      },
      {
        "disease code": "I10",
        "diseasename": "Essential Hypertension",
        "category": "Cardiovascular",
        "amharic": "የደም ግፊት በሽታ",
        "recommended medicines": "Amlodipine 5mg, Enalapril 5mg, Hydrochlorothiazide 25mg",
      },
      {
        "disease code": "B54",
        "diseasename": "Malaria",
        "category": "Infectious",
        "amharic": "የወባ በሽታ",
        "recommended medicines": "Coartem (Artemether-Lumefantrine), Paracetamol 500mg",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    worksheet["!cols"] = [
      { wch: 15 },
      { wch: 35 },
      { wch: 20 },
      { wch: 30 },
      { wch: 55 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DiseaseCatalog");
    XLSX.writeFile(workbook, "clinic_disease_template.xlsx");
    toast.success("Downloaded Excel template (.xlsx)");
  };

  return (
    <div className="bg-rose-50/50 dark:bg-rose-950/20 p-6 rounded-xl shadow-sm border border-rose-200 dark:border-rose-900/50 h-full flex flex-col justify-between space-y-4">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Dev Tools: Diseases Catalog
          </h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-bold border border-rose-200 dark:border-rose-800">
            {diseaseCount === null ? "Loading..." : `${diseaseCount} Diseases`}
          </span>
        </div>

        <p className="text-sm text-rose-600 dark:text-rose-300 mt-2 opacity-90">
          Wipe the entire disease catalog clean, quick-add individual diagnoses, or import an Excel/CSV list.
        </p>

        {/* Inline Quick Add Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddSingle}
            className="mt-4 p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/60 space-y-2.5 animate-in slide-in-from-top-2 text-xs shadow-xs"
          >
            <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <Plus className="w-3.5 h-3.5" />
                Add Single Disease
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Code</label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="e.g. A09, J18.9"
                  className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                  Disease Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Acute Bronchitis"
                  className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Category</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Respiratory"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Amharic Translation</label>
                <input
                  type="text"
                  value={newAmharic}
                  onChange={(e) => setNewAmharic(e.target.value)}
                  placeholder="e.g. የብሮንካይተስ በሽታ"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-rose-500 font-amharic"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5 flex items-center gap-1">
                <Pill className="w-3 h-3 text-indigo-500" />
                Recommended Medicines (comma-separated)
              </label>
              <input
                type="text"
                value={newMedicines}
                onChange={(e) => setNewMedicines(e.target.value)}
                placeholder="e.g. Amoxicillin 500mg, Paracetamol 500mg"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addLoading || !newName.trim()}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-2xs disabled:opacity-50"
              >
                {addLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Save to Catalog
              </button>
            </div>
          </form>
        )}

        {/* Inline Quick Import Form */}
        {showImportForm && (
          <div className="mt-4 p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/60 space-y-2.5 animate-in slide-in-from-top-2 text-xs shadow-xs">
            <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Import Excel / CSV
              </span>
              <button
                type="button"
                onClick={() => setShowImportForm(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-3 text-center bg-slate-50/50 dark:bg-slate-950/40">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setImportFile(e.target.files[0]);
                  }
                }}
                className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400 mt-1.5">
                Columns: <code className="text-indigo-600 font-bold">disease code</code>, <code className="text-indigo-600 font-bold">diseasename</code>, <code className="text-indigo-600 font-bold">recommended medicines</code>
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="devImportMode"
                    value="merge"
                    checked={importMode === "merge"}
                    onChange={() => setImportMode("merge")}
                    className="text-emerald-600"
                  />
                  <span>Merge</span>
                </label>
                <label className="inline-flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="devImportMode"
                    value="replace"
                    checked={importMode === "replace"}
                    onChange={() => setImportMode("replace")}
                    className="text-emerald-600"
                  />
                  <span>Replace All</span>
                </label>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDownloadExcelTemplate}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                >
                  <Download className="w-3 h-3 text-emerald-600" />
                  Template (.xlsx)
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={importLoading || !importFile}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {importLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-3 h-3" />}
                  Import
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Buttons Bar */}
      <div className="mt-4 pt-3 border-t border-rose-200/60 dark:border-rose-900/40 flex flex-wrap gap-2 justify-end items-center">
        <button
          type="button"
          onClick={() => {
            setShowImportForm(false);
            setShowAddForm((prev) => !prev);
          }}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-lg shadow-2xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-indigo-600" />
          + Add One
        </button>

        <button
          type="button"
          onClick={() => {
            setShowAddForm(false);
            setShowImportForm((prev) => !prev);
          }}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 text-xs font-bold rounded-lg transition-colors"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          Import Excel
        </button>

        <button
          type="button"
          onClick={handleRestoreDefault}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors"
          title="Restore standard 40+ disease catalog"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
          Restore Defaults
        </button>

        <button
          type="button"
          onClick={handleWipe}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          {loading ? "Wiping..." : "Delete All Diseases"}
        </button>
      </div>
    </div>
  );
}
