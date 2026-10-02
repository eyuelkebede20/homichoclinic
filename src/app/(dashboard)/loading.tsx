import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center p-8 bg-slate-50/50 dark:bg-slate-900/50">
      <div className="flex flex-col items-center gap-4 text-slate-500 dark:text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-500" />
        <p className="text-sm font-medium animate-pulse">Loading data...</p>
      </div>
    </div>
  );
}
