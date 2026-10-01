"use client";

import { useState, useTransition } from "react";
import { setLowPowerMode } from "../actions";

export function LowPowerToggle({ initial }: { initial: boolean }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const res = await setLowPowerMode({ enabled: !initial });
      if (res.error) alert(res.error);
    });
  };

  return (
    <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm mb-6">
      <div>
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">Old Browser / Low Power Mode</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1">
          Enable this if clinic computers are old or have low RAM (e.g. Dell OptiPlex 320s). This will globally disable heavy animations, simplify the UI, and turn off intensive client-side features like OCR to save memory.
        </p>
      </div>
      
      <label className="flex items-center cursor-pointer ml-4">
        <div className="relative">
          <input 
            type="checkbox" 
            className="sr-only" 
            checked={initial} 
            onChange={handleToggle}
            disabled={isPending}
          />
          <div className={`block w-14 h-8 rounded-full transition-colors ${initial ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
          <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${initial ? 'transform translate-x-6' : ''}`}></div>
        </div>
        <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">
          {initial ? "Enabled" : "Disabled"}
        </span>
      </label>
    </div>
  );
}
