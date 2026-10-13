/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { 
  Search, 
  Loader2, 
  UserPlus, 
  Filter, 
  Shield, 
  Briefcase, 
  Users, 
  Phone, 
  CreditCard, 
  X, 
  User, 
  ShieldCheck,
  ChevronRight,
  Clock,
  Sparkles,
  Hash
} from "lucide-react";
import { searchPatientsFast } from "@/features/patients/actions";
import { createVisit } from "@/features/clinical/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type TargetRole = "All" | "Soldier" | "Civilian Staff" | "Soldier Family" | "Civilian Family";
type FilterField = "all" | "phone" | "id" | "name";

function normalizeRole(patientType: string | null | undefined): string {
  if (!patientType) return "Civilian Staff";
  if (patientType === "M") return "Soldier";
  if (patientType === "P") return "Civilian Staff";
  return patientType;
}

function HighlightMatch({ text, query }: { text: string | null | undefined; query: string }) {
  if (!text) return null;
  const q = query.trim();
  if (!q) return <>{text}</>;

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-amber-200 dark:bg-amber-900/90 text-amber-950 dark:text-amber-100 font-extrabold px-0.5 rounded shadow-2xs">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export function ReceptionPatientSearch() {
  const [query, setQuery] = useState("");
  const [targetRole, setTargetRole] = useState<TargetRole>("All");
  const [filterField, setFilterField] = useState<FilterField>("all");
  const [showFilters, setShowFilters] = useState(false);
  
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [admittingId, setAdmittingId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Close popup only when clicking completely outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const performSearch = useCallback(async (q: string, role: TargetRole, field: FilterField) => {
    setLoading(true);
    try {
      const res = await searchPatientsFast({ 
        query: q.trim(),
        targetRole: role === "All" ? undefined : role,
        filterField: field,
      });
      if (res?.data) {
        setResults(res.data);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error("Patient search error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Snappy predictive search on every keystroke (including single digits)
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query, targetRole, filterField);
    }, 120);

    return () => clearTimeout(timer);
  }, [query, targetRole, filterField, performSearch]);

  async function handleAdmit(patientId: string) {
    setAdmittingId(patientId);
    const res = await createVisit({ patientId, status: "scheduled", notes: "" });
    setAdmittingId(null);
    if (res?.error) {
      toast.error("Error admitting patient", { description: res.error });
    } else {
      toast.success("Patient successfully admitted to OPD queue");
      setIsOpen(false);
      setQuery("");
      router.refresh();
    }
  }

  const isDigitsOnly = /^\d+$/.test(query.trim());
  const isFiltered = targetRole !== "All" || filterField !== "all";

  const getPlaceholder = () => {
    if (filterField === "phone") return "Predict phone number (e.g. 0911...)...";
    if (filterField === "id") return "Predict military ID or employee card ID...";
    if (filterField === "name") return "Predict patient or personnel name...";
    return "Predictive search by number (phone/card ID) or name...";
  };

  return (
    <div className="relative w-full max-w-xl md:max-w-2xl z-50" ref={wrapperRef}>
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 flex items-center gap-1.5 text-slate-400 pointer-events-none">
          {filterField === "phone" || isDigitsOnly ? (
            <Phone className="w-4 h-4 text-blue-500 animate-pulse" />
          ) : filterField === "id" ? (
            <CreditCard className="w-4 h-4 text-blue-500" />
          ) : filterField === "name" ? (
            <User className="w-4 h-4 text-blue-500" />
          ) : (
            <Search className="w-4 h-4 text-slate-400" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          placeholder={getPlaceholder()}
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results.length > 0) {
              e.preventDefault();
              const top = results[0];
              if (!top.visits || top.visits.length === 0) {
                handleAdmit(top.id);
              } else {
                router.push(`/patients/${top.id}`);
                setIsOpen(false);
              }
            }
          }}
          className="w-full pl-10 pr-28 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
        />

        {/* Action icons right inside input */}
        <div className="absolute right-2.5 flex items-center gap-1.5">
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Filter toggle button */}
          <button
            type="button"
            onClick={() => {
              setShowFilters(prev => !prev);
              setIsOpen(true);
            }}
            className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all ${
              isFiltered || showFilters
                ? "bg-blue-50 border-blue-400 text-blue-600 dark:bg-blue-950/60 dark:border-blue-700 dark:text-blue-300"
                : "border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
            title="Toggle search filters"
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
            {isFiltered && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
            )}
          </button>

          {loading && (
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          )}
        </div>
      </div>

      {/* Active Filter & Number Prediction Indicator */}
      <div className="flex items-center justify-between gap-2 mt-1.5 px-1 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {isDigitsOnly && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 font-bold text-[11px] animate-pulse">
              <Hash className="w-3 h-3 text-amber-600" />
              Predicting Numbers (Phone / Card / Military ID)
            </span>
          )}

          {targetRole !== "All" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-semibold text-[11px]">
              {targetRole}
              <button onClick={() => setTargetRole("All")} className="hover:opacity-75">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filterField !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 font-semibold text-[11px]">
              Field: {filterField}
              <button onClick={() => setFilterField("all")} className="hover:opacity-75">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>

        {isFiltered && (
          <button 
            onClick={() => { setTargetRole("All"); setFilterField("all"); }}
            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline shrink-0"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Dropdown Popup */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Filter Drawer / Panel */}
          <div className="p-3 bg-slate-50/90 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
            {/* Role Filter Pills */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Shield className="w-3 h-3 text-blue-500" /> Personnel / Role Filter
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(["All", "Soldier", "Civilian Staff", "Soldier Family", "Civilian Family"] as TargetRole[]).map(role => {
                  const isActive = targetRole === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setTargetRole(role)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                        isActive
                          ? role === "Soldier"
                            ? "bg-amber-600 text-white shadow-xs"
                            : role === "Civilian Staff"
                            ? "bg-blue-600 text-white shadow-xs"
                            : role.includes("Family")
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-xs"
                          : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      {role === "Soldier" && <Shield className="w-3 h-3" />}
                      {role === "Civilian Staff" && <Briefcase className="w-3 h-3" />}
                      {role.includes("Family") && <Users className="w-3 h-3" />}
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Field Filter Pills */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Filter className="w-3 h-3 text-blue-500" /> Match Field
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "all", label: "All Fields", icon: Search },
                  { id: "phone", label: "Phone Number", icon: Phone },
                  { id: "id", label: "Card / Military ID", icon: CreditCard },
                  { id: "name", label: "Name", icon: User },
                ].map(f => {
                  const Icon = f.icon;
                  const isActive = filterField === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilterField(f.id as FilterField)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                        isActive
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Predictive Best Match Banner */}
          {query.trim().length > 0 && results.length > 0 && (
            <div className="m-2 p-2.5 rounded-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/10 border border-blue-400/40 dark:border-blue-600/40 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-blue-600 text-white shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-200 truncate">
                    <span>Predicted Top Match:</span>
                    <span className="text-slate-900 dark:text-slate-100 font-extrabold">{results[0].firstName} {results[0].lastName}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                      {normalizeRole(results[0].patientType)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                    {results[0].contactNumber && <span>Phone: <HighlightMatch text={results[0].contactNumber} query={query} /></span>}
                    {(results[0].militaryId || results[0].employeeId) && (
                      <span> • ID: <HighlightMatch text={results[0].militaryId || results[0].employeeId} query={query} /></span>
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleAdmit(results[0].id)}
                disabled={admittingId === results[0].id}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shrink-0 flex items-center gap-1 shadow-sm transition-all"
                title="Press Enter in the search box to check-in"
              >
                {admittingId === results[0].id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                <span>Check-in (Enter)</span>
              </button>
            </div>
          )}

          {/* Results List */}
          <div className="max-h-[460px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 p-2 space-y-2">
            {query.length === 0 && results.length > 0 && (
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Recent Patients / Personnels
              </div>
            )}

            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                Predicting matching patient & personnel records...
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {query ? `No patients or personnels found matching "${query}".` : "No records to display."}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Check if the phone number or card ID has different digits, or reset role filters.
                </p>
              </div>
            ) : (
              results.map(p => {
                const normRole = normalizeRole(p.patientType);
                const isFamilyMember = normRole === "Civilian Family" || normRole === "Soldier Family";
                const isPersonnel = normRole === "Soldier" || normRole === "Civilian Staff";
                const cardId = p.militaryId || p.employeeId;
                const activeVisit = p.visits && p.visits.length > 0 ? p.visits[0] : null;

                return (
                  <div 
                    key={p.id} 
                    className="p-3 bg-white dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800/80 transition-all flex flex-col gap-2.5 group"
                  >
                    {/* Top Row: Patient Name, Badges & Actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link 
                            href={`/patients/${p.id}`} 
                            className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                          >
                            {p.salutation ? `${p.salutation} ` : ""}
                            <HighlightMatch text={`${p.firstName} ${p.lastName}`} query={query} />
                          </Link>

                          {/* Patient Role Badge */}
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            normRole === "Soldier"
                              ? "bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200"
                              : normRole === "Civilian Staff"
                              ? "bg-blue-100 text-blue-900 dark:bg-blue-900/50 dark:text-blue-200"
                              : normRole === "Soldier Family"
                              ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-200"
                              : normRole === "Civilian Family"
                              ? "bg-purple-100 text-purple-900 dark:bg-purple-900/50 dark:text-purple-200"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}>
                            {normRole === "Soldier" && <Shield className="w-3 h-3" />}
                            {normRole === "Civilian Staff" && <Briefcase className="w-3 h-3" />}
                            {isFamilyMember && <Users className="w-3 h-3" />}
                            {normRole} {p.relationship ? `(${p.relationship})` : ""}
                          </span>

                          {/* Live OPD Status Badge */}
                          {activeVisit && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                              activeVisit.status === "in_progress"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 animate-pulse"
                                : "bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300"
                            }`}>
                              <Clock className="w-3 h-3" />
                              In OPD {activeVisit.opdRoom} ({activeVisit.status === "in_progress" ? "Inside Now" : "Waiting"})
                            </span>
                          )}
                        </div>

                        {/* Secondary Patient Attributes with Highlighted Numbers */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {p.contactNumber && (
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <HighlightMatch text={p.contactNumber} query={query} />
                            </span>
                          )}
                          {p.gender && <span className="capitalize">• {p.gender}</span>}
                          {p.yob && (
                            <span>
                              • YOB: <HighlightMatch text={p.yob} query={query} />
                            </span>
                          )}
                          {cardId && (
                            <span className="flex items-center gap-1 font-mono text-slate-700 dark:text-slate-300">
                              <CreditCard className="w-3 h-3 text-slate-400" />
                              ID: <strong><HighlightMatch text={cardId} query={query} /></strong>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Button: Check-in OPD or View */}
                      <div className="shrink-0 flex items-center gap-2">
                        {activeVisit ? (
                          <Link
                            href={`/patients/${p.id}`}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors"
                          >
                            <span>View Chart</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              handleAdmit(p.id);
                            }}
                            disabled={admittingId === p.id}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                          >
                            {admittingId === p.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <UserPlus className="w-3.5 h-3.5" />
                            )}
                            <span>Check-in OPD</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Searched Personnel Card Details Section */}
                    {/* Case 1: The Patient IS a Personnel (Soldier or Civilian Staff) */}
                    {isPersonnel && (
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/80 text-xs space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                            {normRole === "Soldier" ? (
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            ) : (
                              <Briefcase className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            )}
                            <span>Personnel Details:</span>
                            {p.rank && <span className="text-blue-700 dark:text-blue-400 font-semibold">{p.rank}</span>}
                            <span><HighlightMatch text={`${p.firstName} ${p.lastName}`} query={query} /></span>
                          </div>

                          {(p.division || p.department) && (
                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                              {p.division ? `Division: ${p.division}` : `Dept: ${p.department}`}
                            </span>
                          )}
                        </div>

                        {/* Covered Dependents / Family Members */}
                        {p.dependents && p.dependents.length > 0 && (
                          <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2 flex-wrap text-[11px]">
                            <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Users className="w-3 h-3 text-emerald-500" /> Covered Family ({p.dependents.length}):
                            </span>
                            {p.dependents.map((dep: any) => (
                              <Link
                                key={dep.id}
                                href={`/patients/${dep.id}`}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 hover:underline"
                              >
                                <strong><HighlightMatch text={`${dep.firstName} ${dep.lastName}`} query={query} /></strong>
                                <span className="text-[10px] opacity-75">({dep.relationship || "Family"})</span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Case 2: The Patient IS a Family Member -> Show Sponsoring Personnel Card */}
                    {isFamilyMember && p.primaryPatient && (
                      <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60 text-xs space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-300">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Sponsoring Personnel:</span>
                            <Link 
                              href={`/patients/${p.primaryPatient.id}`}
                              className="text-emerald-800 dark:text-emerald-300 hover:underline font-extrabold"
                            >
                              {p.primaryPatient.rank ? `${p.primaryPatient.rank} ` : ""}
                              <HighlightMatch text={`${p.primaryPatient.firstName} ${p.primaryPatient.lastName}`} query={query} />
                            </Link>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 font-semibold">
                              {normalizeRole(p.primaryPatient.patientType)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-800 dark:text-emerald-300">
                            {(p.primaryPatient.militaryId || p.primaryPatient.employeeId) && (
                              <span className="bg-white/80 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                ID: <strong><HighlightMatch text={p.primaryPatient.militaryId || p.primaryPatient.employeeId} query={query} /></strong>
                              </span>
                            )}
                            {p.primaryPatient.contactNumber && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-emerald-600" />
                                <HighlightMatch text={p.primaryPatient.contactNumber} query={query} />
                              </span>
                            )}
                          </div>
                        </div>

                        {(p.primaryPatient.division || p.primaryPatient.department) && (
                          <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                            Unit / Dept: {p.primaryPatient.division || p.primaryPatient.department}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}