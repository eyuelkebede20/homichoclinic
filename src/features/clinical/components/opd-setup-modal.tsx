"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveOpdCount } from "../actions";

export function OpdSetupModal({ initialValue }: { initialValue?: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [count, setCount] = useState("4");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    if (!initialValue && mounted) {
      // Just a small delay or standard effect pattern to clear warning
      const timer = setTimeout(() => setIsOpen(true), 0);
      return () => clearTimeout(timer);
    }
    return () => { mounted = false; };
  }, [initialValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    await saveOpdCount({ count });
    
    setIsOpen(false);
    setLoading(false);
    router.refresh();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-blue-600 p-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-1">OPD Setup Required</h2>
          <p className="text-blue-100 text-sm">Please configure the number of active rooms.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              How many OPD/Diagnosis rooms are active today?
            </label>
            <select 
              value={count} 
              onChange={e => setCount(e.target.value)}
              className="block w-full text-lg rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="1">1 Room</option>
              <option value="2">2 Rooms</option>
              <option value="3">3 Rooms</option>
              <option value="4">4 Rooms</option>
              <option value="5">5 Rooms</option>
              <option value="6">6 Rooms</option>
            </select>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Configuration"}
          </button>
        </form>
      </div>
    </div>
  );
}
