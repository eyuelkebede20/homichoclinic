"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import * as XLSX from "xlsx";

import { approveInvoice, disapproveInvoice } from "@/features/dataencoder/actions";
import { toast } from "sonner";

import { Check, X, Printer, Search, ArrowUpDown, ArrowUp, ArrowDown, FileSpreadsheet } from "lucide-react";
import { EthiopianDatePicker } from "@/components/ethiopian-date-picker";
import { 
  formatToEthiopianDate, 
  parseEthiopianDateString, 
  gregorianToEthiopian, 
  getCurrentEthiopianDate,
  ETHIOPIAN_MONTHS 
} from "@/lib/date-utils";

export type InvoiceDisplay = {
  id: string;
  createdAt: string;
  patientName: string;
  rank?: string;
  patientType: string;
  department?: string;
  employeeId?: string;
  discountPercentApplied: number;
  labCost: number;
  pharmaCost: number;
  subtotal: number;
  total: number;
  status: string;
  labUsed: string;
  pharmaUsed: string;
  remarks?: string;
  discountAmount: number;
};

export interface ClinicInfo {
  name: string;
  nameAmharic: string;
  logo?: string;
}

export interface DataEncoderClientProps {
  initialInvoices: InvoiceDisplay[];
  clinicInfo?: ClinicInfo;
  dateRange?: {
    from?: string;
    to?: string;
  };
}

function formatEmploymentStatus(type?: string): string {
  if (!type) return "ቋሚ";
  const lower = type.toLowerCase().trim();
  if (lower.includes("civilian staff") || lower === "staff" || lower === "civilian") return "ቋሚ";
  if (lower.includes("soldier") && !lower.includes("family")) return "ወታደር";
  if (lower.includes("soldier family")) return "የሰራዊት ቤተሰብ";
  if (lower.includes("civilian family") || lower.includes("family")) return "የሲቪል ቤተሰብ";
  if (lower.includes("guest")) return "እንግዳ";
  if (lower.includes("contract")) return "ኮንትራት";
  if (lower.includes("permanent")) return "ቋሚ";
  return type;
}

function formatEthDateRange(fromDateStr?: string, toDateStr?: string, invoices: InvoiceDisplay[] = []): string {
  const parsePart = (val?: string) => {
    if (!val) return null;
    const parsed = parseEthiopianDateString(val);
    if (parsed) return parsed;
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        const eth = gregorianToEthiopian(d);
        return { year: eth.year, month: eth.month, day: eth.date };
      }
    } catch {}
    return null;
  };

  let fromPart = parsePart(fromDateStr);
  let toPart = parsePart(toDateStr);

  if (!fromPart || !toPart) {
    if (invoices.length > 0) {
      const timestamps = invoices.map(i => new Date(i.createdAt).getTime()).filter(t => !isNaN(t));
      if (timestamps.length > 0) {
        const minDate = new Date(Math.min(...timestamps));
        const maxDate = new Date(Math.max(...timestamps));
        if (!fromPart) {
          const ethMin = gregorianToEthiopian(minDate);
          fromPart = { year: ethMin.year, month: ethMin.month, day: ethMin.date };
        }
        if (!toPart) {
          const ethMax = gregorianToEthiopian(maxDate);
          toPart = { year: ethMax.year, month: ethMax.month, day: ethMax.date };
        }
      }
    }
  }

  if (!fromPart) {
    const today = getCurrentEthiopianDate();
    fromPart = { year: today.year, month: today.month, day: today.date };
  }
  if (!toPart) {
    const today = getCurrentEthiopianDate();
    toPart = { year: today.year, month: today.month, day: today.date };
  }

  const getMonthNameAm = (m: number) => {
    const found = ETHIOPIAN_MONTHS.find(item => item.id === m);
    return found ? found.amharic : "መስከረም";
  };

  const fStr = `${getMonthNameAm(fromPart.month)}  ${String(fromPart.day).padStart(2, "0")}/${String(fromPart.month).padStart(2, "0")}/${fromPart.year}`;
  const tStr = `${getMonthNameAm(toPart.month)} ${String(toPart.day).padStart(2, "0")}/${String(toPart.month).padStart(2, "0")}/${toPart.year}`;

  return `ከ መስከረም  ${String(fromPart.day).padStart(2, "0")}/${String(fromPart.month).padStart(2, "0")}/${fromPart.year} አስከ  ${getMonthNameAm(toPart.month)} ${String(toPart.day).padStart(2, "0")}/${String(toPart.month).padStart(2, "0")}/${toPart.year} ዓ.ም `;
}

export function DataEncoderClient({ initialInvoices, clinicInfo, dateRange }: DataEncoderClientProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "disapproved">("pending");
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fromDate = searchParams.get("from") || dateRange?.from || "";
  const toDate = searchParams.get("to") || dateRange?.to || "";

  const handleDateChange = (type: "from" | "to", value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(type, value);
    } else {
      params.delete(type);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleClearDates = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("from");
    params.delete("to");
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
    | "rank"
    | "patientName" 
    | "patientType"
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
      i.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.rank && i.rank.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (i.patientType && i.patientType.toLowerCase().includes(searchQuery.toLowerCase()));
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

  // Aggregate totals
  const totalSubtotal = useMemo(() => {
    return sortedInvoices.reduce((sum, item) => sum + item.subtotal, 0);
  }, [sortedInvoices]);

  const totalDeducted = useMemo(() => {
    return sortedInvoices.reduce((sum, item) => sum + item.total, 0);
  }, [sortedInvoices]);

  const totalDiscountSubsidy = useMemo(() => {
    return sortedInvoices.reduce((sum, item) => sum + item.discountAmount, 0);
  }, [sortedInvoices]);

  const handlePrint = () => {
    window.print();
  };

  // Build Excel Worksheet matching 123.xlsx exactly
  const buildSheetForInvoices = (
    items: InvoiceDisplay[], 
    dateHeaderStr: string,
    divideDiscounts = false
  ) => {
    const row1 = [dateHeaderStr, "", "", "", "", "", "", ""];

    // Exact headers from c:\Users\kebe\Downloads\123.xlsx
    const headers = [
      "ተ.ቁ",
      "ማዕረግ",
      "ስም ዝርዝር ",
      1,
      "የሚቆረጥበቸው\n  የብር መጠን ",
      "በፐርሰንት ",
      "የቅጥር ሁኔታ",
      "መግለጫ"
    ];

    if (!divideDiscounts) {
      const dataRows = items.map((inv, idx) => [
        idx + 1,
        inv.rank && inv.rank !== "-" ? inv.rank : "-",
        inv.patientName,
        1,
        Number((inv.total / 100).toFixed(2)),
        `${inv.discountPercentApplied}%`,
        formatEmploymentStatus(inv.patientType),
        inv.remarks || (inv.pharmaUsed !== "-" ? inv.pharmaUsed : inv.labUsed !== "-" ? inv.labUsed : "-")
      ]);

      const emptyRow = ["", "", "", "", "", "", "", ""];
      const subSum = items.reduce((sum, i) => sum + i.subtotal, 0);
      const afterSum = items.reduce((sum, i) => sum + i.total, 0);

      // Exact Amharic total wording from 123.xlsx
      const totalRow1 = [
        "                                         ጠቅላላ ድምር 100%",
        "",
        "",
        "",
        Number((subSum / 100).toFixed(2)),
        "",
        "",
        ""
      ];

      const totalRow2 = [
        "አጠቃላይ የሚቆረጥባቸው ብር ",
        "",
        "",
        "",
        Number((afterSum / 100).toFixed(2)),
        "",
        "",
        ""
      ];

      const aoa = [
        row1,
        headers,
        ...dataRows,
        emptyRow,
        totalRow1,
        totalRow2
      ];

      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const rTot1 = 3 + items.length;
      const rTot2 = 4 + items.length;

      // Exact merges matching 123.xlsx: A1:H1, E5:F5, A6:D6, E6:F6
      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
        { s: { r: rTot1, c: 4 }, e: { r: rTot1, c: 5 } },
        { s: { r: rTot2, c: 0 }, e: { r: rTot2, c: 3 } },
        { s: { r: rTot2, c: 4 }, e: { r: rTot2, c: 5 } },
      ];

      ws["!cols"] = [
        { wch: 8 },   // ተ.ቁ
        { wch: 14 },  // ማዕረግ
        { wch: 30 },  // ስም ዝርዝር 
        { wch: 6 },   // 1
        { wch: 22 },  // የሚቆረጥበቸው\n  የብር መጠን 
        { wch: 12 },  // በፐርሰንት 
        { wch: 18 },  // የቅጥር ሁኔታ
        { wch: 35 },  // መግለጫ
      ];

      return ws;
    }

    // DIVIDED DISCOUNTS FOR "ALL" LIST
    const discountGroups = new Map<number, InvoiceDisplay[]>();
    items.forEach(inv => {
      const pct = inv.discountPercentApplied ?? 0;
      if (!discountGroups.has(pct)) discountGroups.set(pct, []);
      discountGroups.get(pct)!.push(inv);
    });

    const sortedPcts = Array.from(discountGroups.keys()).sort((a, b) => b - a);
    const aoa: any[][] = [row1, headers];
    const merges: XLSX.Range[] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
    ];

    let seq = 1;
    let grandSubtotal = 0;
    let grandDeduction = 0;

    sortedPcts.forEach((pct) => {
      const groupInvoices = discountGroups.get(pct)!;
      let groupSubtotal = 0;
      let groupDeduction = 0;

      groupInvoices.forEach((inv) => {
        grandSubtotal += inv.subtotal;
        grandDeduction += inv.total;
        groupSubtotal += inv.subtotal;
        groupDeduction += inv.total;

        aoa.push([
          seq++,
          inv.rank && inv.rank !== "-" ? inv.rank : "-",
          inv.patientName,
          1,
          Number((inv.total / 100).toFixed(2)),
          `${inv.discountPercentApplied}%`,
          formatEmploymentStatus(inv.patientType),
          inv.remarks || (inv.pharmaUsed !== "-" ? inv.pharmaUsed : inv.labUsed !== "-" ? inv.labUsed : "-")
        ]);
      });

      // Additional content row dividing the discounts
      const subRowIdx = aoa.length;
      aoa.push([
        `የ ${pct}% ቅናሽ ድምር (${pct}% Discount Subtotal)`,
        "",
        "",
        groupInvoices.length,
        Number((groupDeduction / 100).toFixed(2)),
        `${pct}%`,
        "",
        `ጠቅላላ ወጪ: ETB ${(groupSubtotal / 100).toFixed(2)}`
      ]);

      merges.push({ s: { r: subRowIdx, c: 0 }, e: { r: subRowIdx, c: 2 } });

      // Empty separator row
      aoa.push(["", "", "", "", "", "", "", ""]);
    });

    // Empty separator row before grand totals
    aoa.push(["", "", "", "", "", "", "", ""]);

    // Finally put the total one
    const rTot1 = aoa.length;
    aoa.push([
      "                                         ጠቅላላ ድምር 100%",
      "",
      "",
      "",
      Number((grandSubtotal / 100).toFixed(2)),
      "",
      "",
      ""
    ]);

    const rTot2 = aoa.length;
    aoa.push([
      "አጠቃላይ የሚቆረጥባቸው ብር ",
      "",
      "",
      "",
      Number((grandDeduction / 100).toFixed(2)),
      "",
      "",
      ""
    ]);

    merges.push({ s: { r: rTot1, c: 4 }, e: { r: rTot1, c: 5 } });
    merges.push({ s: { r: rTot2, c: 0 }, e: { r: rTot2, c: 3 } });
    merges.push({ s: { r: rTot2, c: 4 }, e: { r: rTot2, c: 5 } });

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!merges"] = merges;
    ws["!cols"] = [
      { wch: 8 },
      { wch: 14 },
      { wch: 30 },
      { wch: 6 },
      { wch: 22 },
      { wch: 12 },
      { wch: 18 },
      { wch: 35 },
    ];

    return ws;
  };

  const handleExport = () => {
    if (sortedInvoices.length === 0) {
      toast.error("No invoice records to export.");
      return;
    }

    const workbook = XLSX.utils.book_new();
    const dateHeaderStr = formatEthDateRange(fromDate, toDate, sortedInvoices);

    // 1. Master Worksheet: All Invoices (preserves current table sort order)
    const masterSheet = buildSheetForInvoices(sortedInvoices, dateHeaderStr, true);
    XLSX.utils.book_append_sheet(workbook, masterSheet, "All Invoices");

    // 2. Multiple Worksheets partitioned by % discount (preserves current table sort order)
    const discountGroups = new Map<number, InvoiceDisplay[]>();
    sortedInvoices.forEach(inv => {
      const pct = inv.discountPercentApplied ?? 0;
      if (!discountGroups.has(pct)) {
        discountGroups.set(pct, []);
      }
      discountGroups.get(pct)!.push(inv);
    });

    // Respect sort direction if sorted by discountPercentApplied, otherwise default descending
    const sortedPercents = Array.from(discountGroups.keys()).sort((a, b) => {
      if (sortField === "discountPercentApplied") {
        return sortDirection === "asc" ? a - b : b - a;
      }
      return b - a;
    });

    sortedPercents.forEach(pct => {
      const groupInvoices = discountGroups.get(pct)!;
      const groupSheet = buildSheetForInvoices(groupInvoices, dateHeaderStr);
      const sheetName = `${pct}% Discount`;
      XLSX.utils.book_append_sheet(workbook, groupSheet, sheetName);
    });

    const dateStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `DataEncoder-Invoices-${activeTab}-${dateStr}.xlsx`);
    toast.success(`Exported Excel workbook matching ledger format with ${sortedPercents.length + 1} worksheets!`);
  };

  const dateHeaderDisplay = formatEthDateRange(fromDate, toDate, sortedInvoices);

  return (
    <>
      <style jsx global>{`
        @page {
          size: A4 landscape;
          margin: 8mm 8mm;
        }
        @media print {
          body {
            background: #fff !important;
            color: #000 !important;
            font-size: 11px !important;
          }
          nav, aside, header, footer {
            display: none !important;
          }
          .print-full-width {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #94a3b8 !important;
            padding: 4px 6px !important;
          }
          th {
            background-color: #f1f5f9 !important;
            color: #000 !important;
            font-weight: 700 !important;
          }
          tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Official Print Header: Visible ONLY when printing */}
      <div className="hidden print:block mb-4 border-b-2 border-slate-900 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {clinicInfo?.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={clinicInfo.logo} alt="Clinic Logo" className="w-12 h-12 object-contain" />
            )}
            <div>
              {clinicInfo?.nameAmharic && (
                <div className="text-base font-bold text-slate-900">{clinicInfo.nameAmharic}</div>
              )}
              <div className="text-sm font-extrabold uppercase text-slate-900 tracking-wider">
                {clinicInfo?.name || "Bure Card Clinic"}
              </div>
            </div>
          </div>
          <div className="text-right text-xs">
            <div className="font-bold text-slate-900">የዳታ ኢንኮደር እና የክፍያ ማጠቃለያ ሪፖርት</div>
            <div className="text-[11px] text-slate-700">Data Encoder Reconciliation Ledger</div>
            <div className="text-[10px] text-slate-500 mt-1">
              የታተመበት: {formatToEthiopianDate(new Date(), { format: "full" })}
            </div>
          </div>
        </div>
        <div className="mt-2 text-center text-xs font-bold bg-slate-100 py-1 rounded border border-slate-300">
          {dateHeaderDisplay}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 shadow rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col min-h-[500px] print-full-width">
        {/* Top Control Bar: Hidden on print */}
        <div className="border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:justify-between sm:items-center px-4 gap-4 print:hidden">
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
            <div className="flex items-center gap-2 mr-2">
              <div className="w-40 sm:w-44">
                <EthiopianDatePicker
                  value={fromDate}
                  onChange={(val) => handleDateChange("from", val)}
                  placeholder="ከ ቀን (Start Date)"
                  mode="ethiopian-date"
                />
              </div>
              <span className="text-sm text-slate-500">-</span>
              <div className="w-40 sm:w-44">
                <EthiopianDatePicker
                  value={toDate}
                  onChange={(val) => handleDateChange("to", val)}
                  placeholder="እስከ ቀን (Finish Date)"
                  mode="ethiopian-date"
                />
              </div>
              {(fromDate || toDate) && (
                <button
                  type="button"
                  onClick={handleClearDates}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  title="Clear Date Filter"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient, rank, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>
            {activeTab !== "pending" && (
              <>
                <button 
                  onClick={handleExport}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 rounded-md border border-emerald-200 dark:border-emerald-800 transition-colors whitespace-nowrap shadow-xs cursor-pointer"
                  title="Export workbook with Amharic headers and multi-sheet discount partitions"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> 
                  <span className="hidden sm:inline">Export Excel</span>
                </button>
                <button 
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                  title="Print sorted ledger table in A4 format"
                >
                  <Printer className="w-4 h-4" /> 
                  <span className="hidden sm:inline">Print</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Invoices Table: Reflects sorting both on screen and in print */}
        <div className="p-0 overflow-x-auto print:p-0 print:overflow-visible">
          <table className="w-full text-left border-collapse min-w-[850px] print:min-w-0 print:w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 print:text-[10px] print:bg-slate-100 print:text-black">
                {/* 1. ተ.ቁ */}
                <th 
                  onClick={() => toggleSort("id")}
                  className="p-3 font-semibold cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors print:cursor-default"
                  style={{ width: "6%" }}
                >
                  <div className="flex items-center gap-1">
                    <span>ተ.ቁ</span>
                    <span className="print:hidden">
                      {sortField === "id" ? (
                        sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </span>
                  </div>
                </th>

                {/* 2. ማዕረግ */}
                <th 
                  onClick={() => toggleSort("rank")}
                  className="p-3 font-semibold cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors print:cursor-default"
                  style={{ width: "9%" }}
                >
                  <div className="flex items-center gap-1">
                    <span>ማዕረግ</span>
                    <span className="print:hidden">
                      {sortField === "rank" ? (
                        sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </span>
                  </div>
                </th>

                {/* 3. ስም ዝርዝር */}
                <th 
                  onClick={() => toggleSort("patientName")}
                  className="p-3 font-semibold cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors print:cursor-default"
                  style={{ width: "20%" }}
                >
                  <div className="flex items-center gap-1">
                    <span>ስም ዝርዝር</span>
                    <span className="print:hidden">
                      {sortField === "patientName" ? (
                        sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </span>
                  </div>
                </th>

                {/* 4. 1 (Count/Quantity - matching 123.xlsx) */}
                <th className="p-3 font-semibold text-center" style={{ width: "5%" }}>
                  <span>1</span>
                </th>

                {/* 5. የሚቆረጥባቸው የብር መጠን */}
                <th 
                  onClick={() => toggleSort("total")}
                  className="p-3 font-semibold text-right cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors print:cursor-default"
                  style={{ width: "14%" }}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span className="leading-tight">የሚቆረጥባቸው<br className="hidden print:inline" /> የብር መጠን</span>
                    <span className="print:hidden">
                      {sortField === "total" ? (
                        sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </span>
                  </div>
                </th>

                {/* 6. በፐርሰንት */}
                <th 
                  onClick={() => toggleSort("discountPercentApplied")}
                  className="p-3 font-semibold text-center cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors print:cursor-default"
                  style={{ width: "9%" }}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>በፐርሰንት</span>
                    <span className="print:hidden">
                      {sortField === "discountPercentApplied" ? (
                        sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </span>
                  </div>
                </th>

                {/* 7. የቅጥር ሁኔታ */}
                <th 
                  onClick={() => toggleSort("patientType")}
                  className="p-3 font-semibold cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors print:cursor-default"
                  style={{ width: "12%" }}
                >
                  <div className="flex items-center gap-1">
                    <span>የቅጥር ሁኔታ</span>
                    <span className="print:hidden">
                      {sortField === "patientType" ? (
                        sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </span>
                  </div>
                </th>

                {/* 8. መግለጫ */}
                <th className="p-3 font-semibold" style={{ width: "18%" }}>
                  <span>መግለጫ</span>
                </th>

                {/* Signature column for print & queue */}
                {activeTab === "pending" && (
                  <th className="p-3 font-semibold text-center" style={{ width: "8%" }}>
                    <span>ፊርማ</span>
                  </th>
                )}

                {/* Action buttons column: Hidden in print */}
                <th className="p-3 font-semibold text-right print:hidden" style={{ width: "8%" }}>
                  <span>Action</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {sortedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === "pending" ? 10 : 9} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    ምንም የተገኘ መረጃ የለም (No records found).
                  </td>
                </tr>
              ) : (
                sortedInvoices.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors print:hover:bg-transparent">
                    {/* 1. ተ.ቁ */}
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-400 print:text-black">
                      {idx + 1}
                    </td>

                    {/* 2. ማዕረግ */}
                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200 print:text-black">
                      {item.rank && item.rank !== "-" ? item.rank : "-"}
                    </td>

                    {/* 3. ስም ዝርዝር */}
                    <td className="p-3 font-semibold text-slate-900 dark:text-slate-100 print:text-black">
                      {item.patientName}
                    </td>

                    {/* 4. 1 */}
                    <td className="p-3 text-center text-slate-700 dark:text-slate-300 print:text-black">
                      1
                    </td>

                    {/* 5. የሚቆረጥባቸው የብር መጠን */}
                    <td className="p-3 font-bold text-blue-600 dark:text-blue-400 text-right print:text-black">
                      {(item.total / 100).toFixed(2)}
                    </td>

                    {/* 6. በፐርሰንት */}
                    <td className="p-3 text-center font-medium text-slate-700 dark:text-slate-300 print:text-black">
                      {item.discountPercentApplied}%
                    </td>

                    {/* 7. የቅጥር ሁኔታ */}
                    <td className="p-3 text-slate-700 dark:text-slate-300 print:text-black">
                      {formatEmploymentStatus(item.patientType)}
                    </td>

                    {/* 8. መግለጫ */}
                    <td className="p-3 text-slate-600 dark:text-slate-400 text-[11px] print:text-black max-w-[200px] truncate print:max-w-none print:whitespace-normal">
                      {item.remarks || (item.pharmaUsed !== "-" ? item.pharmaUsed : item.labUsed !== "-" ? item.labUsed : "-")}
                    </td>

                    {/* Pending signature line */}
                    {activeTab === "pending" && (
                      <td className="p-3 text-center">
                        <div className="w-16 border-b border-slate-300 dark:border-slate-600 mx-auto print:border-black"></div>
                      </td>
                    )}

                    {/* Action buttons: Hidden in print */}
                    <td className="p-3 text-right space-x-2 print:hidden">
                      {activeTab !== "approved" && (
                        <button
                          disabled={executingApprove || executingDisapprove}
                          onClick={() => executeApprove({ invoiceId: item.id })}
                          className="inline-flex items-center justify-center p-1.5 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                          title="Approve"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {activeTab !== "disapproved" && (
                        <button
                          disabled={executingApprove || executingDisapprove}
                          onClick={() => executeDisapprove({ invoiceId: item.id })}
                          className="inline-flex items-center justify-center p-1.5 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
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

            {/* Final Totals using exact Amharic wording from 123.xlsx */}
            {sortedInvoices.length > 0 && (
              <tfoot className="border-t-2 border-slate-400 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/80 font-bold text-xs print:bg-slate-100 print:text-black">
                {/* Total Row 1: ጠቅላላ ድምር 100% */}
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <td colSpan={4} className="p-3 text-right font-extrabold text-slate-800 dark:text-slate-200 print:text-black">
                    ጠቅላላ ድምር 100%
                  </td>
                  <td className="p-3 text-right font-extrabold text-slate-900 dark:text-slate-100 print:text-black">
                    {(totalSubtotal / 100).toFixed(2)}
                  </td>
                  <td colSpan={activeTab === "pending" ? 5 : 4} className="p-3 text-slate-500 text-[11px] print:text-black">
                    (ድምር የክሊኒክ አገልግሎት ወጪ)
                  </td>
                </tr>

                {/* Total Row 2: አጠቃላይ የሚቆረጥባቸው ብር */}
                <tr className="border-b border-slate-300 dark:border-slate-700">
                  <td colSpan={4} className="p-3 text-right font-extrabold text-blue-700 dark:text-blue-400 print:text-black">
                    አጠቃላይ የሚቆረጥባቸው ብር
                  </td>
                  <td className="p-3 text-right font-extrabold text-blue-700 dark:text-blue-400 text-sm print:text-black">
                    {(totalDeducted / 100).toFixed(2)}
                  </td>
                  <td colSpan={activeTab === "pending" ? 5 : 4} className="p-3 text-slate-500 text-[11px] print:text-black">
                    (ከደመወዝ የሚቆረጥ ጠቅላላ የተጣራ ብር • ድጎማ: {(totalDiscountSubsidy / 100).toFixed(2)} ብር)
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Official Signoff Block for Printouts */}
      <div className="hidden print:grid grid-cols-2 gap-12 mt-8 pt-6 text-xs text-slate-900 break-inside-avoid">
        <div>
          <div className="border-b border-black h-8 mb-1"></div>
          <div className="font-bold">ያዘጋጀው ዳታ ኢንኮደር (Prepared By Data Encoder)</div>
          <div className="text-[10px] text-slate-600">ስም፣ ፊርማ እና ቀን (Name, Signature & Date)</div>
        </div>
        <div>
          <div className="border-b border-black h-8 mb-1"></div>
          <div className="font-bold">ያረጋገጠው የፋይናንስ ኦፊሰር / ተቆጣጣሪ (Verified By Finance / Auditor)</div>
          <div className="text-[10px] text-slate-600">ስም፣ ፊርማ እና ማህተም (Name, Signature & Stamp)</div>
        </div>
      </div>
    </>
  );
}
