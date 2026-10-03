/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { Loader2, Receipt, FileText } from "lucide-react";
import { generateCreditCharge } from "../actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function CashierDashboard({ visits }: { visits: any[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Billing & Credit Charges</h2>
        <p className="text-slate-500 dark:text-slate-400">Process completed visits for Finance payroll deduction.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 shadow rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 dark:text-slate-200">Ready for Billing</h3>
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
            {visits.length} Unbilled Visits
          </span>
        </div>
        
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {visits.length === 0 ? (
            <div className="p-8 text-center text-slate-500 italic">No visits waiting for billing.</div>
          ) : (
            visits.map(v => <UnbilledVisitRow key={v.id} visit={v} />)
          )}
        </div>
      </div>
    </div>
  );
}

function UnbilledVisitRow({ visit }: { visit: any }) {
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const discount = visit.patient.discountPercent || 0;

  async function handleCharge() {
    setSaving(true);
    const res = await generateCreditCharge({ visitId: visit.id });
    setSaving(false);
    
    if (res?.error) toast.error(res.error);
    else { toast.success("Invoice generated"); router.refresh(); }
  }

  return (
    <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex justify-between items-center">
      <div>
        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-lg flex items-center gap-2">
          <Receipt className="w-5 h-5 text-emerald-600" />
          {visit.patient.firstName} {visit.patient.lastName}
          {discount > 0 && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {discount}% Discount
            </span>
          )}
        </h4>
        <div className="mt-1 text-sm text-slate-600 dark:text-slate-400 space-y-1">
          <p>
            <span className="font-medium">Primary Employee ID:</span> {visit.patient.employeeId || "N/A"}
          </p>
          <p className="text-xs text-slate-500">
            Completed at {new Date(visit.updatedAt).toLocaleTimeString()}
          </p>
        </div>
      </div>

      <button
        onClick={handleCharge}
        disabled={saving}
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        Generate Credit Invoice
      </button>
    </div>
  );
}