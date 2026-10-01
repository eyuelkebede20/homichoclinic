"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label = "Print Document", className = "" }: { label?: string, className?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className={`print:hidden flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg shadow-sm font-medium transition-colors ${className}`}
    >
      <Printer className="w-4 h-4" />
      {label}
    </button>
  );
}
