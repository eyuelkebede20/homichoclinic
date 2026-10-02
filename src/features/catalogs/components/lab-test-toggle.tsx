"use client";

import { useOptimistic, useTransition } from "react";
import { toggleLabTestOperational } from "../actions-toggle";

export function LabTestToggle({ id, initialStatus }: { id: string, initialStatus: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, addOptimisticStatus] = useOptimistic(
    initialStatus,
    (_state, newStatus: boolean) => newStatus
  );

  function handleToggle() {
    startTransition(async () => {
      addOptimisticStatus(!optimisticStatus);
      const res = await toggleLabTestOperational({ id, isOperational: !optimisticStatus });
      if (res.error) alert(res.error);
    });
  }

  return (
    <label className={`flex items-center cursor-pointer opacity-90 hover:opacity-100 ${isPending ? 'pointer-events-none opacity-50' : ''}`} title={optimisticStatus ? 'Operational' : 'Offline'}>
      <div className="relative">
        <input 
          type="checkbox" 
          className="sr-only" 
          checked={optimisticStatus} 
          onChange={handleToggle}
          disabled={isPending}
        />
        <div className={`block w-8 h-5 rounded-full transition-colors ${optimisticStatus ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${optimisticStatus ? 'transform translate-x-3' : ''}`}></div>
      </div>
    </label>
  );
}
