"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Loader2, X } from "lucide-react";

export function PatientTableSearch({ defaultValue = "", tab = "all" }: { defaultValue?: string; tab?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync state if external search query changes (e.g. tab switch)
  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);

  // Update table on every keystroke with a snappy 150ms debounce
  useEffect(() => {
    const trimmed = query.trim();
    const currentQ = searchParams.get("q") || "";

    if (currentQ === trimmed) return;

    const timer = setTimeout(() => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (trimmed) {
          params.set("q", trimmed);
        } else {
          params.delete("q");
        }
        params.set("page", "1");
        if (tab && tab !== "all") {
          params.set("tab", tab);
        }
        router.replace(`/patients?${params.toString()}`);
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [query, router, searchParams, tab]);

  const handleClear = () => {
    setQuery("");
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("q");
      params.set("page", "1");
      if (tab && tab !== "all") {
        params.set("tab", tab);
      }
      router.replace(`/patients?${params.toString()}`);
    });
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }
      params.set("page", "1");
      if (tab && tab !== "all") {
        params.set("tab", tab);
      }
      router.replace(`/patients?${params.toString()}`);
    });
  };

  return (
    <div className="relative flex-1 md:w-80">
      <form onSubmit={handleSubmit} className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tab === "pending" ? "Search pending by name, phone, or ID..." : "Search by name, phone, or ID..."}
          className="pl-9 pr-14 py-2 w-full border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all"
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isPending && (
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
    </div>
  );
}
