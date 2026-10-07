"use client";
import { useState, useMemo } from "react";
import { Search, Printer, Undo, Loader2 } from "lucide-react";
import { undoDenyVisitBilling } from "../actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function DeniedDashboard({ visits = [] }: { visits: any[] }) {
  const [search, setSearch] = useState("");
  const [undoingId, setUndoingId] = useState<string | null>(null);
  const router = useRouter();

  async function handleUndo(visitId: string) {
    setUndoingId(visitId);
    const res = await undoDenyVisitBilling({ visitId });
    setUndoingId(null);
    if (res?.error) toast.error(res.error);
    else {
      toast.success("Visit restored to pending queue");
      router.refresh();
    }
  }

  function handlePrint() {
    window.print();
  }

  const filteredData = useMemo(() => {
    return visits.filter(v => {
      const s = search.toLowerCase();
      const patientName = `${v.patient?.firstName || ''} ${v.patient?.lastName || ''}`.toLowerCase();
      return patientName.includes(s);
    });
  }, [visits, search]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search patient name..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 md:w-80"
          />
        </div>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition"
        >
          <Printer className="w-4 h-4" />
          Print / Export
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900/50 shadow-sm rounded-xl border border-slate-200 dark:border-slate-800/60 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50/50 dark:bg-slate-900/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date Denied</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Full Name</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Discount %</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase print:hidden">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
              {filteredData.map(row => (
                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(row.updatedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                      Denied
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                    {row.patient?.firstName} {row.patient?.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-right">
                    {row.patient?.discountPercent || 0}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center print:hidden">
                    <button 
                      onClick={() => handleUndo(row.id)}
                      disabled={undoingId === row.id}
                      title="Undo Denial"
                      className="bg-orange-100 text-orange-700 hover:bg-orange-200 px-3 py-1.5 rounded-md transition font-medium flex items-center justify-center gap-1 mx-auto"
                    >
                      {undoingId === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Undo className="w-4 h-4" />}
                      Undo
                    </button>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">
                    No denied records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
