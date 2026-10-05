"use client";

import { useState } from "react";
import { formatCurrency } from "@/features/billing/utils";
import { ChevronDown, ChevronRight } from "lucide-react";

export function ExpandablePatientRow({ agg, index }: { agg: any, index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr 
        onClick={() => setExpanded(!expanded)}
        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
      >
        <td className="px-6 py-4 whitespace-nowrap text-slate-400">
          {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
          {agg.patient.firstName} {agg.patient.lastName}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
          {agg.patient.employeeId || "-"}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-500">
          {agg.invoices.length}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-slate-900 dark:text-slate-100">
          {formatCurrency(agg.totalAmount)}
        </td>
      </tr>
      
      {expanded && (
        <tr>
          <td colSpan={5} className="p-0 border-b border-slate-200 dark:border-slate-800">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-l-4 border-indigo-500">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Expense Breakdown</h4>
              <div className="space-y-4">
                {agg.invoices.map((inv: any) => (
                  <div key={inv.id} className="bg-white dark:bg-slate-950 p-4 rounded border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-semibold text-slate-500">
                        {new Date(inv.createdAt).toLocaleString()}
                      </span>
                      <span className="text-xs font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                        Inv #{inv.id.slice(-6).toUpperCase()}
                      </span>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-slate-500 text-xs">
                          <th className="text-left font-medium pb-2">Item</th>
                          <th className="text-right font-medium pb-2">Qty</th>
                          <th className="text-right font-medium pb-2">Unit</th>
                          <th className="text-right font-medium pb-2">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {inv.items?.map((item: any) => (
                          <tr key={item.id}>
                            <td className="py-1.5 text-slate-700 dark:text-slate-300">{item.description}</td>
                            <td className="py-1.5 text-right text-slate-600 dark:text-slate-400">{item.quantity}</td>
                            <td className="py-1.5 text-right text-slate-600 dark:text-slate-400">{formatCurrency(item.unitPrice)}</td>
                            <td className="py-1.5 text-right font-medium text-slate-700 dark:text-slate-300">{formatCurrency(item.quantity * item.unitPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={3} className="text-right py-2 text-slate-500">Subtotal:</td>
                          <td className="text-right py-2 font-medium">{formatCurrency(inv.subtotal)}</td>
                        </tr>
                        {inv.discountPercentApplied > 0 && (
                          <tr>
                            <td colSpan={3} className="text-right py-1 text-green-600">Discount ({inv.discountPercentApplied}%):</td>
                            <td className="text-right py-1 font-medium text-green-600">
                              -{formatCurrency(inv.subtotal - inv.total)}
                            </td>
                          </tr>
                        )}
                        <tr>
                          <td colSpan={3} className="text-right py-2 font-bold text-slate-900 dark:text-slate-100">Final Charge:</td>
                          <td className="text-right py-2 font-bold text-slate-900 dark:text-slate-100">{formatCurrency(inv.total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
