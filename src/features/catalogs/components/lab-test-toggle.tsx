"use client";

import { useState, useTransition } from "react";
import { toggleLabTestOperational } from "../actions-toggle";

export function LabTestToggle({ id, initialStatus }: { id: string, initialStatus: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const res = await toggleLabTestOperational({ id, isOperational: !initialStatus });
      if (res.error) alert(res.error);
    });
  }

  return (
    <label className="flex items-center cursor-pointer opacity-90 hover:opacity-100">
      <div className="relative">
        <input 
          type="checkbox" 
          className="sr-only" 
          checked={initialStatus} 
          onChange={handleToggle}
          disabled={isPending}
        />
        <div className={`block w-8 h-5 rounded-full transition-colors ${initialStatus ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${initialStatus ? 'transform translate-x-3' : ''}`}></div>
      </div>
      <span className="ml-2 text-xs font-medium text-slate-500">{initialStatus ? 'Operational' : 'Offline'}</span>
    </label>
  );
}
