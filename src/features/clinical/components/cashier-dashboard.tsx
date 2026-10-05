/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { Loader2, Receipt, FileText } from "lucide-react";
import { generateCreditCharge } from "../actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatCurrency } from "../../billing/utils";

export function CashierDashboard({ visits, invoices = [] }: { visits: any[], invoices?: any[] }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Billing & Credit Charges</h2>
          <p className="text-slate-500 dark:text-slate-400">Process completed visits for Finance payroll deduction and view financial logs.</p>
        </div>
        <a href="/billing/reports" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors">
          View Monthly/Daily Reports &rarr;
        </a>
      </div>

      <div className="bg-white dark:bg-slate-900/50 shadow-sm rounded-xl border border-slate-200 dark:border-slate-800/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center">
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

      <div className="bg-white dark:bg-slate-900/50 shadow-sm rounded-xl border border-slate-200 dark:border-slate-800/60 flex flex-col mt-8 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30">
          <h3 className="font-bold text-slate-800 dark:text-slate-200">Finance Logs</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Recent invoices showing pre-discount/post-discount and usage details.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50/50 dark:bg-slate-900/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Lab Used</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Pharmacy Used</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Before Discount</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">After Discount</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
              {invoices.map(invoice => {
                const labs = invoice.labRequests?.map((lr: any) => lr.test?.name).filter(Boolean).join(", ") || "-";
                const pharmacy = invoice.prescriptionItems?.map((pi: any) => `${pi.drug?.name} (x${pi.quantity})`).filter(Boolean).join(", ") || "-";

                return (
                  <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {new Date(invoice.createdAt).toLocaleDateString()} {new Date(invoice.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                      {invoice.patient?.firstName} {invoice.patient?.lastName}
                      {invoice.discountPercentApplied > 0 && (
                        <span className="ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {invoice.discountPercentApplied}% OFF
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate" title={labs}>
                      {labs}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate" title={pharmacy}>
                      {pharmacy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 text-right">
                      {formatCurrency(invoice.subtotal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-slate-100 text-right">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {invoice.status === "paid" ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-300">
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:text-yellow-300">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                    No finance logs found.
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