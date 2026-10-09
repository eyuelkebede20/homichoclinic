"use client";

import { useTransition } from "react";
import { updateSystemSetting } from "../actions";
import { toast } from "sonner";
import { Wrench } from "lucide-react";

export function DevModeToggle({ initial }: { initial: boolean }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const res = await updateSystemSetting({ 
        key: "devMode", 
        value: !initial ? "true" : "false" 
      });
      if (res.error) toast.error(res.error);
      else toast.success(!initial ? "Developer Mode enabled" : "Developer Mode disabled");
    });
  };

  return (
    <div className="flex flex-col justify-between bg-white dark:bg-slate-900/50 p-6 border border-slate-200 dark:border-slate-800/60 rounded-xl shadow-sm h-full">
      <div>
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          Developer Mode
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1">
          When enabled, advanced developer tools such as wiping patient data, wiping catalogs, seeding the database, and changing user roles will be visible and operational. Use with extreme caution.
        </p>
      </div>
      
      <div className="mt-auto pt-6 flex justify-end">
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input 
              type="checkbox" 
              className="sr-only" 
              checked={initial} 
              onChange={handleToggle}
              disabled={isPending}
            />
            <div className={`block w-14 h-8 rounded-full transition-colors ${initial ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${initial ? 'transform translate-x-6' : ''}`}></div>
          </div>
          <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">
            {initial ? "Enabled" : "Disabled"}
          </span>
        </label>
      </div>
    </div>
  );
}
