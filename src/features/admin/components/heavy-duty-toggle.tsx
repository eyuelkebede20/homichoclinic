"use client";

import { useOptimistic, useTransition } from "react";
import { setHeavyDutyMode } from "../actions";

export function HeavyDutyToggle({ initial }: { initial: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticState, addOptimisticState] = useOptimistic(
    initial,
    (_state, newState: boolean) => newState
  );

  const handleToggle = () => {
    startTransition(async () => {
      addOptimisticState(!optimisticState);
      const res = await setHeavyDutyMode({ enabled: !optimisticState });
      if (res.error) alert(res.error);
    });
  };

  return (
    <div className="flex flex-col justify-between bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm h-full">
      <div>
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">Heavy Duty Features (OCR)</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1">
          Enable this to activate Optical Character Recognition (OCR) for digitizing paper records and other intensive background processing tasks. Requires sufficient server/client resources.
        </p>
      </div>
      
      <div className="mt-auto pt-6 flex justify-end">
        <label className={`flex items-center cursor-pointer ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="relative">
            <input 
              type="checkbox" 
              className="sr-only" 
              checked={optimisticState} 
              onChange={handleToggle}
              disabled={isPending}
            />
            <div className={`block w-14 h-8 rounded-full transition-colors ${optimisticState ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${optimisticState ? 'transform translate-x-6' : ''}`}></div>
          </div>
          <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">
            {optimisticState ? "Enabled" : "Disabled"}
          </span>
        </label>
      </div>
    </div>
  );
}
