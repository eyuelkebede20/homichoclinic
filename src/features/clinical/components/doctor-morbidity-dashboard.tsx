"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Activity,
  Sparkles,
  Download,
  Printer,
  FileSpreadsheet,
  TrendingUp,
  Pill,
  Calendar,
  Filter,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Stethoscope,
  Clock,
  ShieldCheck,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  getTopDiagnosedDiseases,
  getTopDiseasesMedicineProtocols,
  TopDiagnosedDisease,
  DiseaseMedicineProtocol,
} from "@/features/clinical/actions";

export type DoctorMorbidityDashboardProps = {
  initialDiseases: TopDiagnosedDisease[];
  initialProtocols: DiseaseMedicineProtocol[];
  clinicInfo: {
    name: string;
    nameAmharic?: string;
    userName: string;
    userRole: string;
  };
};

export function DoctorMorbidityDashboard({
  initialDiseases,
  initialProtocols,
  clinicInfo,
}: DoctorMorbidityDashboardProps) {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("week");
  const [diseases, setDiseases] = useState<TopDiagnosedDisease[]>(initialDiseases);
  const [protocols, setProtocols] = useState<DiseaseMedicineProtocol[]>(initialProtocols);
  const [isPending, startTransition] = useTransition();

  // Modals
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [loadingProtocols, setLoadingProtocols] = useState(false);

  // Filter or reload when timeRange changes
  const handleTimeRangeChange = (range: "week" | "month" | "all") => {
    setTimeRange(range);
    startTransition(async () => {
      try {
        const [newDiseases, newProtocols] = await Promise.all([
          getTopDiagnosedDiseases(20, range),
          getTopDiseasesMedicineProtocols(10, range),
        ]);
        setDiseases(newDiseases);
        setProtocols(newProtocols);
      } catch (e: any) {
        toast.error("Failed to update morbidity stats: " + (e.message || "Unknown error"));
      }
    });
  };

  const handleRefresh = async () => {
    startTransition(async () => {
      try {
        const [newDiseases, newProtocols] = await Promise.all([
          getTopDiagnosedDiseases(20, timeRange),
          getTopDiseasesMedicineProtocols(10, timeRange),
        ]);
        setDiseases(newDiseases);
        setProtocols(newProtocols);
        toast.success("Morbidity surveillance updated with latest consultations.");
      } catch (e: any) {
        toast.error("Refresh failed: " + e.message);
      }
    });
  };

  // Top summary KPIs
  const totalCases = useMemo(() => {
    return diseases.reduce((sum, d) => sum + (d.count || 0), 0);
  }, [diseases]);

  const topMorbidity = useMemo(() => {
    return diseases.length > 0 && diseases[0].count > 0 ? diseases[0] : null;
  }, [diseases]);

  const topCategory = useMemo(() => {
    const map = new Map<string, number>();
    diseases.forEach((d) => {
      if (d.category && d.count > 0) {
        map.set(d.category, (map.get(d.category) || 0) + d.count);
      }
    });
    let bestCat = "General";
    let bestCount = 0;
    map.forEach((c, cat) => {
      if (c > bestCount) {
        bestCount = c;
        bestCat = cat;
      }
    });
    return { name: bestCat, count: bestCount };
  }, [diseases]);

  // Export Morbidity Data to Excel (.xlsx)
  const handleExportMorbidityExcel = () => {
    if (diseases.length === 0) {
      toast.error("No morbidity data available to export.");
      return;
    }

    const rows = diseases.map((d, idx) => ({
      Rank: idx + 1,
      "Disease Code": d.code || "—",
      "Disease Diagnosis": d.name,
      "Amharic Translation": d.amharic || "—",
      Category: d.category,
      "Cases Diagnosed": d.count,
      "Prevalence (%)": `${d.percentage || 0}%`,
      "Recommended Pharmacotherapy": d.recommendedMedicines || "Standard Protocol",
      "Time Window": timeRange === "week" ? "This Week (Last 7 Days)" : timeRange === "month" ? "This Month (Last 30 Days)" : "All Time",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 8 },
      { wch: 14 },
      { wch: 35 },
      { wch: 30 },
      { wch: 20 },
      { wch: 16 },
      { wch: 16 },
      { wch: 55 },
      { wch: 26 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Weekly_Morbidity");
    const dateStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `Top_Diseases_Diagnosed_${timeRange}_${dateStr}.xlsx`);
    toast.success("Downloaded Morbidity Statistics (.xlsx)");
  };

  // Export Medicine Forecast to Excel (.xlsx)
  const handleExportMedicineExcel = () => {
    if (protocols.length === 0) {
      toast.error("No medicine protocol data available to export.");
      return;
    }

    const rows: any[] = [];
    protocols.forEach((proto, pIdx) => {
      proto.parsedMedicines.forEach((med, mIdx) => {
        rows.push({
          Rank: mIdx === 0 ? pIdx + 1 : "",
          "Disease Code": mIdx === 0 ? proto.code || "—" : "",
          "Disease Diagnosis": mIdx === 0 ? proto.diseaseName : "",
          "Cases Diagnosed": mIdx === 0 ? proto.caseCount : "",
          "Prevalence (%)": mIdx === 0 ? `${proto.percentage}%` : "",
          "Recommended Regimen": `${med.genericName} (${med.dosageInstructions})`,
          "Matched Pharmacy Formulary": med.inventoryDrug ? med.inventoryDrug.name : "Not Matched in Formulary",
          "Current Stock in Pharmacy": med.inventoryDrug?.amountInStock ?? "0",
          "Est. Units Needed": med.estimatedRequiredUnits,
          "Pharmacy Stock Health":
            med.stockStatus === "in_stock"
              ? "In Stock"
              : med.stockStatus === "low_stock"
              ? "Low Stock"
              : "Out of Stock",
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 8 },
      { wch: 14 },
      { wch: 32 },
      { wch: 15 },
      { wch: 14 },
      { wch: 38 },
      { wch: 32 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Medicine_Sufficiency");
    const dateStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `Weekly_Top_Diseases_Medicine_Forecast_${dateStr}.xlsx`);
    toast.success("Exported Weekly Medicine Demand Forecast (.xlsx)");
  };

  // Print A4 Morbidity Report
  const handlePrintMorbiditySlip = () => {
    const printWindow = window.open("", "_blank", "width=920,height=1100");
    if (!printWindow) {
      toast.error("Please allow pop-ups to print the morbidity slip.");
      return;
    }

    const rowsHtml = diseases.slice(0, 15).map((d, idx) => `
      <tr style="border-bottom: 1px solid #cbd5e1; page-break-inside: avoid;">
        <td style="padding: 7px; text-align: center; font-weight: bold;">#${idx + 1}</td>
        <td style="padding: 7px;">
          <span style="font-family: monospace; font-size: 11px; background: #e2e8f0; padding: 1px 5px; border-radius: 4px; font-weight: bold;">${d.code || "—"}</span>
          <strong style="margin-left: 4px; font-size: 13px;">${d.name}</strong>
          ${d.amharic ? `<div style="font-size: 11px; color: #475569; margin-top: 2px;">${d.amharic}</div>` : ""}
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Category: ${d.category}</div>
        </td>
        <td style="padding: 7px; text-align: center; font-weight: bold;">
          <span style="font-size: 14px;">${d.count}</span>
          <div style="font-size: 10px; color: #64748b;">${d.percentage || 0}% prev.</div>
        </td>
        <td style="padding: 7px; font-size: 11px;">
          ${d.recommendedMedicines ? `
            <div style="color: #0f172a; font-weight: 600;">${d.recommendedMedicines}</div>
          ` : `<span style="color: #64748b;">Standard primary care protocol</span>`}
        </td>
      </tr>
    `).join("");

    const periodLabel =
      timeRange === "week"
        ? "WEEKLY MORBIDITY SURVEILLANCE (LAST 7 DAYS)"
        : timeRange === "month"
        ? "MONTHLY MORBIDITY SURVEILLANCE (LAST 30 DAYS)"
        : "ALL-TIME MORBIDITY OVERVIEW";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Top Diagnosed Diseases Morbidity Report - ${clinicInfo.name}</title>
          <style>
            @page { size: A4 portrait; margin: 8mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 12px; color: #0f172a; font-size: 12px; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; }
            .title { font-size: 18px; font-weight: 800; text-transform: uppercase; margin: 0; }
            .subtitle { font-size: 12px; color: #475569; margin-top: 4px; font-weight: bold; }
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
            <div class="subtitle">${periodLabel}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 4px;">
              Generated: ${new Date().toLocaleString()} &bull; Reported by: ${clinicInfo.userName} (${clinicInfo.userRole}) &bull; Total Cases: ${totalCases}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">Rank</th>
                <th style="width: 220px;">Diagnosis & Code</th>
                <th style="width: 75px; text-align: center;">Cases</th>
                <th>Standard Pharmacotherapy &amp; Regimen</th>
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
              <div class="sig-box">Attending Doctor</div>
            </div>
            <div>
              <div class="sig-box">Head of Clinical Pharmacy</div>
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

  return (
    <div className="space-y-6">
      {/* ──────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER & TIME WINDOW CONTROLS                         */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 uppercase tracking-wider flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-indigo-300" />
              Doctor Surveillance
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Live Clinical Matrix
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Weekly Diagnosed Diseases &amp; Morbidity Stats
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            Surveillance of leading clinical diagnoses recorded by doctors during OPD and Inpatient consultations, paired with first-line medicine regimens and real-time pharmacy inventory demand.
          </p>
        </div>

        {/* Time-Range Selector & Refresh */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/80 flex items-center gap-1 text-xs">
            <button
              onClick={() => handleTimeRangeChange("week")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                timeRange === "week"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/60"
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => handleTimeRangeChange("month")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                timeRange === "month"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/60"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => handleTimeRangeChange("all")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                timeRange === "all"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/60"
              }`}
            >
              All Time
            </button>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isPending}
            className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 rounded-xl transition-colors shadow-2xs"
            title="Refresh Morbidity Data"
          >
            <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 2. SUMMARY KPI STATS CARDS                                   */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Cases Tracked */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Diagnoses Recorded</span>
            <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {totalCases}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {timeRange === "week" ? "During past 7 days" : timeRange === "month" ? "During past 30 days" : "Across all consultations"}
          </p>
        </div>

        {/* KPI 2: #1 Leading Morbidity */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>#1 Leading Disease</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-slate-100 truncate" title={topMorbidity?.name || "None"}>
            {topMorbidity ? topMorbidity.name : "No Cases Yet"}
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
            {topMorbidity ? `${topMorbidity.count} cases (${topMorbidity.percentage}%)` : "Awaiting OPD reviews"}
          </p>
        </div>

        {/* KPI 3: Top Category */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Top Disease Category</span>
            <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
            {topCategory.count > 0 ? topCategory.name : "General"}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            {topCategory.count > 0 ? `${topCategory.count} cases in this category` : "Broad distribution"}
          </p>
        </div>

        {/* KPI 4: First-Line Regimens */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Regimens Analyzed</span>
            <Pill className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {protocols.flatMap((p) => p.parsedMedicines).length}
          </div>
          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
            Matched to pharmacy formulary
          </p>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 3. TOP DISEASES CARDS GRID (JUST LIKE ADMIN)                */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Top Diagnosed Clinical Diseases ({timeRange === "week" ? "This Week" : timeRange === "month" ? "This Month" : "All Time"})
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 font-bold">
                  የበሽታዎች ቅኝት
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ranked by incidence recorded during doctor examinations. Includes recommended pharmacotherapy regimens.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowMedicineModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate Medicine Demand &amp; Stock
            </button>

            <button
              onClick={handleExportMorbidityExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 transition-colors shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Export Morbidity (.xlsx)
            </button>

            <button
              onClick={handlePrintMorbiditySlip}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              Print Slip (A4)
            </button>
          </div>
        </div>

        {/* Diseases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {diseases.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500">
              No clinical diagnoses recorded for this time window.
            </div>
          ) : (
            diseases.slice(0, 10).map((disease, idx) => {
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
      {/* 4. MEDICINE DEMAND & CLINICAL REGIMENS MODAL                 */}
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
                    Top Diseases &mdash; Medicine Demand &amp; Pharmacy Sufficiency
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold">
                      {timeRange === "week" ? "This Week" : timeRange === "month" ? "This Month" : "All Time"}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pharmacotherapy matching, unit demand forecasting, and real-time pharmacy inventory health based on clinical morbidity.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMedicineModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Toolbar */}
            <div className="px-5 py-3 bg-indigo-50/50 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-950/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <span className="text-slate-500">Morbidity Cases:</span>{" "}
                  <strong className="text-slate-900 dark:text-slate-100 font-bold">
                    {protocols.reduce((s, p) => s + (p.caseCount || 0), 0)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Regimens Analyzed:</span>{" "}
                  <strong className="text-slate-900 dark:text-slate-100 font-bold">
                    {protocols.reduce((s, p) => s + p.parsedMedicines.length, 0)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">In Stock:</span>{" "}
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {protocols.flatMap((p) => p.parsedMedicines).filter((m) => m.stockStatus === "in_stock").length}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Low / Out of Stock:</span>{" "}
                  <strong className="text-rose-600 dark:text-rose-400 font-bold">
                    {protocols.flatMap((p) => p.parsedMedicines).filter((m) => m.stockStatus !== "in_stock").length}
                  </strong>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportMedicineExcel}
                  disabled={protocols.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Download Forecast (.xlsx)
                </button>
                <button
                  onClick={handlePrintMorbiditySlip}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-xl shadow-xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Protocol (A4)
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {protocols.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  No morbidity diagnoses recorded in this time window.
                </div>
              ) : (
                <div className="space-y-4">
                  {protocols.map((proto, idx) => (
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
    </div>
  );
}
