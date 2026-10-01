"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";

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
  patients: Patient[];
  selectedId: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedPatient = patients.find(p => p.id === selectedId);
  const displayName = selectedPatient 
    ? `${selectedPatient.firstName || selectedPatient.name || ""} ${selectedPatient.lastName || ""}`.trim()
    : "";

  const filtered = patients.filter(p => {
    const full = `${p.firstName || p.name || ""} ${p.lastName || ""} ${p.contactNumber || ""}`.toLowerCase();
    return full.includes(search.toLowerCase());
  });

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
            placeholder={selectedId ? displayName : "Search by name or phone..."}
            value={open ? search : (selectedId ? displayName : "")}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
              if (selectedId) onChange(""); // clear selection if typing
            }}
            onFocus={() => setOpen(true)}
          />
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg">
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-slate-500 text-center">No patients found.</div>
          ) : (
            <ul className="py-1">
              {filtered.map(p => {
                const name = `${p.firstName || p.name || ""} ${p.lastName || ""}`.trim();
                return (
                  <li 
                    key={p.id}
                    className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-between items-center"
                    onClick={() => {
                      onChange(p.id);
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
