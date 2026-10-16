"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import * as XLSX from "xlsx";

import { approveInvoice, disapproveInvoice } from "@/features/dataencoder/actions";
import { toast } from "sonner";

import { Check, X, Printer, Download, Search, ArrowUpDown, ArrowUp, ArrowDown, FileSpreadsheet } from "lucide-react";
import { EthiopianDatePicker } from "@/components/ethiopian-date-picker";
import { formatToEthiopianDate } from "@/lib/date-utils";

type InvoiceDisplay = {
  id: string;
  createdAt: string;
  patientName: string;
  patientType: string;
  discountPercentApplied: number;
  labCost: number;
  pharmaCost: number;
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

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fromDate = searchParams.get("from") || "";
  const toDate = searchParams.get("to") || "";

  const handleDateChange = (type: "from" | "to", value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(type, value);
    } else {
      params.delete(type);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 15000); // 15 seconds
    return () => clearInterval(interval);
  }, [router]);

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

  type SortField = 
    | "id" 
    | "patientName" 
    | "discountPercentApplied" 
    | "labCost" 
    | "pharmaCost" 
    | "subtotal" 
    | "discountAmount" 
    | "total" 
    | "createdAt";

  type SortDirection = "asc" | "desc";

  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "createdAt" || field === "subtotal" || field === "total" ? "desc" : "asc");
    }
  };

  const filtered = initialInvoices.filter(i => {
    const matchesTab = activeTab === "approved" 
      ? (i.status === "approved" || i.status === "paid")
      : i.status === activeTab;
    const matchesSearch = 
      i.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      i.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const sortedInvoices = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === "string" && typeof bVal === "string") {
        const cmp = aVal.localeCompare(bVal);
        return sortDirection === "asc" ? cmp : -cmp;
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
    return list;
  }, [filtered, sortField, sortDirection]);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (sortedInvoices.length === 0) {
      toast.error("No invoice records to export.");
      return;
    }

    const workbook = XLSX.utils.book_new();

    const headers = [
      "Invoice Number", 
      "Patient Full Name", 
      "Patient Type", 
      "Discount %", 
      "Laboratory Cost (ETB)", 
      "Pharmacy Cost (ETB)", 
      "Subtotal (ETB)", 
      "Discount Subsidy (ETB)", 
      "Total Charged (ETB)",
      "Status",
      "Date Created"
    ];

    const formatRow = (i: InvoiceDisplay) => [
      i.id.slice(-8),
      i.patientName,
      i.patientType || "N/A",
      `${i.discountPercentApplied}%`,
      Number((i.labCost / 100).toFixed(2)),
      Number((i.pharmaCost / 100).toFixed(2)),
      Number((i.subtotal / 100).toFixed(2)),
      Number((i.discountAmount / 100).toFixed(2)),
      Number((i.total / 100).toFixed(2)),
      i.status.toUpperCase(),
      formatToEthiopianDate(i.createdAt)
    ];

    const computeTotalsRow = (items: InvoiceDisplay[]) => {
      const totalLab = items.reduce((sum, item) => sum + item.labCost, 0);
      const totalPharma = items.reduce((sum, item) => sum + item.pharmaCost, 0);
      const totalSub = items.reduce((sum, item) => sum + item.subtotal, 0);
      const totalDisc = items.reduce((sum, item) => sum + item.discountAmount, 0);
      const totalAfter = items.reduce((sum, item) => sum + item.total, 0);

      return [
        "TOTAL",
        `${items.length} Invoices`,
        "-",
        "-",
        Number((totalLab / 100).toFixed(2)),
        Number((totalPharma / 100).toFixed(2)),
        Number((totalSub / 100).toFixed(2)),
        Number((totalDisc / 100).toFixed(2)),
        Number((totalAfter / 100).toFixed(2)),
        "-",
        "-"
      ];
    };

    // 1. Master Worksheet: All Invoices
    const masterRows = sortedInvoices.map(formatRow);
    const masterTotals = computeTotalsRow(sortedInvoices);
    const masterSheet = XLSX.utils.aoa_to_sheet([headers, ...masterRows, [], masterTotals]);
    XLSX.utils.book_append_sheet(workbook, masterSheet, "All Invoices");

    // 2. Multiple Worksheets partitioned by % discount
    const discountGroups = new Map<number, InvoiceDisplay[]>();
    sortedInvoices.forEach(inv => {
      const pct = inv.discountPercentApplied ?? 0;
      if (!discountGroups.has(pct)) {
        discountGroups.set(pct, []);
      }
      discountGroups.get(pct)!.push(inv);
    });

    // Sort discount percentages descending (e.g. 100%, 95%, 50%, 0%)
    const sortedPercents = Array.from(discountGroups.keys()).sort((a, b) => b - a);

    sortedPercents.forEach(pct => {
      const groupInvoices = discountGroups.get(pct)!;
      const groupRows = groupInvoices.map(formatRow);
      const groupTotals = computeTotalsRow(groupInvoices);
      const groupSheet = XLSX.utils.aoa_to_sheet([headers, ...groupRows, [], groupTotals]);
      
      const sheetName = `${pct}% Discount`;
      XLSX.utils.book_append_sheet(workbook, groupSheet, sheetName);
    });

    const dateStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `DataEncoder-Invoices-${activeTab}-${dateStr}.xlsx`);
    toast.success(`Exported Excel workbook with ${sortedPercents.length + 1} worksheets!`);
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
        
        <div className="flex flex-wrap items-center gap-2 pb-4 sm:pb-0 w-full sm:w-auto">
          {activeTab !== "pending" && (
            <div className="flex items-center gap-2 mr-2">
              <div className="w-44">
                <EthiopianDatePicker
                  value={fromDate}
                  onChange={(val) => handleDateChange("from", val)}
                  placeholder="ከ ቀን (From date)"
                  mode="ethiopian-date"
                />
              </div>
              <span className="text-sm text-slate-500">-</span>
              <div className="w-44">
                <EthiopianDatePicker
                  value={toDate}
                  onChange={(val) => handleDateChange("to", val)}
                  placeholder="እስከ ቀን (To date)"
                  mode="ethiopian-date"
                />
              </div>
            </div>
          )}
          <div className="relative flex-1 sm:w-48">
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
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 rounded-md border border-emerald-200 dark:border-emerald-800 transition-colors whitespace-nowrap shadow-xs"
                title="Export workbook with separate worksheets for each % discount"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> <span className="hidden sm:inline">Export Multi-Sheet Excel</span>
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
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-sm">
              <th 
                onClick={() => toggleSort("id")}
                className="p-4 font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Invoice Number</span>
                  {sortField === "id" ? (
                    sortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
                  )}
                </div>
              </th>
              <th 
                onClick={() => toggleSort("patientName")}
                className="p-4 font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Full Name</span>
                  {sortField === "patientName" ? (
                    sortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
                  )}
                </div>
              </th>
              <th 
                onClick={() => toggleSort("discountPercentApplied")}
                className="p-4 font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Discount %</span>
                  {sortField === "discountPercentApplied" ? (
                    sortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
                  )}
                </div>
              </th>
              <th 
                onClick={() => toggleSort("labCost")}
                className="p-4 font-medium text-slate-600 dark:text-slate-400 text-right cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Laboratory Cost</span>
                  {sortField === "labCost" ? (
                    sortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
                  )}
                </div>
              </th>
              <th 
                onClick={() => toggleSort("pharmaCost")}
                className="p-4 font-medium text-slate-600 dark:text-slate-400 text-right cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Pharmacy Cost</span>
                  {sortField === "pharmaCost" ? (
                    sortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
                  )}
                </div>
              </th>
              <th 
                onClick={() => toggleSort("subtotal")}
                className="p-4 font-medium text-slate-600 dark:text-slate-400 text-right cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Total</span>
                  {sortField === "subtotal" ? (
                    sortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
                  )}
                </div>
              </th>
              <th 
                onClick={() => toggleSort("discountAmount")}
                className="p-4 font-medium text-slate-600 dark:text-slate-400 text-right cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Discount Amount</span>
                  {sortField === "discountAmount" ? (
                    sortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
                  )}
                </div>
              </th>
              <th 
                onClick={() => toggleSort("total")}
                className="p-4 font-medium text-slate-600 dark:text-slate-400 text-right cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>After Discount</span>
                  {sortField === "total" ? (
                    sortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
                  )}
                </div>
              </th>
              {activeTab === "pending" && (
                <th className="p-4 font-medium text-slate-600 dark:text-slate-400 text-center">Signature</th>
              )}
              <th className="p-4 font-medium text-slate-600 dark:text-slate-400 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {sortedInvoices.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-500 dark:text-slate-400">
                  No records found.
                </td>
              </tr>
            ) : (
              sortedInvoices.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 text-sm font-mono text-slate-600 dark:text-slate-400">{item.id.slice(-8)}</td>
                  <td className="p-4 text-sm font-medium text-slate-900 dark:text-slate-100">{item.patientName}</td>
                  <td className="p-4 text-sm text-slate-700 dark:text-slate-300">{item.discountPercentApplied}%</td>
                  <td className="p-4 text-sm text-slate-700 dark:text-slate-300 text-right">{(item.labCost / 100).toFixed(2)}</td>
                  <td className="p-4 text-sm text-slate-700 dark:text-slate-300 text-right">{(item.pharmaCost / 100).toFixed(2)}</td>
                  <td className="p-4 text-sm font-medium text-slate-900 dark:text-slate-100 text-right">
                    {(item.subtotal / 100).toFixed(2)}
                  </td>
                  <td className="p-4 text-sm text-red-600 dark:text-red-400 text-right font-medium">
                    {(item.discountAmount / 100).toFixed(2)}
                  </td>
                  <td className="p-4 text-sm font-medium text-blue-600 dark:text-blue-400 text-right">
                    {(item.total / 100).toFixed(2)}
                  </td>
                  {activeTab === "pending" && (
                    <td className="p-4 text-sm text-slate-700 dark:text-slate-300 text-center">
                      <div className="w-16 border-b border-slate-300 dark:border-slate-600 mx-auto print:border-black"></div>
                    </td>
                  )}
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
