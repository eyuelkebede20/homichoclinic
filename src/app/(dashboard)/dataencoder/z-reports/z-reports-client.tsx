"use client";

import { Printer, Download, Banknote, FileSpreadsheet, LayoutDashboard, Search, UserCheck, Eye, X, Layers, List, CheckCircle2, Calendar, FileText, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export type InvoiceItemDetail = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: "Laboratory" | "Pharmacy" | "Clinical / Service";
};

export type InvoiceReport = {
  invoiceNumber: string;
  createdAt?: string;
  date?: string;
  time?: string;
  patientName: string;
  patientType?: string;
  relationship?: string;
  staffMemberName: string;
  staffId: string;
  staffDepartment: string;
  staffType?: string;
  encoderName: string;
  discountPercent: number;
  laboratoryCost: number;
  pharmacyCost: number;
  total: number;
  discountAmount: number;
  afterDiscount: number;
  items: InvoiceItemDetail[];
};

export type GroupedStaffCredit = {
  key: string;
  staffMemberName: string;
  staffId: string;
  staffDepartment: string;
  staffType: string;
  transactionCount: number;
  patientsCovered: string[];
  discountPercent: number;
  laboratoryCost: number;
  pharmacyCost: number;
  total: number;
  discountAmount: number;
  afterDiscount: number;
  transactions: InvoiceReport[];
};

export type ClinicInfo = {
  name: string;
  nameAmharic: string;
  logo?: string;
};

export function ZReportsClient({ reports, clinicInfo }: { reports: InvoiceReport[]; clinicInfo?: ClinicInfo }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEncoder, setSelectedEncoder] = useState("all");
  const [viewMode, setViewMode] = useState<"grouped" | "individual">("grouped");
  const [selectedCreditGroup, setSelectedCreditGroup] = useState<GroupedStaffCredit | null>(null);

  const encoders = useMemo(() => {
    const list = Array.from(new Set(reports.map(r => r.encoderName).filter(Boolean)));
    return list;
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q || 
        r.patientName.toLowerCase().includes(q) ||
        r.staffMemberName.toLowerCase().includes(q) ||
        r.staffId.toLowerCase().includes(q) ||
        r.invoiceNumber.toLowerCase().includes(q) ||
        r.staffDepartment.toLowerCase().includes(q);
      
      const matchesEncoder = selectedEncoder === "all" || r.encoderName === selectedEncoder;

      return matchesSearch && matchesEncoder;
    });
  }, [reports, searchTerm, selectedEncoder]);

  // Group similar user credits into one row
  const groupedStaffCredits = useMemo(() => {
    const map = new Map<string, GroupedStaffCredit>();

    filteredReports.forEach(r => {
      const key = (r.staffId && r.staffId !== "N/A") 
        ? `${r.staffId}__${r.staffMemberName.toLowerCase().trim()}`
        : r.staffMemberName.toLowerCase().trim();

      if (!map.has(key)) {
        map.set(key, {
          key,
          staffMemberName: r.staffMemberName,
          staffId: r.staffId,
          staffDepartment: r.staffDepartment,
          staffType: r.staffType || "Staff",
          transactionCount: 0,
          patientsCovered: [],
          discountPercent: r.discountPercent,
          laboratoryCost: 0,
          pharmacyCost: 0,
          total: 0,
          discountAmount: 0,
          afterDiscount: 0,
          transactions: [],
        });
      }

      const grp = map.get(key)!;
      grp.transactionCount += 1;
      grp.laboratoryCost += r.laboratoryCost;
      grp.pharmacyCost += r.pharmacyCost;
      grp.total += r.total;
      grp.discountAmount += r.discountAmount;
      grp.afterDiscount += r.afterDiscount;
      grp.transactions.push(r);

      const patientLabel = `${r.patientName} (${r.relationship || "Self"})`;
      if (!grp.patientsCovered.includes(patientLabel)) {
        grp.patientsCovered.push(patientLabel);
      }
    });

    return Array.from(map.values()).sort((a, b) => b.afterDiscount - a.afterDiscount);
  }, [filteredReports]);

  // Overall aggregates
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

  type GroupedSortField =
    | "staffMemberName"
    | "staffId"
    | "transactionCount"
    | "discountPercent"
    | "laboratoryCost"
    | "pharmacyCost"
    | "total"
    | "discountAmount"
    | "afterDiscount";

  type IndivSortField =
    | "date"
    | "invoiceNumber"
    | "patientName"
    | "staffMemberName"
    | "staffId"
    | "encoderName"
    | "discountPercent"
    | "laboratoryCost"
    | "pharmacyCost"
    | "total"
    | "discountAmount"
    | "afterDiscount";

  const [groupedSortField, setGroupedSortField] = useState<GroupedSortField>("afterDiscount");
  const [groupedSortDirection, setGroupedSortDirection] = useState<"asc" | "desc">("desc");

  const [indivSortField, setIndivSortField] = useState<IndivSortField>("date");
  const [indivSortDirection, setIndivSortDirection] = useState<"asc" | "desc">("desc");

  const toggleGroupedSort = (field: GroupedSortField) => {
    if (groupedSortField === field) {
      setGroupedSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setGroupedSortField(field);
      setGroupedSortDirection(field === "staffMemberName" || field === "staffId" ? "asc" : "desc");
    }
  };

  const toggleIndivSort = (field: IndivSortField) => {
    if (indivSortField === field) {
      setIndivSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setIndivSortField(field);
      setIndivSortDirection(field === "patientName" || field === "staffMemberName" || field === "staffId" ? "asc" : "desc");
    }
  };

  const sortedGroupedStaffCredits = useMemo(() => {
    const list = [...groupedStaffCredits];
    list.sort((a, b) => {
      const aVal = a[groupedSortField];
      const bVal = b[groupedSortField];
      if (typeof aVal === "string" && typeof bVal === "string") {
        const cmp = aVal.localeCompare(bVal);
        return groupedSortDirection === "asc" ? cmp : -cmp;
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return groupedSortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
    return list;
  }, [groupedStaffCredits, groupedSortField, groupedSortDirection]);

  const sortedIndividualReports = useMemo(() => {
    const list = [...filteredReports];
    list.sort((a, b) => {
      const aVal = a[indivSortField] ?? "";
      const bVal = b[indivSortField] ?? "";
      if (typeof aVal === "string" && typeof bVal === "string") {
        const cmp = aVal.localeCompare(bVal);
        return indivSortDirection === "asc" ? cmp : -cmp;
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return indivSortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
    return list;
  }, [filteredReports, indivSortField, indivSortDirection]);

  const handlePrint = () => {
    window.print();
  };

  // Print a specific approved transaction receipt voucher
  const printSingleTransaction = (tx: InvoiceReport) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const clinicTitleEn = clinicInfo?.name || "Bure Card Clinic";
    const clinicTitleAm = clinicInfo?.nameAmharic || "ቡሬ ካርድ ክሊኒክ";

    const itemsHtml = tx.items.length > 0 ? tx.items.map((it, idx) => `
      <tr>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${idx + 1}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <strong>${it.description}</strong>
          <span style="font-size: 9px; color: #64748b; display: block;">${it.category}</span>
        </td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 11px;">${it.quantity}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 11px;">${(it.unitPrice / 100).toFixed(2)}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; font-size: 11px;">${(it.totalPrice / 100).toFixed(2)}</td>
      </tr>
    `).join("") : `
      <tr>
        <td colspan="5" style="padding: 10px; text-align: center; color: #64748b; font-size: 11px;">Consultation & General Clinical Care</td>
      </tr>
    `;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Salary Credit Voucher – ${tx.invoiceNumber}</title>
        <style>
          @page { size: A5 portrait; margin: 8mm; }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 12px;
            font-size: 12px;
            background: #fff;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 8px;
            margin-bottom: 12px;
          }
          .clinic-am { font-size: 14px; font-weight: 700; color: #1e293b; }
          .clinic-en { font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
          .voucher-title {
            display: inline-block;
            margin-top: 6px;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            background: #0f172a;
            color: #fff;
            padding: 3px 10px;
            border-radius: 4px;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px 14px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 12px;
            font-size: 11px;
          }
          .meta-item { display: flex; justify-content: space-between; }
          .meta-label { color: #64748b; font-weight: 600; }
          .meta-value { font-weight: 700; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          th {
            background: #f1f5f9;
            color: #475569;
            padding: 6px 8px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-top: 1px solid #cbd5e1;
            border-bottom: 1px solid #cbd5e1;
            text-align: left;
          }
          .totals-box {
            margin-left: auto;
            width: 260px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 11px;
          }
          .total-row { display: flex; justify-content: space-between; padding: 2px 0; }
          .grand-total {
            border-top: 2px solid #0f172a;
            padding-top: 4px;
            margin-top: 4px;
            font-size: 12px;
            font-weight: 900;
            color: #1e3a8a;
          }
          .signatures {
            margin-top: 32px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            text-align: center;
            font-size: 10px;
          }
          .sig-line {
            border-bottom: 1px dashed #475569;
            height: 36px;
            margin-bottom: 4px;
          }
          .badge {
            display: inline-block;
            font-size: 9px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 3px;
            background: #dcfce7;
            color: #166534;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-am">${clinicTitleAm}</div>
          <div class="clinic-en">${clinicTitleEn}</div>
          <div class="voucher-title">Staff Credit Voucher / Salary Deduction</div>
        </div>

        <div class="meta-grid">
          <div class="meta-item"><span class="meta-label">Invoice Ref:</span><span class="meta-value">${tx.invoiceNumber}</span></div>
          <div class="meta-item"><span class="meta-label">Date & Time:</span><span class="meta-value">${tx.date} ${tx.time || ""}</span></div>
          <div class="meta-item"><span class="meta-label">Staff Member:</span><span class="meta-value">${tx.staffMemberName}</span></div>
          <div class="meta-item"><span class="meta-label">Employee/Military ID:</span><span class="meta-value">${tx.staffId}</span></div>
          <div class="meta-item"><span class="meta-label">Department:</span><span class="meta-value">${tx.staffDepartment}</span></div>
          <div class="meta-item"><span class="meta-label">Beneficiary:</span><span class="meta-value">${tx.patientName} (${tx.relationship || "Self"})</span></div>
          <div class="meta-item"><span class="meta-label">Approved By:</span><span class="meta-value">${tx.encoderName}</span></div>
          <div class="meta-item"><span class="meta-label">Status:</span><span class="badge">APPROVED / DEDUCTED</span></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 25px;">#</th>
              <th>Service / Item Description</th>
              <th style="text-align: center; width: 40px;">Qty</th>
              <th style="text-align: right; width: 75px;">Unit (ETB)</th>
              <th style="text-align: right; width: 85px;">Total (ETB)</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals-box">
          <div class="total-row"><span>Pre-Discount Subtotal:</span><span>${(tx.total / 100).toFixed(2)} ETB</span></div>
          ${tx.laboratoryCost > 0 ? `<div class="total-row" style="color: #64748b; font-size: 10px;"><span>• Laboratory:</span><span>${(tx.laboratoryCost / 100).toFixed(2)} ETB</span></div>` : ""}
          ${tx.pharmacyCost > 0 ? `<div class="total-row" style="color: #64748b; font-size: 10px;"><span>• Pharmacy:</span><span>${(tx.pharmacyCost / 100).toFixed(2)} ETB</span></div>` : ""}
          <div class="total-row" style="color: #dc2626;"><span>Coverage / Discount (${tx.discountPercent}%):</span><span>-${(tx.discountAmount / 100).toFixed(2)} ETB</span></div>
          <div class="total-row grand-total"><span>Charge to Staff Salary:</span><span>${(tx.afterDiscount / 100).toFixed(2)} ETB</span></div>
        </div>

        <div class="signatures">
          <div>
            <div class="sig-line"></div>
            <strong>Beneficiary / Staff Member</strong>
            <div style="color: #64748b; font-size: 9px;">Signature & Date</div>
          </div>
          <div>
            <div class="sig-line"></div>
            <strong>Data Encoder / Finance Officer</strong>
            <div style="color: #64748b; font-size: 9px;">Approved Signature & Stamp</div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Print all transactions for a staff member (Consolidated Statement)
  const printStaffStatement = (grp: GroupedStaffCredit) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const clinicTitleEn = clinicInfo?.name || "Bure Card Clinic";
    const clinicTitleAm = clinicInfo?.nameAmharic || "ቡሬ ካርድ ክሊኒክ";

    const rowsHtml = grp.transactions.map((tx, idx) => `
      <tr>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${idx + 1}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <strong>${tx.date}</strong> <span style="font-size: 9px; color: #64748b;">${tx.time || ""}</span>
          <div style="font-size: 10px; color: #475569;">${tx.invoiceNumber}</div>
        </td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          ${tx.patientName} <span style="font-size: 10px; color: #64748b;">(${tx.relationship || "Self"})</span>
        </td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10px; color: #334155;">
          ${tx.items.length > 0 ? tx.items.map(i => `${i.description} (x${i.quantity})`).join(", ") : "General Medical Services"}
        </td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 11px;">${(tx.total / 100).toFixed(2)}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 11px; color: #dc2626;">-${(tx.discountAmount / 100).toFixed(2)}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; font-size: 11px; color: #1e3a8a;">${(tx.afterDiscount / 100).toFixed(2)}</td>
      </tr>
    `).join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Staff Credit Statement – ${grp.staffMemberName}</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 16px;
            font-size: 12px;
            background: #fff;
          }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 14px; }
          .clinic-am { font-size: 15px; font-weight: 700; }
          .clinic-en { font-size: 16px; font-weight: 800; text-transform: uppercase; }
          .voucher-title {
            display: inline-block;
            margin-top: 6px;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            background: #0f172a;
            color: #fff;
            padding: 3px 12px;
            border-radius: 4px;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 8px 16px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px 14px;
            margin-bottom: 14px;
            font-size: 11px;
          }
          .meta-item { display: flex; flex-direction: column; }
          .meta-label { color: #64748b; font-size: 10px; font-weight: 600; text-transform: uppercase; }
          .meta-value { font-weight: 700; font-size: 12px; color: #0f172a; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          th {
            background: #f1f5f9;
            color: #475569;
            padding: 7px 8px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-top: 1px solid #cbd5e1;
            border-bottom: 1px solid #cbd5e1;
            text-align: left;
          }
          .totals-box {
            margin-left: auto;
            width: 300px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px 14px;
            font-size: 11px;
          }
          .total-row { display: flex; justify-content: space-between; padding: 2px 0; }
          .grand-total {
            border-top: 2px solid #0f172a;
            padding-top: 6px;
            margin-top: 6px;
            font-size: 13px;
            font-weight: 900;
            color: #1e3a8a;
          }
          .signatures {
            margin-top: 40px;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 24px;
            text-align: center;
            font-size: 10px;
          }
          .sig-line {
            border-bottom: 1px dashed #475569;
            height: 36px;
            margin-bottom: 4px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-am">${clinicTitleAm}</div>
          <div class="clinic-en">${clinicTitleEn}</div>
          <div class="voucher-title">Employee Consolidated Salary Deduction Statement</div>
        </div>

        <div class="meta-grid">
          <div class="meta-item"><span class="meta-label">Staff Member</span><span class="meta-value">${grp.staffMemberName}</span></div>
          <div class="meta-item"><span class="meta-label">Employee / Military ID</span><span class="meta-value">${grp.staffId}</span></div>
          <div class="meta-item"><span class="meta-label">Department</span><span class="meta-value">${grp.staffDepartment}</span></div>
          <div class="meta-item"><span class="meta-label">Category / Type</span><span class="meta-value">${grp.staffType}</span></div>
          <div class="meta-item"><span class="meta-label">Total Transactions</span><span class="meta-value">${grp.transactionCount} Approved Invoice(s)</span></div>
          <div class="meta-item"><span class="meta-label">Statement Date</span><span class="meta-value">${new Date().toLocaleDateString()}</span></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 25px;">#</th>
              <th style="width: 110px;">Date & Ref</th>
              <th style="width: 140px;">Patient / Relation</th>
              <th>Services & Items Detail</th>
              <th style="text-align: right; width: 75px;">Gross (ETB)</th>
              <th style="text-align: right; width: 75px;">Subsidy</th>
              <th style="text-align: right; width: 85px;">Salary Charge</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="totals-box">
          <div class="total-row"><span>Total Gross (Pre-Discount):</span><span>${(grp.total / 100).toFixed(2)} ETB</span></div>
          <div class="total-row" style="color: #64748b; font-size: 10px;"><span>• Total Laboratory:</span><span>${(grp.laboratoryCost / 100).toFixed(2)} ETB</span></div>
          <div class="total-row" style="color: #64748b; font-size: 10px;"><span>• Total Pharmacy:</span><span>${(grp.pharmacyCost / 100).toFixed(2)} ETB</span></div>
          <div class="total-row" style="color: #dc2626;"><span>Total Clinic Subsidy / Discount:</span><span>-${(grp.discountAmount / 100).toFixed(2)} ETB</span></div>
          <div class="total-row grand-total"><span>Total To Deduct from Salary:</span><span>${(grp.afterDiscount / 100).toFixed(2)} ETB</span></div>
        </div>

        <div class="signatures">
          <div>
            <div class="sig-line"></div>
            <strong>Staff Member / Employee</strong>
            <div style="color: #64748b; font-size: 9px;">Signature & Date</div>
          </div>
          <div>
            <div class="sig-line"></div>
            <strong>Data Encoder (Prepared By)</strong>
            <div style="color: #64748b; font-size: 9px;">Signature & Stamp</div>
          </div>
          <div>
            <div class="sig-line"></div>
            <strong>Finance / Payroll (Received By)</strong>
            <div style="color: #64748b; font-size: 9px;">Approved For Deduction</div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Export Excel
  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();

    if (viewMode === "grouped") {
      const headers = [
        "Staff Member (Salary Charge)",
        "Employee / Military ID",
        "Department",
        "Staff Category",
        "Total Invoices",
        "Patients Covered",
        "Discount %",
        "Laboratory Cost (ETB)",
        "Pharmacy Cost (ETB)",
        "Total Pre-Discount (ETB)",
        "Discount Subsidy (ETB)",
        "Total Charged to Salary (ETB)"
      ];

      const formatGroupRow = (g: GroupedStaffCredit) => [
        g.staffMemberName,
        g.staffId,
        g.staffDepartment,
        g.staffType,
        g.transactionCount,
        g.patientsCovered.join("; "),
        `${g.discountPercent}%`,
        Number((g.laboratoryCost / 100).toFixed(2)),
        Number((g.pharmacyCost / 100).toFixed(2)),
        Number((g.total / 100).toFixed(2)),
        Number((g.discountAmount / 100).toFixed(2)),
        Number((g.afterDiscount / 100).toFixed(2))
      ];

      const computeGroupTotals = (items: GroupedStaffCredit[]) => {
        const totalTx = items.reduce((sum, g) => sum + g.transactionCount, 0);
        const totalLab = items.reduce((sum, g) => sum + g.laboratoryCost, 0);
        const totalPharma = items.reduce((sum, g) => sum + g.pharmacyCost, 0);
        const totalGross = items.reduce((sum, g) => sum + g.total, 0);
        const totalDisc = items.reduce((sum, g) => sum + g.discountAmount, 0);
        const totalAfter = items.reduce((sum, g) => sum + g.afterDiscount, 0);

        return [
          "TOTAL",
          `${items.length} Staff Accounts`,
          "-",
          "-",
          totalTx,
          "-",
          "-",
          Number((totalLab / 100).toFixed(2)),
          Number((totalPharma / 100).toFixed(2)),
          Number((totalGross / 100).toFixed(2)),
          Number((totalDisc / 100).toFixed(2)),
          Number((totalAfter / 100).toFixed(2))
        ];
      };

      // 1. Master sheet: All Staff Credits
      const masterRows = sortedGroupedStaffCredits.map(formatGroupRow);
      const masterTotals = computeGroupTotals(sortedGroupedStaffCredits);
      const masterWorksheet = XLSX.utils.aoa_to_sheet([headers, ...masterRows, [], masterTotals]);
      XLSX.utils.book_append_sheet(workbook, masterWorksheet, "All Staff Credits");

      // 2. Multiple worksheets partitioned by % discounts
      const discountMap = new Map<number, GroupedStaffCredit[]>();
      sortedGroupedStaffCredits.forEach(g => {
        const pct = g.discountPercent ?? 0;
        if (!discountMap.has(pct)) discountMap.set(pct, []);
        discountMap.get(pct)!.push(g);
      });

      const sortedPcts = Array.from(discountMap.keys()).sort((a, b) => b - a);
      sortedPcts.forEach(pct => {
        const groupItems = discountMap.get(pct)!;
        const rows = groupItems.map(formatGroupRow);
        const totals = computeGroupTotals(groupItems);
        const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows, [], totals]);
        XLSX.utils.book_append_sheet(workbook, sheet, `${pct}% Discount`);
      });

      XLSX.writeFile(workbook, `z-report-staff-credits-${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success(`Exported Staff Credits with ${sortedPcts.length + 1} worksheets!`);
    } else {
      const headers = [
        "Date",
        "Invoice #",
        "Patient Name",
        "Relationship",
        "Staff Member (Salary Charge)",
        "Employee / Military ID",
        "Department",
        "Processed By (Encoder)",
        "Services & Items Detail",
        "Discount %",
        "Laboratory Cost (ETB)",
        "Pharmacy Cost (ETB)",
        "Total Pre-Discount (ETB)",
        "Discount Amount (ETB)",
        "Total After Discount (ETB)"
      ];

      const formatIndivRow = (r: InvoiceReport) => [
        r.date || "",
        r.invoiceNumber,
        r.patientName,
        r.relationship || "Self",
        r.staffMemberName,
        r.staffId,
        r.staffDepartment,
        r.encoderName,
        r.items.map(i => `${i.description} (x${i.quantity})`).join(", "),
        `${r.discountPercent}%`,
        Number((r.laboratoryCost / 100).toFixed(2)),
        Number((r.pharmacyCost / 100).toFixed(2)),
        Number((r.total / 100).toFixed(2)),
        Number((r.discountAmount / 100).toFixed(2)),
        Number((r.afterDiscount / 100).toFixed(2))
      ];

      const computeIndivTotals = (items: InvoiceReport[]) => {
        const totalLab = items.reduce((sum, r) => sum + r.laboratoryCost, 0);
        const totalPharma = items.reduce((sum, r) => sum + r.pharmacyCost, 0);
        const totalGross = items.reduce((sum, r) => sum + r.total, 0);
        const totalDisc = items.reduce((sum, r) => sum + r.discountAmount, 0);
        const totalAfter = items.reduce((sum, r) => sum + r.afterDiscount, 0);

        return [
          "TOTAL",
          `${items.length} Invoices`,
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          Number((totalLab / 100).toFixed(2)),
          Number((totalPharma / 100).toFixed(2)),
          Number((totalGross / 100).toFixed(2)),
          Number((totalDisc / 100).toFixed(2)),
          Number((totalAfter / 100).toFixed(2))
        ];
      };

      // 1. Master sheet: All Transactions
      const masterRows = sortedIndividualReports.map(formatIndivRow);
      const masterTotals = computeIndivTotals(sortedIndividualReports);
      const masterWorksheet = XLSX.utils.aoa_to_sheet([headers, ...masterRows, [], masterTotals]);
      XLSX.utils.book_append_sheet(workbook, masterWorksheet, "All Transactions");

      // 2. Multiple worksheets partitioned by % discounts
      const discountMap = new Map<number, InvoiceReport[]>();
      sortedIndividualReports.forEach(r => {
        const pct = r.discountPercent ?? 0;
        if (!discountMap.has(pct)) discountMap.set(pct, []);
        discountMap.get(pct)!.push(r);
      });

      const sortedPcts = Array.from(discountMap.keys()).sort((a, b) => b - a);
      sortedPcts.forEach(pct => {
        const groupItems = discountMap.get(pct)!;
        const rows = groupItems.map(formatIndivRow);
        const totals = computeIndivTotals(groupItems);
        const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows, [], totals]);
        XLSX.utils.book_append_sheet(workbook, sheet, `${pct}% Discount`);
      });

      XLSX.writeFile(workbook, `z-report-itemized-${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success(`Exported Itemized Ledger with ${sortedPcts.length + 1} worksheets!`);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Finance Print Header (only visible on print) */}
      <div className="hidden print:block text-center border-b pb-4 mb-4">
        <h1 className="text-2xl font-bold uppercase tracking-wider">{clinicInfo?.name || "Bure Card Clinic"} - Finance Reconciliation Z-Report</h1>
        <p className="text-xs text-slate-500 mt-1">
          Date Generated: {new Date().toLocaleDateString()} • Consolidated Staff Credit & Salary Deductions
        </p>
      </div>

      {/* Aggregate Cards */}
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
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {viewMode === "grouped" ? "Staff Credit Z-Reports (Grouped by Staff)" : "All Individual Transactions"}
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                {viewMode === "grouped" ? `${groupedStaffCredits.length} Staff Accounts` : `${filteredReports.length} Invoices`}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {viewMode === "grouped" 
                ? "Similar user credits are consolidated into one row. Click any row to view itemized services and print transaction vouchers." 
                : "Individual transaction ledger. Switch to Grouped view to consolidate by staff member."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300/60 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode("grouped")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === "grouped"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
                title="Consolidate similar user credits into one row"
              >
                <Layers className="w-3.5 h-3.5" />
                Grouped by Staff ({groupedStaffCredits.length})
              </button>
              <button
                type="button"
                onClick={() => setViewMode("individual")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === "individual"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
                title="View every individual transaction"
              >
                <List className="w-3.5 h-3.5" />
                Individual ({filteredReports.length})
              </button>
            </div>

            {/* Search Filter */}
            <div className="relative flex-1 sm:w-60">
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

        {/* 1. GROUPED VIEW: Similar User Credits Consolidate Into One Row */}
        {viewMode === "grouped" ? (
          <div className="p-0 overflow-x-auto print:p-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white dark:bg-slate-900 border-b-2 border-slate-100 dark:border-slate-800 text-[11px] uppercase tracking-wider">
                  <th 
                    onClick={() => toggleGroupedSort("staffMemberName")}
                    className="p-3.5 font-bold text-slate-500 dark:text-slate-400 cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Staff Member (Salary Account)</span>
                      {groupedSortField === "staffMemberName" ? (
                        groupedSortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => toggleGroupedSort("staffId")}
                    className="p-3.5 font-bold text-slate-500 dark:text-slate-400 cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Card / ID</span>
                      {groupedSortField === "staffId" ? (
                        groupedSortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => toggleGroupedSort("transactionCount")}
                    className="p-3.5 font-bold text-slate-500 dark:text-slate-400 text-center cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Invoices</span>
                      {groupedSortField === "transactionCount" ? (
                        groupedSortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
                      )}
                    </div>
                  </th>
                  <th className="p-3.5 font-bold text-slate-500 dark:text-slate-400">Beneficiaries Covered</th>
                  <th 
                    onClick={() => toggleGroupedSort("discountPercent")}
                    className="p-3.5 font-bold text-slate-500 dark:text-slate-400 text-right cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Discount</span>
                      {groupedSortField === "discountPercent" ? (
                        groupedSortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => toggleGroupedSort("laboratoryCost")}
                    className="p-3.5 font-bold text-slate-500 dark:text-slate-400 text-right cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Lab Cost</span>
                      {groupedSortField === "laboratoryCost" ? (
                        groupedSortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => toggleGroupedSort("pharmacyCost")}
                    className="p-3.5 font-bold text-slate-500 dark:text-slate-400 text-right cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Pharmacy Cost</span>
                      {groupedSortField === "pharmacyCost" ? (
                        groupedSortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => toggleGroupedSort("total")}
                    className="p-3.5 font-bold text-slate-500 dark:text-slate-400 text-right cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Total Gross</span>
                      {groupedSortField === "total" ? (
                        groupedSortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => toggleGroupedSort("discountAmount")}
                    className="p-3.5 font-bold text-slate-500 dark:text-slate-400 text-right cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Subsidy</span>
                      {groupedSortField === "discountAmount" ? (
                        groupedSortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => toggleGroupedSort("afterDiscount")}
                    className="p-3.5 font-bold text-slate-500 dark:text-slate-400 text-right cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Net Salary Charge</span>
                      {groupedSortField === "afterDiscount" ? (
                        groupedSortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
                      )}
                    </div>
                  </th>
                  <th className="p-3.5 font-bold text-slate-500 dark:text-slate-400 text-center print:hidden">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {sortedGroupedStaffCredits.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-12 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                        <LayoutDashboard className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">No staff credit transactions match filter.</p>
                    </td>
                  </tr>
                ) : (
                  sortedGroupedStaffCredits.map((group, idx) => (
                    <tr 
                      key={group.key}
                      onClick={() => setSelectedCreditGroup(group)}
                      className={`cursor-pointer hover:bg-blue-50/60 dark:hover:bg-blue-950/20 transition-colors ${idx % 2 === 0 ? "bg-white dark:bg-slate-900/20" : "bg-slate-50/30 dark:bg-slate-900/40"}`}
                    >
                      <td className="p-3.5 font-semibold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span>{group.staffMemberName}</span>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded font-normal">
                            {group.staffType}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500">{group.staffDepartment}</div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300 font-medium">
                        {group.staffId}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {group.transactionCount} credit{group.transactionCount > 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300 max-w-xs">
                        <div className="truncate text-[11px]" title={group.patientsCovered.join(", ")}>
                          {group.patientsCovered.join(", ")}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300 text-right font-medium">
                        {group.discountPercent}%
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300 text-right tabular-nums">
                        {(group.laboratoryCost / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300 text-right tabular-nums">
                        {(group.pharmacyCost / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300 text-right tabular-nums">
                        {(group.total / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5 text-red-500/90 dark:text-red-400 text-right tabular-nums">
                        {(group.discountAmount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5 font-black text-blue-600 dark:text-blue-400 text-right tabular-nums">
                        {(group.afterDiscount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5 text-center print:hidden">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCreditGroup(group);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* 2. FLAT INDIVIDUAL TRANSACTIONS VIEW */
          <div className="p-0 overflow-x-auto print:p-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white dark:bg-slate-900 border-b-2 border-slate-100 dark:border-slate-800 text-[11px] uppercase tracking-wider">
                  <th 
                    onClick={() => toggleIndivSort("date")}
                    className="p-3.5 font-bold text-slate-500 dark:text-slate-400 cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Date & Ref</span>
                      {indivSortField === "date" ? (
                        indivSortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => toggleIndivSort("patientName")}
                    className="p-3.5 font-bold text-slate-500 dark:text-slate-400 cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Patient</span>
                      {indivSortField === "patientName" ? (
                        indivSortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => toggleIndivSort("staffMemberName")}
                    className="p-3.5 font-bold text-slate-500 dark:text-slate-400 cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Staff Member (Salary Charge)</span>
                      {indivSortField === "staffMemberName" ? (
                        indivSortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => toggleIndivSort("staffId")}
                    className="p-3.5 font-bold text-slate-500 dark:text-slate-400 cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Card / ID</span>
                      {indivSortField === "staffId" ? (
                        indivSortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => toggleIndivSort("encoderName")}
                    className="p-3.5 font-bold text-slate-500 dark:text-slate-400 cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Encoder</span>
                      {indivSortField === "encoderName" ? (
                        indivSortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => toggleIndivSort("discountPercent")}
                    className="p-3.5 font-bold text-slate-500 dark:text-slate-400 text-right cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Discount</span>
                      {indivSortField === "discountPercent" ? (
                        indivSortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => toggleIndivSort("laboratoryCost")}
                    className="p-3.5 font-bold text-slate-500 dark:text-slate-400 text-right cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Lab Cost</span>
                      {indivSortField === "laboratoryCost" ? (
                        indivSortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => toggleIndivSort("pharmacyCost")}
                    className="p-3.5 font-bold text-slate-500 dark:text-slate-400 text-right cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Pharmacy Cost</span>
                      {indivSortField === "pharmacyCost" ? (
                        indivSortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => toggleIndivSort("total")}
                    className="p-3.5 font-bold text-slate-500 dark:text-slate-400 text-right cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Total</span>
                      {indivSortField === "total" ? (
                        indivSortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => toggleIndivSort("discountAmount")}
                    className="p-3.5 font-bold text-slate-500 dark:text-slate-400 text-right cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Subsidy</span>
                      {indivSortField === "discountAmount" ? (
                        indivSortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => toggleIndivSort("afterDiscount")}
                    className="p-3.5 font-bold text-slate-500 dark:text-slate-400 text-right cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Salary Charge</span>
                      {indivSortField === "afterDiscount" ? (
                        indivSortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
                      )}
                    </div>
                  </th>
                  <th className="p-3.5 font-bold text-slate-500 dark:text-slate-400 text-center print:hidden">Print</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {sortedIndividualReports.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-12 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                        <LayoutDashboard className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">No transactions match filter.</p>
                    </td>
                  </tr>
                ) : (
                  sortedIndividualReports.map((item, idx) => (
                    <tr key={item.invoiceNumber} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${idx % 2 === 0 ? "bg-white dark:bg-slate-900/20" : "bg-slate-50/30 dark:bg-slate-900/40"}`}>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300">
                        <div className="font-medium">{item.date}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.invoiceNumber.slice(0, 12)}...</div>
                      </td>
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
                      <td className="p-3.5 text-center print:hidden">
                        <button
                          type="button"
                          onClick={() => printSingleTransaction(item)}
                          title="Print Approved Transaction Voucher"
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Print Signatures Block (only shown on full ledger print) */}
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

      {/* POPUP MODAL: Services Detail, Dates, and Print Voucher */}
      {selectedCreditGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Staff Credit Services: {selectedCreditGroup.staffMemberName}
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                    {selectedCreditGroup.staffType}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                  <span>ID: <strong className="text-slate-700 dark:text-slate-300 font-mono">{selectedCreditGroup.staffId}</strong></span>
                  <span>• Department: <strong className="text-slate-700 dark:text-slate-300">{selectedCreditGroup.staffDepartment}</strong></span>
                  <span>• Approved Credits: <strong className="text-slate-700 dark:text-slate-300">{selectedCreditGroup.transactionCount} transaction(s)</strong></span>
                  <span>• Net Salary Deduction: <strong className="text-blue-600 dark:text-blue-400 font-extrabold">{((selectedCreditGroup.afterDiscount) / 100).toFixed(2)} ETB</strong></span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => printStaffStatement(selectedCreditGroup)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg shadow-xs transition-colors"
                  title="Print all transactions for this staff member"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Statement
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCreditGroup(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Transactions & Itemized Services */}
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Approved Transactions Breakdown & Services Detail ({selectedCreditGroup.transactions.length})
              </div>

              {selectedCreditGroup.transactions.map((tx, idx) => (
                <div 
                  key={tx.invoiceNumber}
                  className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                >
                  {/* Transaction Top Bar */}
                  <div className="bg-slate-50/80 dark:bg-slate-800/50 p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                          {tx.invoiceNumber}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          Beneficiary: <strong className="text-slate-700 dark:text-slate-300">{tx.patientName} ({tx.relationship || "Self"})</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {tx.date} at {tx.time || "N/A"}
                        </span>
                        <span>• Processed by: <strong className="text-slate-700 dark:text-slate-300">{tx.encoderName}</strong></span>
                        <span>• Benefit Tier: <strong className="text-slate-700 dark:text-slate-300">{tx.discountPercent}%</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Salary Deduction</span>
                        <span className="font-black text-sm text-blue-600 dark:text-blue-400">
                          {((tx.afterDiscount) / 100).toFixed(2)} ETB
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => printSingleTransaction(tx)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
                        title="Print this specific approved transaction voucher"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print Voucher
                      </button>
                    </div>
                  </div>

                  {/* Services & Items Detail Table */}
                  <div className="p-4">
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      Itemized Services & Medications
                    </div>

                    {tx.items && tx.items.length > 0 ? (
                      <div className="border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800/40 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-100 dark:border-slate-800">
                            <tr>
                              <th className="py-2 px-3">Service / Medication Description</th>
                              <th className="py-2 px-3">Category</th>
                              <th className="py-2 px-3 text-center">Qty</th>
                              <th className="py-2 px-3 text-right">Unit Price</th>
                              <th className="py-2 px-3 text-right">Total Price</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                            {tx.items.map(it => (
                              <tr key={it.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                                <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                                  {it.description}
                                </td>
                                <td className="py-2 px-3">
                                  <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded ${
                                    it.category === "Laboratory"
                                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                      : it.category === "Pharmacy"
                                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                  }`}>
                                    {it.category}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-center font-medium text-slate-600 dark:text-slate-400">
                                  {it.quantity}
                                </td>
                                <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-400 tabular-nums">
                                  {(it.unitPrice / 100).toFixed(2)} ETB
                                </td>
                                <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                                  {(it.totalPrice / 100).toFixed(2)} ETB
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                        General Consultation & Outpatient Clinical Treatment
                      </p>
                    )}

                    {/* Financial Summary Line */}
                    <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                      {tx.laboratoryCost > 0 && (
                        <div className="text-slate-600 dark:text-slate-400">
                          Lab: <span className="font-semibold">{(tx.laboratoryCost / 100).toFixed(2)} ETB</span>
                        </div>
                      )}
                      {tx.pharmacyCost > 0 && (
                        <div className="text-slate-600 dark:text-slate-400">
                          Pharmacy: <span className="font-semibold">{(tx.pharmacyCost / 100).toFixed(2)} ETB</span>
                        </div>
                      )}
                      <div className="text-slate-600 dark:text-slate-400">
                        Gross Subtotal: <span className="font-semibold">{(tx.total / 100).toFixed(2)} ETB</span>
                      </div>
                      <div className="text-red-600 dark:text-red-400">
                        Subsidy ({tx.discountPercent}%): <span className="font-semibold">-{(tx.discountAmount / 100).toFixed(2)} ETB</span>
                      </div>
                      <div className="font-extrabold text-blue-600 dark:text-blue-400">
                        Charged to Salary: <span>{(tx.afterDiscount / 100).toFixed(2)} ETB</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 flex justify-between items-center">
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Total Salary Deduction: <strong className="text-sm font-extrabold text-blue-600 dark:text-blue-400">{((selectedCreditGroup.afterDiscount) / 100).toFixed(2)} ETB</strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => printStaffStatement(selectedCreditGroup)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Consolidated Statement
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCreditGroup(null)}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
