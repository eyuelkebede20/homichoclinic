/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Loader2, X, Shield, Briefcase, Users, Phone, CreditCard, ChevronRight } from "lucide-react";
import { searchPatientsFast } from "@/features/patients/actions";

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
          <mark key={i} className="bg-amber-200 dark:bg-amber-900/90 text-amber-950 dark:text-amber-100 font-bold px-0.5 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export function PatientTableSearch({ defaultValue = "", tab = "all" }: { defaultValue?: string; tab?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(defaultValue);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync if URL defaultValue changes externally
  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);

  // Click outside to close predictions dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Predictive search: As user types, update table via router and fetch preview suggestions
  useEffect(() => {
    const trimmed = query.trim();

    // Fetch quick popup preview suggestions if typed
    if (trimmed.length > 0) {
      setIsSearching(true);
      searchPatientsFast({ query: trimmed })
        .then(res => {
          if (res?.data) {
            setPredictions(res.data.slice(0, 6));
          } else {
            setPredictions([]);
          }
        })
        .catch(() => setPredictions([]))
        .finally(() => setIsSearching(false));
    } else {
      setPredictions([]);
    }

    // Auto-update the table query without needing Enter (debounced 220ms)
    const timer = setTimeout(() => {
      startTransition(() => {
        const currentQ = searchParams.get("q") || "";
        if (currentQ !== trimmed) {
          const params = new URLSearchParams(searchParams.toString());
          if (trimmed) {
            params.set("q", trimmed);
          } else {
            params.delete("q");
          }
          params.set("page", "1"); // Reset pagination
          router.replace(`/patients?${params.toString()}`);
        }
      });
    }, 220);

    return () => clearTimeout(timer);
  }, [query, router, searchParams]);

  function handleClear() {
    setQuery("");
    setPredictions([]);
    setIsOpen(false);
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("q");
      params.set("page", "1");
      router.replace(`/patients?${params.toString()}`);
    });
    inputRef.current?.focus();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsOpen(false);
    const trimmed = query.trim();
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }
      params.set("page", "1");
      router.replace(`/patients?${params.toString()}`);
    });
  }

  return (
    <div className="relative flex-1 md:w-80 z-30" ref={wrapperRef}>
      <form onSubmit={handleSubmit} className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsOpen(false);
          }}
          placeholder="Predictive search by name, phone, or ID..."
          className="pl-9 pr-16 py-2 w-full border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {(isSearching || isPending) && (
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          )}

          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </form>

      {/* Floating Predictive Suggestion Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Live Predictions ({predictions.length})</span>
            <span className="text-[9px] lowercase font-normal opacity-75">Table updates automatically</span>
          </div>

          {predictions.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-500">
              {isSearching ? "Predicting matching patients..." : `No patients matching "${query}"`}
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {predictions.map((p) => {
                const normRole = normalizeRole(p.patientType);
                const cardId = p.militaryId || p.employeeId;

                return (
                  <Link
                    key={p.id}
                    href={`/patients/${p.id}`}
                    onClick={() => setIsOpen(false)}
                    className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between gap-3 transition-colors group block"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          <HighlightMatch text={`${p.firstName} ${p.lastName}`} query={query} />
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          normRole === "Soldier"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                            : normRole === "Civilian Staff"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                        }`}>
                          {normRole} {p.relationship ? `(${p.relationship})` : ""}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                        {p.contactNumber && (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <HighlightMatch text={p.contactNumber} query={query} />
                          </span>
                        )}
                        {cardId && (
                          <span className="flex items-center gap-1 font-mono">
                            <CreditCard className="w-3 h-3 text-slate-400" />
                            ID: <strong className="text-slate-700 dark:text-slate-300"><HighlightMatch text={cardId} query={query} /></strong>
                          </span>
                        )}
                        {p.primaryPatient && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 truncate">
                            • Sponsor: {p.primaryPatient.firstName} ({p.primaryPatient.militaryId || p.primaryPatient.employeeId || "Staff"})
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
