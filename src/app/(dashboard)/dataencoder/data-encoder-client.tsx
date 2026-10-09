"use client";

import { useState } from "react";

import { approveInvoice, disapproveInvoice } from "@/features/dataencoder/actions";
import { toast } from "sonner";

import { Check, X, Printer, Download, Search } from "lucide-react";

type InvoiceDisplay = {
  id: string;
  createdAt: string;
  patientName: string;
  discountPercentApplied: number;
  subtotal: number;
  total: number;
  status: string;
  labUsed: string;
  pharmaUsed: string;
  discountAmount: number;
};

export function DataEncoderClient({ initialInvoices }: { initialInvoices: InvoiceDisplay[] }) {
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "disapproved">("pending");
  const [searchQuery, setSearchQuery] = useState("");

  const [executingApprove, setExecutingApprove] = useState(false);
  const [executingDisapprove, setExecutingDisapprove] = useState(false);

  const executeApprove = async (data: { invoiceId: string }) => {
    setExecutingApprove(true);
    try {
      const res = await approveInvoice(data);
      if (res.error) toast.error(res.error);
      else toast.success("Invoice approved");
    } finally {
      setExecutingApprove(false);
    }
  };

  const executeDisapprove = async (data: { invoiceId: string }) => {
    setExecutingDisapprove(true);
    try {
      const res = await disapproveInvoice(data);
      if (res.error) toast.error(res.error);
      else toast.success("Invoice disapproved");
    } finally {
      setExecutingDisapprove(false);
    }
  };

  const filtered = initialInvoices.filter(i => {
    const matchesTab = i.status === activeTab;
    const matchesSearch = 
      i.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      i.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const headers = ["Invoice Number", "Date", "Patient Name", "Discount %", "Lab Used", "Pharma Used", "Total", "Discount Amount"];
    const rows = filtered.map(i => [
      i.id,
      new Date(i.createdAt).toLocaleString(),
      i.patientName,
      `${i.discountPercentApplied}%`,
      i.labUsed,
      i.pharmaUsed,
      (i.total / 100).toFixed(2),
      (i.discountAmount / 100).toFixed(2)
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `data-encoder-${activeTab}-${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-slate-900 shadow rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col min-h-[500px]">
      <div className="border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:justify-between sm:items-center px-4 gap-4">
        <div className="flex gap-6 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab("pending")}
            className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "pending"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Queue (Quo)
          </button>
          <button
            onClick={() => setActiveTab("approved")}
            className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "approved"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setActiveTab("disapproved")}
            className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "disapproved"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Disapproved
          </button>
        </div>
        
        <div className="flex items-center gap-2 pb-4 sm:pb-0 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>
          {activeTab !== "pending" && (
            <>
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-md transition-colors whitespace-nowrap"
              >
                <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export</span>
              </button>
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-md transition-colors whitespace-nowrap"
              >
                <Printer className="w-4 h-4" /> <span className="hidden sm:inline">Print</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="p-0 overflow-x-auto print:p-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-sm">
              <th className="p-4 font-medium text-slate-600 dark:text-slate-400">Invoice Number</th>
              <th className="p-4 font-medium text-slate-600 dark:text-slate-400">Date</th>
              <th className="p-4 font-medium text-slate-600 dark:text-slate-400">Patient Name</th>
              <th className="p-4 font-medium text-slate-600 dark:text-slate-400">Discount %</th>
              <th className="p-4 font-medium text-slate-600 dark:text-slate-400">Lab Used</th>
              <th className="p-4 font-medium text-slate-600 dark:text-slate-400">Pharma Used</th>
              <th className="p-4 font-medium text-slate-600 dark:text-slate-400 text-right">Total</th>
              <th className="p-4 font-medium text-slate-600 dark:text-slate-400 text-right">Discount Amount</th>
              <th className="p-4 font-medium text-slate-600 dark:text-slate-400 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-500 dark:text-slate-400">
                  No records found.
                </td>
              </tr>
            ) : (
              filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 text-sm font-mono text-slate-600 dark:text-slate-400">{item.id.slice(-8)}</td>
                  <td className="p-4 text-sm text-slate-700 dark:text-slate-300">
                    {new Date(item.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-900 dark:text-slate-100">{item.patientName}</td>
                  <td className="p-4 text-sm text-slate-700 dark:text-slate-300">{item.discountPercentApplied}%</td>
                  <td className="p-4 text-sm text-slate-700 dark:text-slate-300 truncate max-w-[150px]" title={item.labUsed}>{item.labUsed}</td>
                  <td className="p-4 text-sm text-slate-700 dark:text-slate-300 truncate max-w-[150px]" title={item.pharmaUsed}>{item.pharmaUsed}</td>
                  <td className="p-4 text-sm font-medium text-slate-900 dark:text-slate-100 text-right">
                    {(item.total / 100).toFixed(2)}
                  </td>
                  <td className="p-4 text-sm text-red-600 dark:text-red-400 text-right font-medium">
                    {(item.discountAmount / 100).toFixed(2)}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {activeTab !== "approved" && (
                      <button
                        disabled={executingApprove || executingDisapprove}
                        onClick={() => executeApprove({ invoiceId: item.id })}
                        className="inline-flex items-center justify-center p-1.5 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 rounded-md transition-colors disabled:opacity-50"
                        title="Approve"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    {activeTab !== "disapproved" && (
                      <button
                        disabled={executingApprove || executingDisapprove}
                        onClick={() => executeDisapprove({ invoiceId: item.id })}
                        className="inline-flex items-center justify-center p-1.5 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-md transition-colors disabled:opacity-50"
                        title="Disapprove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
