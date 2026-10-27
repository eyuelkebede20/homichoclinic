"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  const handleClearCookiesAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      const cookiesToClean = [
        "clinic_v2.session_token",
        "clinic_v2.session_data",
        "clinic_v2.dont_remember",
        "better-auth.session_token",
        "better-auth.session_data",
      ];
      cookiesToClean.forEach((c) => {
        document.cookie = `${c}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0`;
      });
    } catch (_) {}
    window.location.href = "/reset";
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
        <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-xl mx-auto flex items-center justify-center text-2xl font-bold">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-white">Something went wrong</h1>
        <p className="text-slate-300 text-sm">
          A recent update or stale session cookie may be causing a connection conflict.
        </p>

        {error?.message && (
          <div className="p-3 bg-slate-950/60 border border-slate-700/60 rounded-xl text-left font-mono text-xs text-red-300 max-h-32 overflow-auto break-all">
            {error.message}
          </div>
        )}

        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={handleClearCookiesAndReload}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Cookies & Hard Refresh
          </button>
          <button
            onClick={() => reset()}
            className="w-full py-2 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
          >
            Try Again
          </button>
          <a
            href="/login?reset=1"
            className="w-full py-2 px-4 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors inline-flex items-center justify-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            Go to Login Page
          </a>
        </div>
      </div>
    </div>
  );
}
