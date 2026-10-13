"use client";

import { Printer, Download, Banknote, FileSpreadsheet, LayoutDashboard, Search, UserCheck } from "lucide-react";
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";

export type InvoiceReport = {
  invoiceNumber: string;
  patientName: string;
  patientType?: string;
  relationship?: string;
  staffMemberName: string;
  staffId: string;
  staffDepartment: string;
  encoderName: string;
  discountPercent: number;
  laboratoryCost: number;
  pharmacyCost: number;
  total: number;
  discountAmount: number;
  afterDiscount: number;
  date?: string;
};

export function ZReportsClient({ reports }: { reports: InvoiceReport[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEncoder, setSelectedEncoder] = useState("all");

  const encoders = useMemo(() => {
    const list = Array.from(new Set(reports.map(r => r.encoderName).filter(Boolean)));
    return list;
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchesSearch = !searchTerm.trim() || 
        r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.staffMemberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.staffId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesEncoder = selectedEncoder === "all" || r.encoderName === selectedEncoder;

      return matchesSearch && matchesEncoder;
    });
  }, [reports, searchTerm, selectedEncoder]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const headers = [
      "Date",
      "Invoice #",
      "Patient Name",
      "Relationship",
      "Staff Member (Salary Charge)",
      "Employee / Military ID",
      "Department",
      "Processed By (Encoder)",
      "Discount %",
      "Laboratory Cost (ETB)",
      "Pharmacy Cost (ETB)",
      "Total Pre-Discount (ETB)",
      "Discount Amount (ETB)",
      "Total After Discount (ETB)"
    ];

    const data = filteredReports.map(r => [
      r.date || "",
      r.invoiceNumber,
      r.patientName,
      r.relationship || "Self",
      r.staffMemberName,
      r.staffId,
      r.staffDepartment,
      r.encoderName,
      `${r.discountPercent}%`,
      (r.laboratoryCost / 100).toFixed(2),
      (r.pharmacyCost / 100).toFixed(2),
      (r.total / 100).toFixed(2),
      (r.discountAmount / 100).toFixed(2),
      (r.afterDiscount / 100).toFixed(2)
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Z-Report");
    XLSX.writeFile(workbook, `z-report-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const aggregates = useMemo(() => {
    return filteredReports.reduce(
      (acc, r) => {
        acc.total += r.total;
        acc.laboratoryCost += r.laboratoryCost;
        acc.pharmacyCost += r.pharmacyCost;
        acc.discountAmount += r.discountAmount;
        acc.afterDiscount += r.afterDiscount;
        return acc;
      },
      { total: 0, laboratoryCost: 0, pharmacyCost: 0, discountAmount: 0, afterDiscount: 0 }
    );
  }, [filteredReports]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Finance Print Header (only visible on print) */}
      <div className="hidden print:block text-center border-b pb-4 mb-4">
        <h1 className="text-2xl font-bold uppercase tracking-wider">Bure Card Clinic - Finance Reconciliation Z-Report</h1>
        <p className="text-xs text-slate-500 mt-1">
          Date Generated: {new Date().toLocaleDateString()} • Salary Deductions & Staff Credit Summary
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 print:hidden">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-slate-900 border border-blue-200/60 dark:border-blue-900/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Total (Pre-Discount)</span>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <LayoutDashboard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">{(aggregates.total / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-sm font-medium text-blue-600/80 dark:text-blue-400/80 mt-1">ETB</p>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-slate-900 border border-emerald-200/60 dark:border-emerald-900/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Total Charged to Salary</span>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
              <Banknote className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">{(aggregates.afterDiscount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-sm font-medium text-emerald-600/80 dark:text-emerald-400/80 mt-1">ETB</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/40 dark:to-slate-900 border border-purple-200/60 dark:border-purple-900/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Total Lab Cost</span>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
              <Banknote className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">{(aggregates.laboratoryCost / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-sm font-medium text-purple-600/80 dark:text-purple-400/80 mt-1">ETB</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/40 dark:to-slate-900 border border-red-200/60 dark:border-red-900/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Total Subsidies / Discounts</span>
            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
              <Banknote className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">{(aggregates.discountAmount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-sm font-medium text-red-600/80 dark:text-red-400/80 mt-1">ETB</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900/80 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-800/80 flex flex-col min-h-[500px] overflow-hidden">
        {/* Controls Bar */}
        <div className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">Staff Credit Z-Report Invoices</h2>
            <p className="text-xs text-slate-500 mt-0.5">Every transaction attributed to the staff member for Finance payroll deduction.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Filter by staff, patient, ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {encoders.length > 0 && (
              <select
                value={selectedEncoder}
                onChange={e => setSelectedEncoder(e.target.value)}
                className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">All Encoders</option>
                {encoders.map(enc => (
                  <option key={enc} value={enc}>{enc}</option>
                ))}
              </select>
            )}

            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 border border-green-700 hover:bg-green-700 rounded-lg transition-all shadow-sm print:hidden focus:ring-2 focus:ring-green-500 outline-none"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm print:hidden focus:ring-2 focus:ring-slate-200 outline-none"
            >
              <Printer className="w-3.5 h-3.5" /> Print Ledger
            </button>
          </div>
        </div>

        <div className="p-0 overflow-x-auto print:p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white dark:bg-slate-900 border-b-2 border-slate-100 dark:border-slate-800 text-[11px] uppercase tracking-wider">
                <th className="p-3.5 font-bold text-slate-500 dark:text-slate-400">Patient</th>
                <th className="p-3.5 font-bold text-slate-500 dark:text-slate-400">Staff Member (Salary Charge)</th>
                <th className="p-3.5 font-bold text-slate-500 dark:text-slate-400">Card / ID</th>
                <th className="p-3.5 font-bold text-slate-500 dark:text-slate-400">Encoder</th>
                <th className="p-3.5 font-bold text-slate-500 dark:text-slate-400 text-right">Discount</th>
                <th className="p-3.5 font-bold text-slate-500 dark:text-slate-400 text-right">Lab Cost</th>
                <th className="p-3.5 font-bold text-slate-500 dark:text-slate-400 text-right">Pharmacy Cost</th>
                <th className="p-3.5 font-bold text-slate-500 dark:text-slate-400 text-right">Total</th>
                <th className="p-3.5 font-bold text-slate-500 dark:text-slate-400 text-right">Discount Amt</th>
                <th className="p-3.5 font-bold text-slate-500 dark:text-slate-400 text-right">Charge to Salary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                      <LayoutDashboard className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No Z-Report transactions match.</p>
                  </td>
                </tr>
              ) : (
                filteredReports.map((item, idx) => (
                  <tr key={item.invoiceNumber} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${idx % 2 === 0 ? "bg-white dark:bg-slate-900/20" : "bg-slate-50/30 dark:bg-slate-900/40"}`}>
                    <td className="p-3.5 font-medium text-slate-800 dark:text-slate-200">
                      <div>{item.patientName}</div>
                      <div className="text-[10px] text-slate-400">{item.relationship || "Self"}</div>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-900 dark:text-slate-100">
                      <div>{item.staffMemberName}</div>
                      <div className="text-[10px] text-slate-500">{item.staffDepartment}</div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300 font-medium">
                      {item.staffId}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                      {item.encoderName}
                    </td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300 text-right font-medium">
                      {item.discountPercent}%
                    </td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300 text-right tabular-nums">
                      {(item.laboratoryCost / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300 text-right tabular-nums">
                      {(item.pharmacyCost / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300 text-right tabular-nums">
                      {(item.total / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3.5 text-red-500/90 dark:text-red-400 text-right tabular-nums">
                      {(item.discountAmount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3.5 font-black text-blue-600 dark:text-blue-400 text-right tabular-nums">
                      {(item.afterDiscount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Print Signatures Block (only shown on print) */}
        <div className="hidden print:grid grid-cols-3 gap-6 p-8 border-t border-slate-300 mt-12 text-xs">
          <div>
            <p className="font-bold">Prepared By (Data Encoder):</p>
            <div className="mt-8 border-b border-black w-48" />
            <p className="mt-1 text-slate-500">Signature & Date</p>
          </div>
          <div>
            <p className="font-bold">Verified By (Clinic Manager):</p>
            <div className="mt-8 border-b border-black w-48" />
            <p className="mt-1 text-slate-500">Signature & Date</p>
          </div>
          <div>
            <p className="font-bold">Received By (Finance / Payroll):</p>
            <div className="mt-8 border-b border-black w-48" />
            <p className="mt-1 text-slate-500">Signature & Date</p>
          </div>
        </div>
      </div>
    </div>
  );
}

