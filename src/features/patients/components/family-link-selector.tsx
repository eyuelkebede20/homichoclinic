"use client";

import { useState, useEffect, useCallback } from "react";
import { searchPatientsFast } from "../actions";
import { 
  Search, 
  Phone, 
  CreditCard, 
  User, 
  CheckCircle2, 
  X, 
  Loader2, 
  Link2, 
  Unlink, 
  Briefcase, 
  ShieldCheck,
  ChevronRight,
  Filter
} from "lucide-react";

export interface PrimaryPatientData {
  id: string;
  firstName: string;
  lastName: string;
  contactNumber?: string | null;
  patientType: string;
  militaryId?: string | null;
  employeeId?: string | null;
  rank?: string | null;
  division?: string | null;
  department?: string | null;
}

interface FamilyLinkSelectorProps {
  patientType: string; // "Civilian Family" | "Soldier Family"
  initialPrimary?: PrimaryPatientData | null;
  initialRelationship?: string | null;
  excludePatientId?: string;
  onChange?: (primary: PrimaryPatientData | null, relationship: string) => void;
}

type FilterField = "all" | "phone" | "id" | "name";
type TargetRole = "Civilian Staff" | "Soldier" | "All";

export function FamilyLinkSelector({
  patientType,
  initialPrimary = null,
  initialRelationship = "",
  excludePatientId,
  onChange,
}: FamilyLinkSelectorProps) {
  const isCivilianFamily = patientType === "Civilian Family";
  const defaultTargetRole: TargetRole = isCivilianFamily ? "Civilian Staff" : "Soldier";

  const [selectedPrimary, setSelectedPrimary] = useState<PrimaryPatientData | null>(initialPrimary);
  const [relationship, setRelationship] = useState<string>(initialRelationship || "");
  const [isChangingLink, setIsChangingLink] = useState<boolean>(!initialPrimary);

  // Filter mechanism state
  const [targetRole, setTargetRole] = useState<TargetRole>(defaultTargetRole);
  const [filterField, setFilterField] = useState<FilterField>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<PrimaryPatientData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Sync default target role if patientType changes
  useEffect(() => {
    if (!selectedPrimary) {
      setTargetRole(isCivilianFamily ? "Civilian Staff" : "Soldier");
    }
  }, [patientType, isCivilianFamily, selectedPrimary]);

  // Execute search
  const performSearch = useCallback(async (query: string, role: TargetRole, field: FilterField) => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await searchPatientsFast({
        query: query.trim(),
        targetRole: role,
        filterField: field,
        excludePatientId,
      });

      if (res?.data) {
        setResults(res.data as PrimaryPatientData[]);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [excludePatientId]);

  // Debounced auto-search as user types or changes filter
  useEffect(() => {
    if (!isChangingLink) return;

    const timer = setTimeout(() => {
      performSearch(searchQuery, targetRole, filterField);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, targetRole, filterField, isChangingLink, performSearch]);

  const handleSelectSponsor = (sponsor: PrimaryPatientData) => {
    setSelectedPrimary(sponsor);
    setIsChangingLink(false);
    setSearchQuery("");
    if (onChange) {
      onChange(sponsor, relationship);
    }
  };

  const handleUnlink = () => {
    setSelectedPrimary(null);
    setIsChangingLink(true);
    setSearchQuery("");
    if (onChange) {
      onChange(null, relationship);
    }
  };

  const handleRelationshipChange = (newRel: string) => {
    setRelationship(newRel);
    if (onChange) {
      onChange(selectedPrimary, newRel);
    }
  };

  return (
    <div className={`p-4 md:p-5 rounded-xl border transition-all ${
      isCivilianFamily
        ? "bg-gradient-to-b from-blue-50/70 to-blue-50/30 dark:from-blue-950/30 dark:to-blue-950/10 border-blue-200 dark:border-blue-900/60"
        : "bg-gradient-to-b from-amber-50/70 to-amber-50/30 dark:from-amber-950/30 dark:to-amber-950/10 border-amber-200 dark:border-amber-900/60"
    } space-y-4`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${
            isCivilianFamily 
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
              : "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300"
          }`}>
            <Link2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Family Member Linking ({patientType})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isCivilianFamily 
                ? "Links to Civilian Staff member for 5% clinic coverage benefit." 
                : "Links to active Soldier for 100% full coverage benefit."}
            </p>
          </div>
        </div>

        {selectedPrimary && !isChangingLink && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5" /> Linked
          </span>
        )}
      </div>

      {/* Selected Primary Card */}
      {selectedPrimary && !isChangingLink ? (
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-emerald-300 dark:border-emerald-800/80 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {selectedPrimary.firstName} {selectedPrimary.lastName}
                  </h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    selectedPrimary.patientType === "Soldier"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                  }`}>
                    {selectedPrimary.patientType}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {(selectedPrimary.militaryId || selectedPrimary.employeeId) && (
                    <span className="flex items-center gap-1 font-mono">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      ID: <strong>{selectedPrimary.militaryId || selectedPrimary.employeeId}</strong>
                    </span>
                  )}
                  {selectedPrimary.contactNumber && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      Phone: <strong>{selectedPrimary.contactNumber}</strong>
                    </span>
                  )}
                  {(selectedPrimary.department || selectedPrimary.division || selectedPrimary.rank) && (
                    <span className="text-[11px] text-slate-500">
                      • {selectedPrimary.rank || selectedPrimary.department || selectedPrimary.division}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleUnlink}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 px-3 py-1.5 rounded-md border border-red-200 dark:border-red-900/50 transition-colors shrink-0 self-start sm:self-auto"
            >
              <Unlink className="w-3.5 h-3.5" />
              Change / Unlink
            </button>
          </div>
        </div>
      ) : (
        /* Search & Filter Mechanism */
        <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {/* Filter Option Buttons (Phone Number vs ID vs Name vs All) */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-blue-500" />
                Search & Filter By:
              </label>

              {/* Sponsor Role Target Filter */}
              <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setTargetRole("Civilian Staff")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    targetRole === "Civilian Staff"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Briefcase className="w-3 h-3 inline mr-1" />
                  Civilian Staff {isCivilianFamily && "★"}
                </button>
                <button
                  type="button"
                  onClick={() => setTargetRole("Soldier")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    targetRole === "Soldier"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <ShieldCheck className="w-3 h-3 inline mr-1" />
                  Soldier {!isCivilianFamily && "★"}
                </button>
                <button
                  type="button"
                  onClick={() => setTargetRole("All")}
                  className={`px-2 py-1 rounded-md font-medium transition-all ${
                    targetRole === "All"
                      ? "bg-slate-700 text-white dark:bg-slate-600 shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  All
                </button>
              </div>
            </div>

            {/* Field Filters: Phone Number or ID or Name */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setFilterField("phone")}
                className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all ${
                  filterField === "phone"
                    ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/40 dark:border-blue-500 dark:text-blue-300 font-bold shadow-xs"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Phone className="w-3 h-3" />
                Phone Number
              </button>

              <button
                type="button"
                onClick={() => setFilterField("id")}
                className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all ${
                  filterField === "id"
                    ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/40 dark:border-blue-500 dark:text-blue-300 font-bold shadow-xs"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <CreditCard className="w-3 h-3" />
                Card / Military ID
              </button>

              <button
                type="button"
                onClick={() => setFilterField("name")}
                className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all ${
                  filterField === "name"
                    ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/40 dark:border-blue-500 dark:text-blue-300 font-bold shadow-xs"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <User className="w-3 h-3" />
                Name
              </button>

              <button
                type="button"
                onClick={() => setFilterField("all")}
                className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all ${
                  filterField === "all"
                    ? "bg-slate-200 border-slate-500 text-slate-900 dark:bg-slate-700 dark:border-slate-400 dark:text-slate-100 font-bold"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Search className="w-3 h-3" />
                All Fields
              </button>
            </div>
          </div>

          {/* Search Input Box with Action Buttons */}
          <div className="relative flex items-center">
            <div className="absolute left-3 text-slate-400 pointer-events-none">
              {filterField === "phone" && <Phone className="w-4 h-4 text-blue-500" />}
              {filterField === "id" && <CreditCard className="w-4 h-4 text-blue-500" />}
              {filterField === "name" && <User className="w-4 h-4 text-blue-500" />}
              {filterField === "all" && <Search className="w-4 h-4 text-slate-400" />}
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  performSearch(searchQuery, targetRole, filterField);
                }
              }}
              placeholder={
                filterField === "phone"
                  ? "Type phone number (e.g. 0911...)"
                  : filterField === "id"
                  ? "Type military ID or employee card ID..."
                  : filterField === "name"
                  ? "Type sponsor's first or last name..."
                  : "Type phone number, card ID, military ID, or name..."
              }
              className="w-full pl-9 pr-24 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 text-sm focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />

            <div className="absolute right-2 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
                  title="Clear input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              
              <button
                type="button"
                onClick={() => performSearch(searchQuery, targetRole, filterField)}
                disabled={isLoading}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                <span>Search</span>
              </button>
            </div>
          </div>

          {/* Results List */}
          <div className="pt-1">
            {isLoading ? (
              <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                Searching for matching {targetRole === "All" ? "sponsors" : targetRole}...
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-1">
                  {searchQuery ? `Matching Results (${results.length})` : `Recent ${targetRole} Records:`}
                </p>
                {results.map((p) => {
                  const cardId = p.militaryId || p.employeeId || p.id;
                  return (
                    <div
                      key={p.id}
                      className="p-2.5 bg-slate-50/80 dark:bg-slate-800/40 hover:bg-blue-50/80 dark:hover:bg-blue-900/30 rounded-lg border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {p.firstName} {p.lastName}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            p.patientType === "Soldier"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                          }`}>
                            {p.patientType}
                          </span>
                        </div>

                        <div className="flex items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                          {p.contactNumber && (
                            <span className="flex items-center gap-1 font-mono text-slate-700 dark:text-slate-300">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {p.contactNumber}
                            </span>
                          )}
                          {cardId && (
                            <span className="flex items-center gap-1 font-mono">
                              <CreditCard className="w-3 h-3 text-slate-400" />
                              ID: <strong className="text-slate-800 dark:text-slate-200">{cardId}</strong>
                            </span>
                          )}
                          {(p.rank || p.department || p.division) && (
                            <span className="text-slate-400 truncate">
                              • {p.rank || p.department || p.division}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectSponsor(p)}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 group-hover:bg-blue-600 group-hover:text-white text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 group-hover:border-blue-600 rounded-md text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors shrink-0"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>Link</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : hasSearched && searchQuery ? (
              <div className="py-5 text-center px-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  No {targetRole === "All" ? "staff members" : targetRole} found matching &ldquo;{searchQuery}&rdquo;.
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Check if the phone number or card ID was entered correctly, or try switching the filter.
                </p>
                {targetRole !== "All" && (
                  <button
                    type="button"
                    onClick={() => setTargetRole("All")}
                    className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Search across All Staff & Soldiers &rarr;
                  </button>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 text-center py-2">
                Type a phone number or ID above to search and link the sponsor.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Relationship Selector Dropdown */}
      <div className="pt-1">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Relationship to Sponsor <span className="text-red-500">*</span>
        </label>
        <select
          name="relationship"
          value={relationship}
          onChange={(e) => handleRelationshipChange(e.target.value)}
          required={!!selectedPrimary}
          className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
        >
          <option value="">Select relationship...</option>
          <option value="Spouse">Spouse (Wife / Husband)</option>
          <option value="Child">Child (Son / Daughter)</option>
          <option value="Parent">Parent (Father / Mother)</option>
          <option value="Sibling">Sibling (Brother / Sister)</option>
          <option value="Other">Other Dependent</option>
        </select>
        <p className="text-[10px] text-slate-500 mt-1">
          Specifies the family dependent relationship to the primary staff or soldier.
        </p>
      </div>

      {/* Hidden inputs for form submit */}
      <input 
        type="hidden" 
        name="primaryPatientId" 
        value={selectedPrimary ? selectedPrimary.id : ""} 
      />
      <input 
        type="hidden" 
        name="staffSearchStr" 
        value={selectedPrimary ? selectedPrimary.id : (isChangingLink ? searchQuery : (initialPrimary ? "UNLINK" : ""))} 
      />
    </div>
  );
}
