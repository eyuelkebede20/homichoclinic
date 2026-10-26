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
  FileCheck,
  Check,
  Sparkles,
  UserCheck,
  CheckSquare,
  Square,
  AlertCircle,
  HelpCircle,
  Trash2,
  Pill,
} from "lucide-react";
import { ClinicDisease, DEFAULT_CLINIC_DISEASES, DEFAULT_MOST_PICKED_DISEASES } from "../types/diseases";
import { addClinicDisease, getClinicDiseases, getTopDiagnosedDiseases } from "../actions";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";

export type FinalDiagnosisModalProps = {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientId: string;
  labTestName?: string;
  labFindings?: string;
  practitionerName?: string;
  onConfirm: (data: {
    finalDiagnosis: string;
    selectedDiseases: ClinicDisease[];
    practitionerName?: string;
    notes?: string;
    completeVisit?: boolean;
  }) => Promise<void>;
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
  "General",
];

export function FinalDiagnosisModal({
  isOpen,
  onClose,
  patientName,
  patientId,
  labTestName,
  labFindings,
  practitionerName: initialPractitionerName,
  onConfirm,
  title = "Select Diagnosed Generalized Diseases",
  confirmLabel = "Done",
}: FinalDiagnosisModalProps) {
  const { data: session } = useSession();
  const [diseases, setDiseases] = useState<ClinicDisease[]>(DEFAULT_CLINIC_DISEASES);
  const [mostPicked, setMostPicked] = useState<ClinicDisease[]>(DEFAULT_MOST_PICKED_DISEASES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDiseases, setSelectedDiseases] = useState<ClinicDisease[]>([]);

  // Attending Doctor State
  const defaultDocName = useMemo(() => {
    if (initialPractitionerName) return initialPractitionerName;
    if (session?.user?.name) {
      return session.user.name.startsWith("Dr.") ? session.user.name : `Dr. ${session.user.name}`;
    }
    return "Dr. Attending Physician";
  }, [initialPractitionerName, session?.user?.name]);

  const [practitionerName, setPractitionerName] = useState(defaultDocName);

  // Quick-Add new disease states
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newDiseaseCode, setNewDiseaseCode] = useState("");
  const [newDiseaseName, setNewDiseaseName] = useState("");
  const [newDiseaseCategory, setNewDiseaseCategory] = useState("General");
  const [newDiseaseAmharic, setNewDiseaseAmharic] = useState("");

  const [notes, setNotes] = useState("");
  const [completeVisit, setCompleteVisit] = useState(true);
  const [loading, setLoading] = useState(false);
  const [addingLoading, setAddingLoading] = useState(false);

  // Update practitioner name when session loads or prop changes
  useEffect(() => {
    if (defaultDocName) {
      setPractitionerName(defaultDocName);
    }
  }, [defaultDocName]);

  // Load clinic diseases & most picked diagnoses from database when modal opens
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

    getTopDiagnosedDiseases(18)
      .then((topList) => {
        if (isMounted && topList && topList.length > 0) {
          setMostPicked(
            topList.map((d) => ({
              id: d.id || `dis-${d.name}`,
              name: d.name,
              code: d.code,
              category: d.category,
              amharic: d.amharic,
            }))
          );
        }
      })
      .catch((e) => console.error(e));

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Reset transient state on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedCategory("All");
      setSelectedDiseases([]);
      setNewDiseaseCode("");
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

  // Toggle selection of a disease (Multi-select)
  const toggleDisease = (disease: ClinicDisease) => {
    setSelectedDiseases((prev) => {
      const exists = prev.some(
        (x) => x.id === disease.id || x.name.toLowerCase() === disease.name.toLowerCase()
      );
      if (exists) {
        return prev.filter(
          (x) => x.id !== disease.id && x.name.toLowerCase() !== disease.name.toLowerCase()
        );
      } else {
        return [...prev, disease];
      }
    });
  };

  const removeSelectedDisease = (diseaseIdOrName: string) => {
    setSelectedDiseases((prev) =>
      prev.filter((x) => x.id !== diseaseIdOrName && x.name !== diseaseIdOrName)
    );
  };

  const clearAllSelected = () => {
    setSelectedDiseases([]);
  };

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
        code: newDiseaseCode.trim() || undefined,
        category: newDiseaseCategory.trim() || (selectedCategory !== "All" ? selectedCategory : "General"),
        amharic: newDiseaseAmharic.trim() || undefined,
      });

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`"${trimmed}" added to clinic disease catalog!`);
        const addedItem: ClinicDisease = res?.data?.disease || {
          id: `dis-${Date.now()}`,
          name: trimmed,
          code: newDiseaseCode.trim() || undefined,
          category: newDiseaseCategory.trim() || "General",
          amharic: newDiseaseAmharic.trim() || undefined,
        };

        if (res?.data?.diseases) {
          setDiseases(res.data.diseases);
        } else {
          setDiseases((prev) => [addedItem, ...prev]);
        }

        // Auto-select the newly added disease
        setSelectedDiseases((prev) => {
          if (prev.some((x) => x.name.toLowerCase() === addedItem.name.toLowerCase())) {
            return prev;
          }
          return [...prev, addedItem];
        });

        setNewDiseaseName("");
        setNewDiseaseCode("");
        setNewDiseaseAmharic("");
        setIsAddingNew(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add disease");
    } finally {
      setAddingLoading(false);
    }
  };

  // Submit diagnosis & mark reviewed
  const handleConfirmSubmit = async () => {
    if (selectedDiseases.length === 0) {
      toast.error("Please select at least one diagnosed generalized disease.");
      return;
    }

    const finalDiagnosisString = selectedDiseases
      .map((d) => (d.code ? `[${d.code}] ${d.name}` : d.name))
      .join("; ");

    setLoading(true);
    try {
      await onConfirm({
        finalDiagnosis: finalDiagnosisString,
        selectedDiseases,
        practitionerName: practitionerName.trim() || undefined,
        notes: notes.trim() || undefined,
        completeVisit,
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
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-gradient-to-r from-indigo-50/80 via-slate-50 to-indigo-50/40 dark:from-indigo-950/40 dark:via-slate-900 dark:to-indigo-950/20">
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
                  የፍጻሜ ምርመራዎች
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-600 dark:text-slate-400">
                <span>
                  Patient: <strong className="text-slate-900 dark:text-slate-100 font-semibold">{patientName}</strong>
                </span>
                {labTestName && (
                  <span className="text-slate-500">
                    • Test: <strong>{labTestName}</strong>
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-[11px] bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md font-medium">
                  <UserCheck className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  {practitionerName}
                </span>
              </div>
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

          {/* ──────────────────────────────────────────────────────────── */}
          {/* MULTI-SELECT TRAY: Selected Diseases Chips                   */}
          {/* ──────────────────────────────────────────────────────────── */}
          <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Selected Generalized Diseases ({selectedDiseases.length})
                <span className="text-[11px] font-normal text-indigo-600/80 dark:text-indigo-400/80">
                  — Select one or more
                </span>
              </span>
              {selectedDiseases.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllSelected}
                  className="text-[11px] text-slate-500 hover:text-rose-600 font-medium transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {selectedDiseases.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic py-1">
                No diseases selected yet. Click any disease from the list below or search to select.
              </p>
            ) : (
              <div className="space-y-2 pt-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  {selectedDiseases.map((d) => (
                    <span
                      key={d.id}
                      className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-xs animate-in zoom-in-95 duration-100"
                    >
                      {d.code && (
                        <span className="font-mono text-[10px] bg-indigo-800/80 px-1 py-0.2 rounded text-indigo-100">
                          {d.code}
                        </span>
                      )}
                      <span>{d.name}</span>
                      <button
                        type="button"
                        onClick={() => removeSelectedDisease(d.id)}
                        className="p-0.5 hover:bg-indigo-700 rounded text-indigo-200 hover:text-white ml-0.5"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* First-Line Clinical Regimens Guidance for Selected Diseases */}
                {selectedDiseases.some((d) => d.recommendedMedicines) && (
                  <div className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs space-y-1.5 animate-in fade-in duration-150">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300 text-[11px]">
                      <Pill className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Recommended First-Line Regimen Reference:</span>
                    </div>
                    <div className="space-y-1">
                      {selectedDiseases
                        .filter((d) => d.recommendedMedicines)
                        .map((d) => (
                          <div key={d.id} className="text-[11px] text-slate-700 dark:text-slate-300 flex items-start gap-1">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{d.name}:</span>
                            <span className="text-emerald-700 dark:text-emerald-300 font-medium">{d.recommendedMedicines}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Search Bar + Quick Add Toggle */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Disease Code (e.g. A09, J18.9) or Name (e.g. Typhoid, Pneumonia, Gastritis, UTI)..."
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
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
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isAddingNew
                    ? "bg-indigo-700 text-white shadow-xs"
                    : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800"
                }`}
                title="Add new disease to clinic catalog"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Disease</span>
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
                    Saved permanently and automatically selected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div>
                    <input
                      type="text"
                      value={newDiseaseCode}
                      onChange={(e) => setNewDiseaseCode(e.target.value)}
                      placeholder="Code (e.g. A09)"
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={newDiseaseName}
                      onChange={(e) => setNewDiseaseName(e.target.value)}
                      placeholder="Disease Name (e.g. Acute Sinusitis)"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                    />
                  </div>
                  <div>
                    <select
                      value={newDiseaseCategory}
                      onChange={(e) => setNewDiseaseCategory(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {CATEGORIES.filter((c) => c !== "All").map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={newDiseaseAmharic}
                    onChange={(e) => setNewDiseaseAmharic(e.target.value)}
                    placeholder="Amharic Translation (optional, e.g. የሳይነስ ኢንፌክሽን)"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 font-amharic"
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

            {/* ──────────────────────────────────────────────────────────── */}
            {/* MOST PICKED / QUICK PICKS (Top 10 - 20 Diagnoses)             */}
            {/* ──────────────────────────────────────────────────────────── */}
            <div className="p-3 bg-amber-50/80 dark:bg-amber-950/25 border border-amber-200/90 dark:border-amber-900/40 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-[11px] font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wider">
                    Most Picked Diagnoses (Top 10 - 20 Quick Picks)
                  </span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-300 font-bold px-1.5 py-0.2 rounded-full">
                    {mostPicked.length}
                  </span>
                </div>
                <span className="text-[10px] text-amber-800 dark:text-amber-300 italic font-medium">
                  Click to select directly
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {mostPicked.map((d) => {
                  const isSelected = selectedDiseases.some(
                    (x) => x.name.toLowerCase() === d.name.toLowerCase()
                  );
                  return (
                    <button
                      key={d.id || d.name}
                      type="button"
                      onClick={() => toggleDisease(d)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-xs font-bold ring-2 ring-indigo-400"
                          : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-amber-200/90 dark:border-slate-800 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 font-medium"
                      }`}
                      title={`${d.name} (${d.category})`}
                    >
                      {isSelected ? (
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      ) : (
                        <Plus className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      )}
                      {d.code && (
                        <span
                          className={`font-mono text-[10px] px-1 py-0.2 rounded font-bold ${
                            isSelected
                              ? "bg-indigo-700 text-indigo-100"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {d.code}
                        </span>
                      )}
                      <span className="truncate max-w-[200px]">{d.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

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

          {/* Disease Selection Directory Grid */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Select Diagnoses (Click row to select/unselect):</span>
              <span>{filteredDiseases.length} Available in Catalog</span>
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
                    Add &ldquo;{searchQuery}&rdquo; to Catalog
                  </button>
                </div>
              ) : (
                filteredDiseases.map((d) => {
                  const isSelected = selectedDiseases.some(
                    (x) => x.id === d.id || x.name.toLowerCase() === d.name.toLowerCase()
                  );
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDisease(d)}
                      className={`w-full text-left p-2.5 flex items-center justify-between gap-3 transition-all ${
                        isSelected
                          ? "bg-indigo-50/90 dark:bg-indigo-950/70 text-indigo-950 dark:text-indigo-100 font-medium border-l-4 border-indigo-600"
                          : "hover:bg-white dark:hover:bg-slate-900/80 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Checkbox indicator */}
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? "bg-indigo-600 text-white"
                              : "border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {d.code && (
                              <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.2 rounded shrink-0">
                                {d.code}
                              </span>
                            )}
                            <span className={`text-xs ${isSelected ? "font-bold text-indigo-950 dark:text-indigo-100" : "font-medium"}`}>
                              {d.name}
                            </span>
                          </div>
                          {d.amharic && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-amharic truncate mt-0.5">
                              {d.amharic}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {d.category}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Attending Practitioner Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                Attending Practitioner <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={practitionerName}
                  onChange={(e) => setPractitionerName(e.target.value)}
                  placeholder="Doctor Name (e.g. Dr. Samuel Bekele)"
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                Doctor Treatment Remarks <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Prescribed medications, counseling, review in 3 days..."
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Option to also complete active visit */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
            <input
              type="checkbox"
              id="complete-visit-checkbox"
              checked={completeVisit}
              onChange={(e) => setCompleteVisit(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="complete-visit-checkbox" className="text-xs select-none cursor-pointer">
              Mark patient&apos;s active OPD consultation visit as <strong>Completed</strong> and include diagnosis in chart
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900">
          <div className="text-xs text-slate-500">
            {selectedDiseases.length > 0 ? (
              <span>
                <strong className="text-indigo-600 font-bold">{selectedDiseases.length}</strong> disease{selectedDiseases.length === 1 ? "" : "s"} selected
              </span>
            ) : (
              <span className="text-slate-400">No diseases selected yet</span>
            )}
          </div>

          <div className="flex items-center gap-2">
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
              disabled={loading || selectedDiseases.length === 0}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCheck className="w-3.5 h-3.5" />}
              {confirmLabel === "Done" ? (selectedDiseases.length > 0 ? `Done (${selectedDiseases.length} Selected)` : "Done") : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
