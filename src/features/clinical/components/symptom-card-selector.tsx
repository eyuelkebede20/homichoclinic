"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Check,
  Plus,
  RotateCcw,
  Clock,
  Activity,
  History,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Tag,
  Stethoscope,
} from "lucide-react";
import {
  ClinicSymptom,
  DEFAULT_TOP_SYMPTOMS,
  ALL_CLINICAL_SYMPTOMS,
  CLINICAL_SYMPTOM_MODIFIERS,
} from "../types/symptoms";

export type SymptomCardSelectorProps = {
  value: string;
  onChange: (newValue: string) => void;
  previousVisitComplaints?: Array<{
    date?: string | Date;
    text: string;
  }>;
  className?: string;
  compact?: boolean;
};

const CATEGORIES = [
  { id: "Top", label: "Top Common", amharic: "የተለመዱ" },
  { id: "All", label: "All Symptoms", amharic: "ሁሉንም" },
  { id: "Respiratory", label: "Respiratory & ENT", amharic: "መተንፈሻ" },
  { id: "Gastrointestinal", label: "Gastrointestinal", amharic: "ሆድና ጨጓራ" },
  { id: "Neurological", label: "Neurological & Sensory", amharic: "ራስና ነርቭ" },
  { id: "Musculoskeletal", label: "Musculoskeletal", amharic: "መገጣጠሚያ" },
  { id: "General", label: "Systemic / General", amharic: "አጠቃላይ" },
];

export function SymptomCardSelector({
  value,
  onChange,
  previousVisitComplaints = [],
  className = "",
  compact = false,
}: SymptomCardSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<string>("Top");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Compute which symptoms are already present in the current value text
  const isSelected = (symptomName: string) => {
    if (!value) return false;
    const lowerVal = value.toLowerCase();
    const lowerName = symptomName.toLowerCase();
    // Check word boundary or substring match
    const regex = new RegExp(`(^|[,;\\s])${lowerName.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}([,;\\s]|$)`, "i");
    return regex.test(lowerVal) || lowerVal.includes(lowerName);
  };

  // Toggle symptom on/off in the text
  const handleToggleSymptom = (symptom: ClinicSymptom) => {
    const name = symptom.name;
    const selected = isSelected(name);

    if (selected) {
      // Remove symptom from text
      let next = value;
      // Match with preceding or succeeding comma
      const regex1 = new RegExp(`,\\s*${name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}`, "gi");
      const regex2 = new RegExp(`${name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\s*,?`, "gi");
      next = next.replace(regex1, "");
      next = next.replace(regex2, "");
      next = next.trim().replace(/^,\s*/, "").replace(/,\s*$/, "").replace(/,\s*,/g, ",");
      onChange(next);
    } else {
      // Append symptom to text
      const trimmed = value.trim();
      if (!trimmed) {
        onChange(name);
      } else {
        const separator = trimmed.endsWith(",") || trimmed.endsWith(";") ? " " : ", ";
        onChange(`${trimmed}${separator}${name}`);
      }
    }
  };

  // Append a duration or clinical modifier
  const handleAddModifier = (modifier: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      onChange(modifier);
    } else {
      const separator = trimmed.endsWith(",") || trimmed.endsWith(";") ? " " : ", ";
      onChange(`${trimmed}${separator}${modifier}`);
    }
  };

  // Filter symptoms based on category and search query
  const displayedSymptoms = useMemo(() => {
    let list: ClinicSymptom[] = [];
    if (activeCategory === "Top") {
      list = DEFAULT_TOP_SYMPTOMS;
    } else if (activeCategory === "All") {
      list = ALL_CLINICAL_SYMPTOMS;
    } else {
      list = ALL_CLINICAL_SYMPTOMS.filter((s) => s.category === activeCategory);
    }

    if (!searchQuery.trim()) return list;

    const query = searchQuery.toLowerCase().trim();
    return ALL_CLINICAL_SYMPTOMS.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        (s.amharic && s.amharic.toLowerCase().includes(query)) ||
        s.category.toLowerCase().includes(query)
    );
  }, [activeCategory, searchQuery]);

  // Selected count among all symptoms
  const selectedCount = useMemo(() => {
    if (!value.trim()) return 0;
    return ALL_CLINICAL_SYMPTOMS.filter((s) => isSelected(s.name)).length;
  }, [value]);

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-blue-200/90 dark:border-blue-900/60 rounded-xl shadow-xs overflow-hidden transition-all ${className}`}
    >
      {/* Top Header & Toggle Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50 dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-slate-900/50 border-b border-blue-100 dark:border-blue-900/40">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-blue-600 text-white dark:bg-blue-500 shadow-2xs">
            <Stethoscope className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Quick Select Symptoms
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold hidden sm:inline">
                የምልክቶች መምረጫ
              </span>
              {selectedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-600 text-white font-mono shadow-2xs">
                  {selectedCount} selected
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Click cards to add/remove symptoms directly from patient history
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {value.trim().length > 0 && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Clear all text"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isExpanded ? "Collapse symptom cards" : "Expand symptom cards"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 sm:p-3.5 space-y-3">
          {/* Previous Visit History Cards (If Available) */}
          {previousVisitComplaints && previousVisitComplaints.length > 0 && (
            <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 dark:text-amber-300 mb-1.5">
                <History className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Patient's Previous Recorded Complaints (Click to re-select):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {previousVisitComplaints.slice(0, 3).map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const text = item.text.replace(/^[,\s]+|[,\s]+$/g, "");
                      if (!text) return;
                      const trimmed = value.trim();
                      if (!trimmed) {
                        onChange(text);
                      } else {
                        onChange(`${trimmed}, ${text}`);
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 hover:bg-amber-100/60 dark:hover:bg-amber-900/30 transition-all font-medium shadow-2xs text-left"
                  >
                    <Plus className="w-3 h-3 text-amber-600 shrink-0" />
                    <span className="truncate max-w-xs">{item.text}</span>
                    {item.date && (
                      <span className="text-[10px] text-amber-600/80 dark:text-amber-400 font-mono">
                        ({new Date(item.date).toLocaleDateString()})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Bar & Category Navigation */}
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
            {/* Category Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setSearchQuery("");
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                    activeCategory === cat.id && !searchQuery
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Live Search Input */}
            <div className="relative min-w-[180px] sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search symptoms / ምልክት..."
                className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Symptom Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-56 overflow-y-auto pr-1">
            {displayedSymptoms.map((symptom) => {
              const selected = isSelected(symptom.name);
              return (
                <button
                  key={symptom.id}
                  type="button"
                  onClick={() => handleToggleSymptom(symptom)}
                  className={`group relative flex flex-col items-start justify-center min-h-[44px] p-2.5 rounded-xl border text-left transition-all ${
                    selected
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs dark:bg-blue-600 dark:border-blue-500"
                      : "bg-slate-50/80 hover:bg-blue-50/50 dark:bg-slate-950/40 dark:hover:bg-blue-950/30 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-0.5">
                    <span
                      className={`text-xs font-bold leading-tight ${
                        selected ? "text-white" : "text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                      }`}
                    >
                      {symptom.name}
                    </span>
                    <span
                      className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-transform ${
                        selected
                          ? "bg-white text-blue-600 scale-110"
                          : "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 group-hover:bg-blue-600 group-hover:text-white"
                      }`}
                    >
                      {selected ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <Plus className="w-2.5 h-2.5" />}
                    </span>
                  </div>

                  {symptom.amharic && (
                    <span
                      className={`text-[10px] leading-tight truncate w-full ${
                        selected ? "text-blue-100" : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {symptom.amharic}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {displayedSymptoms.length === 0 && (
            <div className="text-center py-4 text-xs text-slate-400">
              No symptoms match "{searchQuery}". You can type it directly into the notes field below.
            </div>
          )}

          {/* Quick Duration & Modifier Chips */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-500" />
                Quick Duration & Severity Modifiers:
              </span>
              <span className="text-[10px] text-slate-400 italic">Click to append to current note</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CLINICAL_SYMPTOM_MODIFIERS.map((mod) => (
                <button
                  key={mod.label}
                  type="button"
                  onClick={() => handleAddModifier(mod.label)}
                  className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800 transition-colors"
                >
                  + {mod.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
