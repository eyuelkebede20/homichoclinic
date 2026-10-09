"use client";

import { Printer, Download, Banknote, CreditCard, Building2, TrendingDown, LayoutDashboard } from "lucide-react";
import { useMemo } from "react";

type DailyReport = {
  date: string;
  employeeName: string;
  totalRevenue: number;
  totalDiscounts: number;
  cash: number;
  card: number;
  transfer: number;
  invoiceCount: number;
};

export function ZReportsClient({ reports }: { reports: DailyReport[] }) {
  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const headers = ["Date", "Employee", "Total Revenue", "Cash", "Card", "Transfer", "Discounts", "Invoices"];
    const rows = reports.map(r => [
      r.date,
      r.employeeName,
      (r.totalRevenue / 100).toFixed(2),
      (r.cash / 100).toFixed(2),
      (r.card / 100).toFixed(2),
      (r.transfer / 100).toFixed(2),
      (r.totalDiscounts / 100).toFixed(2),
      r.invoiceCount
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `z-report-${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const aggregates = useMemo(() => {
    return reports.reduce(
      (acc, r) => {
        acc.totalRevenue += r.totalRevenue;
        acc.cash += r.cash;
        acc.card += r.card;
        acc.transfer += r.transfer;
        acc.totalDiscounts += r.totalDiscounts;
        return acc;
      },
      { totalRevenue: 0, cash: 0, card: 0, transfer: 0, totalDiscounts: 0 }
    );
  }, [reports]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 print:hidden">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-slate-900 border border-blue-200/60 dark:border-blue-900/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Total Revenue</span>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <LayoutDashboard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">{(aggregates.totalRevenue / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-sm font-medium text-blue-600/80 dark:text-blue-400/80 mt-1">ETB</p>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-slate-900 border border-emerald-200/60 dark:border-emerald-900/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Cash</span>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
              <Banknote className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">{(aggregates.cash / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-sm font-medium text-emerald-600/80 dark:text-emerald-400/80 mt-1">ETB</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/40 dark:to-slate-900 border border-purple-200/60 dark:border-purple-900/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Card</span>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
              <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">{(aggregates.card / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-sm font-medium text-purple-600/80 dark:text-purple-400/80 mt-1">ETB</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/40 dark:to-slate-900 border border-indigo-200/60 dark:border-indigo-900/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Transfers</span>
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
              <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">{(aggregates.transfer / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-sm font-medium text-indigo-600/80 dark:text-indigo-400/80 mt-1">ETB</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/40 dark:to-slate-900 border border-red-200/60 dark:border-red-900/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Discounts</span>
            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">{(aggregates.totalDiscounts / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-sm font-medium text-red-600/80 dark:text-red-400/80 mt-1">ETB</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900/80 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-800/80 flex flex-col min-h-[500px] overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900 flex justify-between items-center p-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">Daily Summaries</h2>
          <div className="flex gap-3">
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm print:hidden focus:ring-2 focus:ring-slate-200 outline-none"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm print:hidden focus:ring-2 focus:ring-slate-200 outline-none"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>

        <div className="p-0 overflow-x-auto print:p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white dark:bg-slate-900 border-b-2 border-slate-100 dark:border-slate-800 text-xs uppercase tracking-wider">
                <th className="p-5 font-bold text-slate-500 dark:text-slate-400">Date</th>
                <th className="p-5 font-bold text-slate-500 dark:text-slate-400">Employee</th>
                <th className="p-5 font-bold text-slate-500 dark:text-slate-400 text-right">Revenue</th>
                <th className="p-5 font-bold text-slate-500 dark:text-slate-400 text-right">Cash</th>
                <th className="p-5 font-bold text-slate-500 dark:text-slate-400 text-right">Card</th>
                <th className="p-5 font-bold text-slate-500 dark:text-slate-400 text-right">Transfer</th>
                <th className="p-5 font-bold text-slate-500 dark:text-slate-400 text-right">Discounts</th>
                <th className="p-5 font-bold text-slate-500 dark:text-slate-400 text-right">Invoices</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                      <LayoutDashboard className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No Z-Reports generated yet.</p>
                  </td>
                </tr>
              ) : (
                reports.map((item, idx) => (
                  <tr key={`${item.date}-${item.employeeName}`} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${idx % 2 === 0 ? "bg-white dark:bg-slate-900/20" : "bg-slate-50/30 dark:bg-slate-900/40"}`}>
                    <td className="p-5 text-sm font-bold text-slate-900 dark:text-slate-100">{item.date}</td>
                    <td className="p-5 text-sm font-medium text-slate-700 dark:text-slate-300">{item.employeeName}</td>
                    <td className="p-5 text-sm font-black text-blue-600 dark:text-blue-400 text-right tabular-nums">
                      {(item.totalRevenue / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-5 text-sm font-medium text-slate-700 dark:text-slate-300 text-right tabular-nums">
                      {(item.cash / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-5 text-sm font-medium text-slate-700 dark:text-slate-300 text-right tabular-nums">
                      {(item.card / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-5 text-sm font-medium text-slate-700 dark:text-slate-300 text-right tabular-nums">
                      {(item.transfer / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-5 text-sm font-semibold text-red-500/90 dark:text-red-400 text-right tabular-nums">
                      {(item.totalDiscounts / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-5 text-sm font-bold text-slate-500 dark:text-slate-400 text-right tabular-nums">
                      {item.invoiceCount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
