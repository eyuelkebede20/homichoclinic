"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Loader2 } from "lucide-react";

interface Patient {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  contactNumber?: string | null;
  discountPercent?: number;
}

export function PatientSearchSelect({ 
  patients, 
  selectedId, 
  onChange 
}: { 
  patients?: Patient[];
  selectedId: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Patient[]>(patients || []);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
    (patients || []).find(p => p.id === selectedId) || null
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!search || search.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults(patients || []);
      return;
    }
    
    const delay = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/patients/search?q=${encodeURIComponent(search)}`);
        const data = await res.json();
        setResults(data.patients || []);
      } catch (err) {
        console.error("Failed to fetch patients", err);
      } finally {
        setLoading(false);
      }
    }, 300);
    
    return () => clearTimeout(delay);
  }, [search, patients]);

  const displayName = selectedPatient 
    ? `${selectedPatient.firstName || selectedPatient.name || ""} ${selectedPatient.lastName || ""}`.trim()
    : "";

  return (
    <div className="relative" ref={wrapperRef}>
      <div 
        className="flex items-center justify-between w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm cursor-text focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500"
        onClick={() => setOpen(true)}
      >
        <div className="flex items-center gap-2 flex-1">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm dark:text-slate-100"
            placeholder={selectedId && displayName ? displayName : "Search by name or phone..."}
            value={open ? search : (selectedId ? displayName : "")}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
              if (selectedId) onChange(""); 
            }}
            onFocus={() => setOpen(true)}
          />
        </div>
        {loading ? <Loader2 className="w-4 h-4 text-blue-500 flex-shrink-0 ml-2 animate-spin" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />}
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg">
          {results.length === 0 ? (
            <div className="p-3 text-sm text-slate-500 text-center">
              {loading ? "Searching..." : search.length < 2 ? "Type at least 2 characters..." : "No patients found."}
            </div>
          ) : (
            <ul className="py-1">
              {results.map(p => {
                const name = `${p.firstName || p.name || ""} ${p.lastName || ""}`.trim();
                return (
                  <li 
                    key={p.id}
                    className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-between items-center"
                    onClick={() => {
                      onChange(p.id);
                      setSelectedPatient(p);
                      setSearch("");
                      setOpen(false);
                    }}
                  >
                    <span className="font-medium text-slate-900 dark:text-slate-100">{name}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{p.contactNumber || "No phone"}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
