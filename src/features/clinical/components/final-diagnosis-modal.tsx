"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  Search,
  Plus,
  CheckCircle2,
  Stethoscope,
  Activity,
  Tag,
  Loader2,
  AlertCircle,
  FileCheck,
  Check,
  Sparkles
} from "lucide-react";
import { ClinicDisease, DEFAULT_CLINIC_DISEASES } from "../types/diseases";
import { addClinicDisease, getClinicDiseases } from "../actions";
import { toast } from "sonner";

export type FinalDiagnosisModalProps = {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientId: string;
  labTestName?: string;
  labFindings?: string;
  onConfirm: (data: { finalDiagnosis: string; notes?: string; completeVisit?: boolean }) => Promise<void>;
  title?: string;
  confirmLabel?: string;
};

const CATEGORIES = [
  "All",
  "Respiratory",
  "Gastrointestinal",
  "Infectious",
  "Cardiovascular",
  "Endocrine",
  "Musculoskeletal",
  "Dermatology",
  "Trauma",
  "General"
];

export function FinalDiagnosisModal({
  isOpen,
  onClose,
  patientName,
  patientId,
  labTestName,
  labFindings,
  onConfirm,
  title = "Select Final Diagnosis",
  confirmLabel = "Confirm & Mark Reviewed"
}: FinalDiagnosisModalProps) {
  const [diseases, setDiseases] = useState<ClinicDisease[]>(DEFAULT_CLINIC_DISEASES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDisease, setSelectedDisease] = useState<string>("");
  const [newDiseaseName, setNewDiseaseName] = useState("");
  const [newDiseaseAmharic, setNewDiseaseAmharic] = useState("");
  const [notes, setNotes] = useState("");
  const [completeVisit, setCompleteVisit] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addingLoading, setAddingLoading] = useState(false);

  // Load clinic diseases from database when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    getClinicDiseases()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setDiseases(data);
        }
      })
      .catch((e) => console.error(e));
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedCategory("All");
      setSelectedDisease("");
      setNewDiseaseName("");
      setNewDiseaseAmharic("");
      setNotes("");
      setIsAddingNew(false);
    }
  }, [isOpen]);

  // Filter diseases based on search query and category
  const filteredDiseases = useMemo(() => {
    return diseases.filter((d) => {
      if (selectedCategory !== "All" && d.category !== selectedCategory) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchName = d.name.toLowerCase().includes(q);
      const matchAmh = (d.amharic || "").toLowerCase().includes(q);
      const matchCat = (d.category || "").toLowerCase().includes(q);
      const matchCode = (d.code || "").toLowerCase().includes(q);
      return matchName || matchAmh || matchCat || matchCode;
    });
  }, [diseases, selectedCategory, searchQuery]);

  // Quick Add new disease to clinic list using "+"
  const handleAddNewDisease = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newDiseaseName.trim();
    if (!trimmed) {
      toast.error("Please enter a disease name.");
      return;
    }

    setAddingLoading(true);
    try {
      const res = await addClinicDisease({
        name: trimmed,
        category: selectedCategory !== "All" ? selectedCategory : "General",
        amharic: newDiseaseAmharic.trim() || undefined
      });

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`"${trimmed}" added to clinic disease list!`);
        if (res?.data?.diseases) {
          setDiseases(res.data.diseases);
        } else {
          setDiseases((prev) => [
            { id: `dis-${Date.now()}`, name: trimmed, category: "General", amharic: newDiseaseAmharic.trim() },
            ...prev
          ]);
        }
        setSelectedDisease(trimmed);
        setNewDiseaseName("");
        setNewDiseaseAmharic("");
        setIsAddingNew(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add disease");
    } finally {
      setAddingLoading(false);
    }
  };

  const handleConfirmSubmit = async () => {
    if (!selectedDisease.trim()) {
      toast.error("Please select a final diagnosis.");
      return;
    }

    setLoading(true);
    try {
      await onConfirm({
        finalDiagnosis: selectedDisease.trim(),
        notes: notes.trim() || undefined,
        completeVisit
      });
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save final diagnosis");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-gradient-to-r from-indigo-50/70 to-slate-50 dark:from-indigo-950/40 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {title}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
                  የፍጻሜ ምርመራ
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Patient: <strong className="text-slate-900 dark:text-slate-100 font-semibold">{patientName}</strong>
                {labTestName && (
                  <span className="ml-1 text-slate-500">• Test: <strong>{labTestName}</strong></span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Lab Findings Snippet if present */}
          {labFindings && (
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                Lab Investigation Findings:
              </span>
              <p className="font-mono text-[11px] line-clamp-2">{labFindings}</p>
            </div>
          )}

          {/* Search Bar + Quick Add Toggle */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search disease/diagnosis (e.g. Typhoid, Pneumonia, Gastritis, UTI, Malaria)..."
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Simple "+" Quick-Add Button */}
              <button
                type="button"
                onClick={() => setIsAddingNew((prev) => !prev)}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isAddingNew
                    ? "bg-indigo-700 text-white shadow-xs"
                    : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800"
                }`}
                title="Add new disease to clinic list"
              >
                <Plus className="w-4 h-4" />
                <span>Add Disease</span>
              </button>
            </div>

            {/* Quick-Add Expandable Form */}
            {isAddingNew && (
              <form
                onSubmit={handleAddNewDisease}
                className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl space-y-2.5 animate-in slide-in-from-top-2 duration-150"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    Add New Disease to Clinic Catalog
                  </span>
                  <span className="text-[10px] text-indigo-700 dark:text-indigo-300">
                    Saved permanently for all doctors
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newDiseaseName}
                    onChange={(e) => setNewDiseaseName(e.target.value)}
                    placeholder="Disease Name (English, e.g., Acute Sinusitis)"
                    className="px-3 py-1.5 text-xs rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    value={newDiseaseAmharic}
                    onChange={(e) => setNewDiseaseAmharic(e.target.value)}
                    placeholder="Amharic Translation (optional, e.g., የሳይነስ ኢንፌክሽን)"
                    className="px-3 py-1.5 text-xs rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 font-amharic"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingLoading || !newDiseaseName.trim()}
                    className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-xs transition-colors"
                  >
                    {addingLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Save & Select Disease
                  </button>
                </div>
              </form>
            )}

            {/* Category Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-0.5 rounded-full whitespace-nowrap transition-all font-medium ${
                    selectedCategory === cat
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Disease Selection Grid */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Select Final Disease / Diagnosis:</span>
              <span>{filteredDiseases.length} Available</span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
              {filteredDiseases.length === 0 ? (
                <div className="p-6 text-center space-y-2">
                  <p className="text-slate-500">No disease matches &ldquo;{searchQuery}&rdquo;</p>
                  <button
                    type="button"
                    onClick={() => {
                      setNewDiseaseName(searchQuery);
                      setIsAddingNew(true);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add &ldquo;{searchQuery}&rdquo; with +
                  </button>
                </div>
              ) : (
                filteredDiseases.map((d) => {
                  const isSelected = selectedDisease === d.name;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedDisease(d.name)}
                      className={`w-full text-left p-2.5 flex items-center justify-between gap-2 transition-all ${
                        isSelected
                          ? "bg-indigo-100/90 dark:bg-indigo-950/80 text-indigo-950 dark:text-indigo-100 font-bold border-l-4 border-indigo-600"
                          : "hover:bg-white dark:hover:bg-slate-900/80 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold">{d.name}</span>
                          {d.code && (
                            <span className="font-mono text-[9px] text-slate-400 bg-slate-200 dark:bg-slate-800 px-1 rounded">
                              {d.code}
                            </span>
                          )}
                        </div>
                        {d.amharic && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-amharic truncate">
                            {d.amharic}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {d.category}
                        </span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Disease Banner */}
          {selectedDisease && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                    Confirmed Final Diagnosis
                  </span>
                  <span className="text-xs font-black text-emerald-950 dark:text-emerald-100">
                    {selectedDisease}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDisease("")}
                className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold underline"
              >
                Change
              </button>
            </div>
          )}

          {/* Optional Clinical Remarks / Management Plan */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Doctor Treatment & Management Remarks <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g., Prescribed broad-spectrum antibiotic and antipyretics. Advised oral rehydration and bed rest. Review in 3 days."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Option to also complete active visit */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              id="complete-visit-checkbox"
              checked={completeVisit}
              onChange={(e) => setCompleteVisit(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
            />
            <label htmlFor="complete-visit-checkbox" className="text-xs select-none cursor-pointer">
              Also mark patient&apos;s active OPD consultation visit as <strong>Completed</strong>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmSubmit}
            disabled={loading || !selectedDisease.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-all"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCheck className="w-3.5 h-3.5" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
