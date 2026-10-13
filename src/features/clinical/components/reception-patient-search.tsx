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
  CheckCircle2, 
  User, 
  ShieldCheck,
  ChevronRight,
  Clock,
  Sparkles
} from "lucide-react";
import { searchPatientsFast } from "@/features/patients/actions";
import { createVisit } from "@/features/clinical/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type TargetRole = "All" | "Soldier" | "Civilian Staff" | "Soldier Family" | "Civilian Family";
type FilterField = "all" | "phone" | "id" | "name";

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

  // Debounced search on query or filter changes
  useEffect(() => {
    // If query has only 1 char, don't trigger search unless query is empty (recent list)
    if (query.length === 1) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(query, targetRole, filterField);
    }, 280);

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

  const isFiltered = targetRole !== "All" || filterField !== "all";

  const getPlaceholder = () => {
    if (filterField === "phone") return "Type phone number (e.g. 0911...)...";
    if (filterField === "id") return "Type military ID or employee card ID...";
    if (filterField === "name") return "Type patient or personnel name...";
    return "Search by name, phone, military ID, or card...";
  };

  return (
    <div className="relative w-full max-w-xl md:max-w-2xl z-50" ref={wrapperRef}>
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 flex items-center gap-1.5 text-slate-400 pointer-events-none">
          {filterField === "phone" ? (
            <Phone className="w-4 h-4 text-blue-500" />
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

      {/* Active Filter Chips Bar (Shown under input when active) */}
      {isFiltered && (
        <div className="flex items-center gap-2 mt-1.5 px-1 text-xs">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Filtering:</span>
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
          <button 
            onClick={() => { setTargetRole("All"); setFilterField("all"); }}
            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline ml-auto"
          >
            Reset
          </button>
        </div>
      )}

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
                Searching for matching patients & personnel records...
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {query ? "No patients or personnels found matching your search." : "No records to display."}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Try adjusting the role filter pills or typing a different phone number, military ID, or name.
                </p>
              </div>
            ) : (
              results.map(p => {
                const isFamilyMember = p.patientType === "Civilian Family" || p.patientType === "Soldier Family";
                const isPersonnel = p.patientType === "Soldier" || p.patientType === "Civilian Staff";
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
                            {p.salutation ? `${p.salutation} ` : ""}{p.firstName} {p.lastName}
                          </Link>

                          {/* Patient Role Badge */}
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            p.patientType === "Soldier"
                              ? "bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200"
                              : p.patientType === "Civilian Staff"
                              ? "bg-blue-100 text-blue-900 dark:bg-blue-900/50 dark:text-blue-200"
                              : p.patientType === "Soldier Family"
                              ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-200"
                              : p.patientType === "Civilian Family"
                              ? "bg-purple-100 text-purple-900 dark:bg-purple-900/50 dark:text-purple-200"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}>
                            {p.patientType === "Soldier" && <Shield className="w-3 h-3" />}
                            {p.patientType === "Civilian Staff" && <Briefcase className="w-3 h-3" />}
                            {isFamilyMember && <Users className="w-3 h-3" />}
                            {p.patientType} {p.relationship ? `(${p.relationship})` : ""}
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

                        {/* Secondary Patient Attributes */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {p.contactNumber && (
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {p.contactNumber}
                            </span>
                          )}
                          {p.gender && <span className="capitalize">• {p.gender}</span>}
                          {p.yob && <span>• YOB: {p.yob}</span>}
                          {cardId && (
                            <span className="flex items-center gap-1 font-mono text-slate-700 dark:text-slate-300">
                              <CreditCard className="w-3 h-3 text-slate-400" />
                              ID: <strong>{cardId}</strong>
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
                            {p.patientType === "Soldier" ? (
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            ) : (
                              <Briefcase className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            )}
                            <span>Personnel Details:</span>
                            {p.rank && <span className="text-blue-700 dark:text-blue-400 font-semibold">{p.rank}</span>}
                            <span>{p.firstName} {p.lastName}</span>
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
                                <strong>{dep.firstName} {dep.lastName}</strong>
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
                              {p.primaryPatient.rank ? `${p.primaryPatient.rank} ` : ""}{p.primaryPatient.firstName} {p.primaryPatient.lastName}
                            </Link>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 font-semibold">
                              {p.primaryPatient.patientType}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-800 dark:text-emerald-300">
                            {(p.primaryPatient.militaryId || p.primaryPatient.employeeId) && (
                              <span className="bg-white/80 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                ID: <strong>{p.primaryPatient.militaryId || p.primaryPatient.employeeId}</strong>
                              </span>
                            )}
                            {p.primaryPatient.contactNumber && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-emerald-600" />
                                {p.primaryPatient.contactNumber}
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