"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  BedDouble,
  UserCheck,
  Clock,
  Stethoscope,
  Pill,
  AlertTriangle,
  AlertCircle,
  PackageCheck,
  CheckCircle2,
  TrendingUp,
  Banknote,
  DollarSign,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  ShieldAlert,
  Search,
  ExternalLink,
  Activity,
  Layers,
  ArrowRight,
  Hospital,
  Sparkles,
  Download,
  X,
  RefreshCw,
  Package,
  Plus
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { getTopDiseasesMedicineProtocols, DiseaseMedicineProtocol } from "@/features/clinical/actions";
import { DiseaseImporter } from "./disease-importer";

export type TopDiseaseStat = {
  name: string;
  code?: string;
  category: string;
  amharic?: string;
  count: number;
  percentage?: number;
  recommendedMedicines?: string;
};

export type ManagerDashboardProps = {
  patientStats: {
    currentInpatients: number;
    admittedToday: number;
    checkedToday: number;
    inProgressNow: number;
    waitingInQueue: number;
    totalRegisteredPatients: number;
    totalCompletedVisits: number;
    categories: {
      soldiers: number;
      civilianStaff: number;
      civilianFamily: number;
      guests: number;
      other: number;
    };
    recentVisits: Array<{
      id: string;
      patientId: string;
      patientName: string;
      patientType: string;
      militaryId?: string | null;
      employeeId?: string | null;
      admissionStatus: string;
      status: string;
      opdRoom?: number | null;
      doctorName?: string | null;
      visitDate: string;
      timeAgo: string;
    }>;
  };
  medicineStats: {
    totalDrugTypes: number;
    totalUnitsInStock: number;
    outOfStockCount: number;
    lowStockCount: number;
    expiredBatchesCount: number;
    expiredUnitsCount: number;
    expiredLossCost: number;
    expiringSoonBatchesCount: number;
    expiringSoonUnitsCount: number;
    expiredBatches: Array<{
      id: string;
      drugName: string;
      category?: string | null;
      batchNumber: string;
      quantity: number;
      expiryDate: string;
      cost: number;
      docNo?: string | null;
    }>;
    lowStockDrugs: Array<{
      id: string;
      name: string;
      category?: string | null;
      price: number;
      currentStock: number;
    }>;
  };
  operationalStats: {
    todayRevenue: number;
    allTimeRevenue: number;
    todayDiscountsSubsidized: number;
    pendingInvoicesCount: number;
    pendingInvoicesTotal: number;
    pendingPatientApprovalsCount: number;
    pendingCatalogRequestsCount: number;
    todayLabRequestsCount: number;
    todayPrescriptionsCount: number;
    activeDoctorsCount: number;
    opdRoomsStatus: Array<{
      room: number;
      doctorName?: string | null;
      queueCount: number;
    }>;
  };
  clinicInfo: {
    name: string;
    nameAmharic: string;
    userName: string;
    userRole: string;
  };
  topDiseases?: TopDiseaseStat[];
};

export function ManagerDashboard({
  patientStats,
  medicineStats,
  operationalStats,
  clinicInfo,
  topDiseases = [],
}: ManagerDashboardProps) {
  const router = useRouter();
  const [patientSearch, setPatientSearch] = useState("");
  const [patientFilter, setPatientFilter] = useState<"all" | "inpatient" | "checked" | "queue">("all");
  const [medTab, setMedTab] = useState<"expired" | "low_stock">("expired");

  // Top 10 Diseases Medicine & Regimen Generation states
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [medicineProtocols, setMedicineProtocols] = useState<DiseaseMedicineProtocol[]>([]);
  const [loadingProtocols, setLoadingProtocols] = useState(false);

  const loadMedicineProtocols = async () => {
    setLoadingProtocols(true);
    try {
      const protocols = await getTopDiseasesMedicineProtocols(10);
      setMedicineProtocols(protocols);
    } catch (err: any) {
      console.error("Error loading medicine protocols:", err);
      toast.error("Failed to load medicine protocols: " + (err.message || "Unknown error"));
    } finally {
      setLoadingProtocols(false);
    }
  };

  const handleOpenMedicineModal = () => {
    setShowMedicineModal(true);
    if (medicineProtocols.length === 0) {
      loadMedicineProtocols();
    }
  };

  const handleExportMedicineExcel = () => {
    if (medicineProtocols.length === 0) {
      toast.error("No medicine protocol data available to export.");
      return;
    }

    const rows: any[] = [];
    medicineProtocols.forEach((proto, pIdx) => {
      if (proto.parsedMedicines.length === 0) {
        rows.push({
          "Rank": pIdx + 1,
          "Disease Code": proto.code || "—",
          "Disease Name": proto.diseaseName,
          "Amharic Name": proto.amharic || "—",
          "Category": proto.category,
          "Cases Recorded": proto.caseCount,
          "Prevalence %": `${proto.percentage}%`,
          "Recommended Regimen": proto.recommendedMedicines,
          "Pharmacy Inventory Match": "None",
          "In-Stock Qty": "0",
          "Est. Units Needed": 0,
          "Stock Status": "Not Stocked"
        });
      } else {
        proto.parsedMedicines.forEach((med, mIdx) => {
          rows.push({
            "Rank": mIdx === 0 ? pIdx + 1 : "",
            "Disease Code": mIdx === 0 ? (proto.code || "—") : "",
            "Disease Name": mIdx === 0 ? proto.diseaseName : "",
            "Amharic Name": mIdx === 0 ? (proto.amharic || "—") : "",
            "Category": mIdx === 0 ? proto.category : "",
            "Cases Recorded": mIdx === 0 ? proto.caseCount : "",
            "Prevalence %": mIdx === 0 ? `${proto.percentage}%` : "",
            "Recommended Regimen": `${med.genericName} (${med.dosageInstructions})`,
            "Pharmacy Inventory Match": med.inventoryDrug ? med.inventoryDrug.name : "Not Matched in Pharmacy",
            "In-Stock Qty": med.inventoryDrug?.amountInStock ?? "0",
            "Est. Units Needed": med.estimatedRequiredUnits,
            "Stock Status": med.stockStatus === "in_stock" ? "In Stock" : med.stockStatus === "low_stock" ? "Low Stock" : "Out of Stock"
          });
        });
      }
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 8 },
      { wch: 14 },
      { wch: 32 },
      { wch: 28 },
      { wch: 18 },
      { wch: 15 },
      { wch: 14 },
      { wch: 38 },
      { wch: 32 },
      { wch: 14 },
      { wch: 18 },
      { wch: 16 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Medicine_Demand");
    const dateStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `Top_10_Diseases_Medicine_Demand_${dateStr}.xlsx`);
    toast.success("Exported Top 10 Diseases Medicine Demand forecast (.xlsx)");
  };

  const handlePrintMedicineProtocols = () => {
    const printWindow = window.open("", "_blank", "width=920,height=1100");
    if (!printWindow) {
      toast.error("Please allow pop-ups to print the medicine protocol sheet.");
      return;
    }

    const rowsHtml = medicineProtocols.map((proto, idx) => `
      <tr style="border-bottom: 1px solid #cbd5e1; page-break-inside: avoid;">
        <td style="padding: 8px; font-weight: bold; text-align: center; vertical-align: top;">#${idx + 1}</td>
        <td style="padding: 8px; vertical-align: top;">
          <span style="font-family: monospace; font-size: 11px; background: #e2e8f0; padding: 1px 5px; border-radius: 4px; font-weight: bold;">${proto.code || "—"}</span>
          <strong style="margin-left: 4px; font-size: 13px;">${proto.diseaseName}</strong>
          ${proto.amharic ? `<div style="font-size: 11px; color: #475569; margin-top: 2px;">${proto.amharic}</div>` : ""}
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Category: ${proto.category}</div>
        </td>
        <td style="padding: 8px; text-align: center; font-weight: bold; vertical-align: top;">
          ${proto.caseCount}
          <div style="font-size: 10px; color: #64748b;">${proto.percentage}% prev.</div>
        </td>
        <td style="padding: 8px; vertical-align: top;">
          ${proto.parsedMedicines.map(m => `
            <div style="margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px dotted #e2e8f0;">
              <div><strong style="color: #0f172a; font-size: 12px;">${m.genericName}</strong> &bull; <span style="color: #334155; font-size: 11px;">${m.dosageInstructions}</span></div>
              <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
                Pharmacy Form: <strong>${m.inventoryDrug ? `${m.inventoryDrug.name} (In stock: ${m.inventoryDrug.amountInStock ?? 0})` : "<em>Not Matched</em>"}</strong>
                &bull; Est. Demand: <strong>${m.estimatedRequiredUnits} units</strong>
                &bull; Status: <span style="color: ${m.stockStatus === 'in_stock' ? '#16a34a' : m.stockStatus === 'low_stock' ? '#ca8a04' : '#dc2626'}; font-weight: bold;">${m.stockStatus.replace('_', ' ').toUpperCase()}</span>
              </div>
            </div>
          `).join("")}
        </td>
      </tr>
    `).join("");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Top 10 Diseases Medicine Demand & Regimens - ${clinicInfo.name}</title>
          <style>
            @page { size: A4 portrait; margin: 8mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 12px; color: #0f172a; font-size: 12px; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; }
            .title { font-size: 18px; font-weight: 800; text-transform: uppercase; margin: 0; }
            .subtitle { font-size: 12px; color: #475569; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th { background: #f1f5f9; padding: 8px; text-align: left; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #94a3b8; }
            .footer { margin-top: 24px; padding-top: 12px; border-top: 1px dashed #94a3b8; display: flex; justify-content: space-between; font-size: 11px; page-break-inside: avoid; }
            .sig-box { width: 200px; text-align: center; border-top: 1px solid #475569; margin-top: 35px; padding-top: 4px; font-size: 10px; }
            @media print {
              body { padding: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${clinicInfo.name}</h1>
            ${clinicInfo.nameAmharic ? `<div style="font-weight: 600; font-size: 14px; margin-top: 2px;">${clinicInfo.nameAmharic}</div>` : ""}
            <div class="subtitle">TOP 10 MORBIDITIES &bull; CLINICAL MEDICINE PROTOCOL &amp; DEMAND FORECAST</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Generated: ${new Date().toLocaleString()} &bull; Prepared by: ${clinicInfo.userName} (${clinicInfo.userRole})</div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">Rank</th>
                <th style="width: 190px;">Morbidity / Disease</th>
                <th style="width: 75px; text-align: center;">Cases</th>
                <th>Standard Pharmacotherapy Regimen &amp; Pharmacy Stock Health</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            <div>
              <div class="sig-box">Chief Medical Officer / OPD Lead</div>
            </div>
            <div>
              <div class="sig-box">Head of Clinical Pharmacy</div>
            </div>
            <div>
              <div class="sig-box">Clinic Administrator / Manager</div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 450);
  };

  // Real-time auto refresh every 20 seconds so the manager sees live clinic activity
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 20000);
    return () => clearInterval(interval);
  }, [router]);

  const filteredVisits = patientStats.recentVisits.filter(v => {
    const matchesSearch =
      v.patientName.toLowerCase().includes(patientSearch.toLowerCase()) ||
      (v.militaryId || "").toLowerCase().includes(patientSearch.toLowerCase()) ||
      (v.employeeId || "").toLowerCase().includes(patientSearch.toLowerCase()) ||
      v.patientType.toLowerCase().includes(patientSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (patientFilter === "inpatient") return v.admissionStatus === "Inpatient";
    if (patientFilter === "checked") return v.status === "completed";
    if (patientFilter === "queue") return v.status === "scheduled" || v.status === "in_progress";
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ── Top Executive Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 md:p-8 rounded-2xl text-white shadow-md">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 uppercase tracking-wider">
              {clinicInfo.userRole} Command Center
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Clinic Operations
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            {clinicInfo.name}
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            {clinicInfo.nameAmharic} • Welcome back, {clinicInfo.userName}
          </p>
        </div>

        {/* Quick Action Links */}
        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          {operationalStats.pendingPatientApprovalsCount > 0 && (
            <Link
              href="/patients"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow-sm transition-all"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {operationalStats.pendingPatientApprovalsCount} Registration Approvals
            </Link>
          )}

          {operationalStats.pendingCatalogRequestsCount > 0 && (
            <Link
              href="/pharmacy/catalog"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-purple-500 hover:bg-purple-600 text-white rounded-lg shadow-sm transition-all"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {operationalStats.pendingCatalogRequestsCount} Catalog Changes
            </Link>
          )}

          <Link
            href="/dataencoder/z-reports"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Z-Reports & Finance
          </Link>

          <Link
            href="/admin/admitted-report"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            3-Month Inpatient Reports
          </Link>

          <Link
            href="/pharmacy"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg shadow-sm transition-all"
          >
            <Pill className="w-3.5 h-3.5 text-blue-400" />
            Pharmacy Inventory
          </Link>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 1. PATIENT ADMISSIONS & CHECKUPS SECTION                     */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Hospital className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Patient Admissions & Consultation Checkups
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live tracking of inpatient ward admissions, today&apos;s outpatient admissions, and completed doctor checkups.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full self-start sm:self-auto">
            Total Patients: {patientStats.totalRegisteredPatients.toLocaleString()}
          </span>
        </div>

        {/* 4 Patient Key Performance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Inpatients Admitted */}
          <div className="bg-gradient-to-br from-rose-50 to-rose-100/60 dark:from-rose-950/40 dark:to-slate-900 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                Admitted Inpatients
              </span>
              <div className="p-2 bg-rose-200/60 dark:bg-rose-900/50 rounded-xl text-rose-700 dark:text-rose-300">
                <BedDouble className="w-5 h-5" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-slate-900 dark:text-slate-100 tabular-nums">
              {patientStats.currentInpatients}
            </p>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
              Currently admitted in ward
            </p>
            <Link
              href="/admin/admitted-report?tab=inpatient"
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-400 hover:underline"
            >
              <Printer className="w-3 h-3" /> Print 3-Month Dossiers &rarr;
            </Link>
          </div>

          {/* 2. Admitted to Clinic Today */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/60 dark:from-blue-950/40 dark:to-slate-900 border border-blue-200 dark:border-blue-900/40 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                Admitted Today
              </span>
              <div className="p-2 bg-blue-200/60 dark:bg-blue-900/50 rounded-xl text-blue-700 dark:text-blue-300">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-slate-900 dark:text-slate-100 tabular-nums">
              {patientStats.admittedToday}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
              {patientStats.waitingInQueue} in queue • {patientStats.inProgressNow} in consultation
            </p>
          </div>

          {/* 3. Checked by Doctor Today */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 dark:from-emerald-950/40 dark:to-slate-900 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Checked Today
              </span>
              <div className="p-2 bg-emerald-200/60 dark:bg-emerald-900/50 rounded-xl text-emerald-700 dark:text-emerald-300">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-slate-900 dark:text-slate-100 tabular-nums">
              {patientStats.checkedToday}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              {patientStats.totalCompletedVisits.toLocaleString()} all-time completed checkups
            </p>
          </div>

          {/* 4. Patient Category Distribution */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
              Demographic Breakdown
            </span>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Military Soldiers:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{patientStats.categories.soldiers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Civilian Staff:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{patientStats.categories.civilianStaff}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Civilian Family:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{patientStats.categories.civilianFamily}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Guests / Private:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{patientStats.categories.guests}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Month Admitted Patient History Print Banner */}
        <div className="bg-gradient-to-r from-rose-900/90 via-slate-900 to-indigo-950 p-4 sm:p-5 rounded-2xl text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border border-rose-800/40 shadow-sm print:hidden">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-400/30 shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  3-Month Admitted Patient History & File Attachment Reports
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/30 text-rose-200 border border-rose-400/40 uppercase">
                  Physical Chart Attachment
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Generate and print complete 3-month clinical histories (vitals, SOAP notes, lab results, prescriptions) formatted to attach to patient paper folders (Bure Card).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/admin/admitted-report"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-white text-slate-950 hover:bg-slate-100 rounded-xl shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5 text-rose-600" />
              Open Print Center &rarr;
            </Link>
          </div>
        </div>

        {/* Live Patient Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Recent Patient Queue & Status
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold">
                {filteredVisits.length}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Filter Tabs */}
              <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setPatientFilter("all")}
                  className={`px-2.5 py-1 rounded-md transition-all ${patientFilter === "all" ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs" : "text-slate-600 dark:text-slate-400"}`}
                >
                  All
                </button>
                <button
                  onClick={() => setPatientFilter("inpatient")}
                  className={`px-2.5 py-1 rounded-md transition-all ${patientFilter === "inpatient" ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs" : "text-slate-600 dark:text-slate-400"}`}
                >
                  Inpatients
                </button>
                <button
                  onClick={() => setPatientFilter("checked")}
                  className={`px-2.5 py-1 rounded-md transition-all ${patientFilter === "checked" ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs" : "text-slate-600 dark:text-slate-400"}`}
                >
                  Checked
                </button>
                <button
                  onClick={() => setPatientFilter("queue")}
                  className={`px-2.5 py-1 rounded-md transition-all ${patientFilter === "queue" ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs" : "text-slate-600 dark:text-slate-400"}`}
                >
                  Active Queue
                </button>
              </div>

              {/* Search */}
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search patient, ID, type..."
                  value={patientSearch}
                  onChange={e => setPatientSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="p-3">Patient</th>
                  <th className="p-3">Category / ID</th>
                  <th className="p-3">Admission Ward</th>
                  <th className="p-3">Doctor / OPD Room</th>
                  <th className="p-3">Checkup Status</th>
                  <th className="p-3">Time</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredVisits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No patients match filter.
                    </td>
                  </tr>
                ) : (
                  filteredVisits.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                        <Link href={`/patients/${v.patientId}`} className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5">
                          {v.patientName}
                          <ExternalLink className="w-3 h-3 opacity-40" />
                        </Link>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{v.patientType}</span>
                        {(v.militaryId || v.employeeId) && (
                          <span className="block text-[10px] font-mono text-slate-500">{v.militaryId || v.employeeId}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            v.admissionStatus === "Inpatient"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {v.admissionStatus === "Inpatient" ? "🏥 Inpatient Ward" : "Outpatient"}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">
                        {v.doctorName ? `Dr. ${v.doctorName}` : "Unassigned"}
                        {v.opdRoom && (
                          <span className="ml-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">
                            OPD {v.opdRoom}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {v.status === "completed" ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" /> Checked
                          </span>
                        ) : v.status === "in_progress" ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse">
                            <Activity className="w-3 h-3" /> In Consultation
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            <Clock className="w-3 h-3" /> Waiting in Queue
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-500 text-[11px]">{v.timeAgo}</td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <Link
                          href={`/patients/${v.patientId}`}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        >
                          View Card &rarr;
                        </Link>
                        <Link
                          href={`/admin/admitted-report?patientId=${v.patientId}`}
                          className="ml-3 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 dark:text-rose-400"
                          title="Print 3-Month Dossier for this patient"
                        >
                          <Printer className="w-3 h-3" />
                          3-Mo Report
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 2. TOP 10 DIAGNOSED CLINICAL DISEASES (MORBIDITY OVERVIEW)   */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Top 10 Diagnosed Clinical Diseases
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 font-bold">
                  የበሽታዎች ቅኝት
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Leading morbidities and diagnoses recorded by attending physicians during OPD and Inpatient consultations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
              {topDiseases.reduce((sum, d) => sum + (d.count || 0), 0)} Cases Tracked
            </span>

            <button
              onClick={handleOpenMedicineModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate Medicine &amp; Regimens
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 transition-colors shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Import Disease List (Excel)
            </button>
          </div>
        </div>

        {/* Top 10 Diseases Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {topDiseases.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500">
              No clinical diagnoses recorded yet. When doctors mark visits as reviewed, the top 10 diseases will appear here automatically.
            </div>
          ) : (
            topDiseases.slice(0, 10).map((disease, idx) => {
              const rank = idx + 1;
              const isGold = rank === 1;
              const isSilver = rank === 2;
              const isBronze = rank === 3;

              return (
                <div
                  key={disease.name + idx}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-3.5 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      {/* Rank Indicator */}
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                          isGold
                            ? "bg-amber-500 text-white font-black shadow-xs ring-2 ring-amber-300 dark:ring-amber-600"
                            : isSilver
                            ? "bg-slate-400 text-white font-bold ring-2 ring-slate-300 dark:ring-slate-600"
                            : isBronze
                            ? "bg-amber-700 text-white font-bold ring-2 ring-amber-600 dark:ring-amber-800"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        #{rank}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {disease.code && (
                            <span className="font-mono text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.2 rounded">
                              {disease.code}
                            </span>
                          )}
                          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {disease.name}
                          </h3>
                        </div>

                        {disease.amharic && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-amharic truncate mt-0.5">
                            {disease.amharic}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Category Badge & Count */}
                    <div className="text-right shrink-0">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium block w-fit ml-auto mb-1">
                        {disease.category}
                      </span>
                      <div className="text-xs">
                        <strong className="text-slate-900 dark:text-slate-100 font-black text-sm">
                          {disease.count}
                        </strong>{" "}
                        <span className="text-slate-400 text-[11px]">case{disease.count === 1 ? "" : "s"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Percentage Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Prevalence</span>
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        {disease.percentage || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isGold
                            ? "bg-amber-500"
                            : isSilver
                            ? "bg-slate-500"
                            : isBronze
                            ? "bg-amber-700"
                            : "bg-indigo-600 dark:bg-indigo-500"
                        }`}
                        style={{ width: `${Math.max(disease.percentage || 0, disease.count > 0 ? 5 : 2)}%` }}
                      />
                    </div>
                  </div>

                  {/* First-line Recommended Regimen */}
                  {disease.recommendedMedicines && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        <Pill className="w-3 h-3 text-indigo-500" />
                        <span>First-Line Pharmacotherapy:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {disease.recommendedMedicines.split(",").slice(0, 3).map((med, mIdx) => (
                          <span
                            key={mIdx}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60"
                          >
                            {med.trim()}
                          </span>
                        ))}
                        {disease.recommendedMedicines.split(",").length > 3 && (
                          <span className="text-[10px] text-slate-400 px-1">
                            +{disease.recommendedMedicines.split(",").length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 3. MEDICINE INVENTORY & EXPIRY INTELLIGENCE                 */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Pharmacy & Medicine Stock Intelligence
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Accurate tracking of active medications in stock, expired medicine batches, and low stock warnings.
            </p>
          </div>
          <Link
            href="/pharmacy"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 self-start sm:self-auto"
          >
            Open Full Pharmacy Catalog &rarr;
          </Link>
        </div>

        {/* 4 Inventory Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Units in Stock */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 dark:from-emerald-950/40 dark:to-slate-900 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Medicines in Stock
              </span>
              <div className="p-2 bg-emerald-200/60 dark:bg-emerald-900/50 rounded-xl text-emerald-700 dark:text-emerald-300">
                <PackageCheck className="w-5 h-5" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-slate-900 dark:text-slate-100 tabular-nums">
              {medicineStats.totalUnitsInStock.toLocaleString()}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              Available units across {medicineStats.totalDrugTypes} drug varieties
            </p>
          </div>

          {/* Expired Medicines Alert */}
          <div className="bg-gradient-to-br from-red-50 to-red-100/60 dark:from-red-950/40 dark:to-slate-900 border border-red-300 dark:border-red-900/50 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                Expired Medicines
              </span>
              <div className="p-2 bg-red-200/60 dark:bg-red-900/50 rounded-xl text-red-700 dark:text-red-300">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-red-700 dark:text-red-400 tabular-nums">
                {medicineStats.expiredBatchesCount}
              </span>
              <span className="text-xs font-bold text-red-600 dark:text-red-400">
                batches ({medicineStats.expiredUnitsCount} units)
              </span>
            </div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
              Est. Value: {(medicineStats.expiredLossCost / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
            </p>
          </div>

          {/* Expiring Soon (30 Days) */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/60 dark:from-amber-950/40 dark:to-slate-900 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Expiring Soon (30d)
              </span>
              <div className="p-2 bg-amber-200/60 dark:bg-amber-900/50 rounded-xl text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-slate-100 tabular-nums">
                {medicineStats.expiringSoonBatchesCount}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                batches ({medicineStats.expiringSoonUnitsCount} units)
              </span>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
              Requires priority dispensing or return
            </p>
          </div>

          {/* Low Stock & Out of Stock */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
              Stock Warnings
            </span>
            <div className="space-y-2 mt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Low Stock (&le; 10 units):</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-bold">
                  {medicineStats.lowStockCount} items
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Out of Stock (0 units):</span>
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 font-bold">
                  {medicineStats.outOfStockCount} items
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Medicine Detail Tables (Expired Batches vs Low Stock) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMedTab("expired")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  medTab === "expired"
                    ? "bg-red-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Expired Batches ({medicineStats.expiredBatches.length})
              </button>
              <button
                onClick={() => setMedTab("low_stock")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  medTab === "low_stock"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Low / Depleted Stock ({medicineStats.lowStockDrugs.length})
              </button>
            </div>

            <Link
              href="/pharmacy"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              Manage Batches &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            {medTab === "expired" ? (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500">
                    <th className="p-3">Medication Name</th>
                    <th className="p-3">Batch Number</th>
                    <th className="p-3">Expiry Date</th>
                    <th className="p-3 text-right">Units Expired</th>
                    <th className="p-3 text-right">Estimated Cost</th>
                    <th className="p-3">Document Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {medicineStats.expiredBatches.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                        No expired medicines in stock. All batches are within safe dates.
                      </td>
                    </tr>
                  ) : (
                    medicineStats.expiredBatches.map(b => (
                      <tr key={b.id} className="hover:bg-red-50/40 dark:hover:bg-red-950/20 transition-colors">
                        <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                          {b.drugName}
                          {b.category && <span className="block text-[10px] text-slate-400 font-normal">{b.category}</span>}
                        </td>
                        <td className="p-3 font-mono text-slate-700 dark:text-slate-300 font-medium">
                          {b.batchNumber}
                        </td>
                        <td className="p-3 text-red-600 dark:text-red-400 font-semibold">
                          {b.expiryDate}
                        </td>
                        <td className="p-3 text-right font-black text-red-600 dark:text-red-400 tabular-nums">
                          {b.quantity}
                        </td>
                        <td className="p-3 text-right font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                          {((b.cost * b.quantity) / 100).toFixed(2)} ETB
                        </td>
                        <td className="p-3 font-mono text-slate-500 text-[11px]">
                          {b.docNo || "N/A"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500">
                    <th className="p-3">Medication Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Units Available</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {medicineStats.lowStockDrugs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        All medications are adequately stocked.
                      </td>
                    </tr>
                  ) : (
                    medicineStats.lowStockDrugs.map(d => (
                      <tr key={d.id} className="hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors">
                        <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{d.name}</td>
                        <td className="p-3 text-slate-500">{d.category || "General"}</td>
                        <td className="p-3 text-right text-slate-700 dark:text-slate-300">
                          {(d.price / 100).toFixed(2)} ETB
                        </td>
                        <td className="p-3 text-right font-bold tabular-nums">
                          {d.currentStock}
                        </td>
                        <td className="p-3 text-center">
                          {d.currentStock === 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/40">
                              Out of Stock
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
                              Low Stock Alert
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 3. CLINIC PERFORMANCE & REVENUE USEFUL DATA                */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Financial Summary & Operational Activity
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Overview of daily revenue collections, institutional subsidies/discounts, and doctor OPD room loads.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today's Revenue */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today&apos;s Revenue</span>
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600">
                <Banknote className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100 tabular-nums">
              {(operationalStats.todayRevenue / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
            </p>
            <p className="text-xs text-slate-500 mt-1">
              All-Time: {(operationalStats.allTimeRevenue / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
            </p>
          </div>

          {/* Today's Subsidies */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Corporate Subsidies</span>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400 tabular-nums">
              {(operationalStats.todayDiscountsSubsidized / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Discounts absorbed for soldiers & civilian families
            </p>
          </div>

          {/* Clinical Workload */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Workload Today</span>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-xl text-purple-600">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Lab Orders Today:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{operationalStats.todayLabRequestsCount}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Prescriptions:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{operationalStats.todayPrescriptionsCount}</span>
              </div>
            </div>
          </div>

          {/* Pending Invoices */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Ledger</span>
              <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
              {operationalStats.pendingInvoicesCount}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Unsettled total: {(operationalStats.pendingInvoicesTotal / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
            </p>
          </div>
        </div>

        {/* OPD Rooms Load Balancing */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                OPD Room Status & Doctor Queue Distribution
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Current doctor assignments and active patient queue load across rooms
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              {operationalStats.activeDoctorsCount} Doctor(s) Operating
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {operationalStats.opdRoomsStatus.map(room => (
              <div
                key={room.room}
                className={`p-3.5 rounded-xl border transition-all ${
                  room.doctorName
                    ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50"
                    : "bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                    OPD {room.room}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      room.doctorName ? "bg-emerald-500 animate-pulse" : "bg-slate-300 dark:bg-slate-600"
                    }`}
                  />
                </div>
                <p className="text-[11px] font-semibold text-slate-900 dark:text-slate-100 mt-2 truncate">
                  {room.doctorName ? `Dr. ${room.doctorName}` : "No Doctor"}
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Queued:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {room.queueCount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 5. MEDICINE DEMAND & CLINICAL REGIMENS MODAL                 */}
      {/* ──────────────────────────────────────────────────────────── */}
      {showMedicineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    Top 10 Morbidities &mdash; Medicine Demand &amp; Regimens
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold">
                      Clinical Pharmacy
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Standard first-line pharmacotherapy matching, demand forecasting based on disease incidence, and pharmacy stock health.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadMedicineProtocols}
                  disabled={loadingProtocols}
                  className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Refresh Protocols & Inventory"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingProtocols ? "animate-spin" : ""}`} />
                </button>
                <button
                  onClick={() => setShowMedicineModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Toolbar / Summary stats */}
            <div className="px-5 py-3 bg-indigo-50/50 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-950/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <span className="text-slate-500">Morbidity Cases:</span>{" "}
                  <strong className="text-slate-900 dark:text-slate-100 font-bold">
                    {medicineProtocols.reduce((s, p) => s + (p.caseCount || 0), 0)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Regimens Analyzed:</span>{" "}
                  <strong className="text-slate-900 dark:text-slate-100 font-bold">
                    {medicineProtocols.reduce((s, p) => s + p.parsedMedicines.length, 0)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">In Stock:</span>{" "}
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {medicineProtocols.flatMap(p => p.parsedMedicines).filter(m => m.stockStatus === "in_stock").length}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Low / Out of Stock:</span>{" "}
                  <strong className="text-rose-600 dark:text-rose-400 font-bold">
                    {medicineProtocols.flatMap(p => p.parsedMedicines).filter(m => m.stockStatus !== "in_stock").length}
                  </strong>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportMedicineExcel}
                  disabled={loadingProtocols || medicineProtocols.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Download Forecast (.xlsx)
                </button>
                <button
                  onClick={handlePrintMedicineProtocols}
                  disabled={loadingProtocols || medicineProtocols.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Slip (A4)
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {loadingProtocols ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
                  <p className="text-sm font-semibold">Matching clinical diagnoses against clinic drug inventory...</p>
                </div>
              ) : medicineProtocols.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  No top diagnosed morbidities found yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {medicineProtocols.map((proto, idx) => (
                    <div
                      key={proto.diseaseId || idx}
                      className="bg-slate-50/70 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          {proto.code && (
                            <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                              {proto.code}
                            </span>
                          )}
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {proto.diseaseName}
                          </span>
                          {proto.amharic && (
                            <span className="text-xs text-slate-500 font-amharic">
                              ({proto.amharic})
                            </span>
                          )}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {proto.category}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          <strong className="text-slate-900 dark:text-slate-100 font-black text-sm">
                            {proto.caseCount}
                          </strong>{" "}
                          cases ({proto.percentage}% morbidity)
                        </div>
                      </div>

                      {/* Parsed Medicines Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {proto.parsedMedicines.map((med, mIdx) => {
                          const isInStock = med.stockStatus === "in_stock";
                          const isLowStock = med.stockStatus === "low_stock";

                          return (
                            <div
                              key={mIdx}
                              className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                                isInStock
                                  ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60"
                                  : isLowStock
                                  ? "bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60"
                                  : "bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                  {med.genericName}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                    isInStock
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200"
                                      : isLowStock
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/80 dark:text-amber-200"
                                      : "bg-rose-100 text-rose-800 dark:bg-rose-900/80 dark:text-rose-200"
                                  }`}
                                >
                                  {isInStock ? "In Stock" : isLowStock ? "Low Stock" : "Out of Stock"}
                                </span>
                              </div>

                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                {med.dosageInstructions}
                              </div>

                              <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60 text-[10px] text-slate-600 dark:text-slate-400 space-y-0.5">
                                <div className="flex justify-between">
                                  <span>Pharmacy Stock:</span>
                                  <strong className="text-slate-900 dark:text-slate-100">
                                    {med.inventoryDrug ? `${med.inventoryDrug.amountInStock ?? 0} ${med.inventoryDrug.unit || "units"}` : "Not in Formulary"}
                                  </strong>
                                </div>
                                <div className="flex justify-between">
                                  <span>Est. Demand:</span>
                                  <strong className="text-indigo-600 dark:text-indigo-400">
                                    ~{med.estimatedRequiredUnits} units
                                  </strong>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
              <button
                onClick={() => setShowMedicineModal(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 6. IMPORT DISEASE LIST (EXCEL) MODAL                         */}
      {/* ──────────────────────────────────────────────────────────── */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    Import Disease List &amp; Medicine Regimens (Excel)
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold">
                      .xlsx / .xls / .csv
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Upload prebuilt disease catalogs, configure first-line medicines, or download standard clinical templates.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowImportModal(false);
                  router.refresh();
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body with DiseaseImporter */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <DiseaseImporter />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center text-xs text-slate-500">
              <span>Changes sync immediately with consultation diagnosis selectors and morbidity rankings.</span>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  router.refresh();
                }}
                className="px-4 py-2 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors"
              >
                Done &amp; Refresh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
