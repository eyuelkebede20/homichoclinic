"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  Printer,
  Calendar,
  Activity,
  FileSpreadsheet,
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  Hospital,
  Pill,
  Sparkles,
  Layers,
  ChevronDown,
  TrendingUp,
  Stethoscope,
  ShieldCheck,
  Award
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { TopDiagnosedDisease, getTopDiagnosedDiseases } from "@/features/clinical/actions";

export type TopDiseasesReportProps = {
  initialDiseases: TopDiagnosedDisease[];
  clinicInfo: {
    name: string;
    nameAmharic: string;
    logo?: string | null;
    userName: string;
    userRole: string;
  };
  currentEthiopianDateStr: string;
  currentEthiopianDateAmharic?: string;
};

export function TopDiseasesReport({
  initialDiseases,
  clinicInfo,
  currentEthiopianDateStr,
  currentEthiopianDateAmharic,
}: TopDiseasesReportProps) {
  const [diseases, setDiseases] = useState<TopDiagnosedDisease[]>(initialDiseases);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPeriod, setSelectedPeriod] = useState<"all" | "month" | "week">("all");
  const [selectedLimit, setSelectedLimit] = useState<number>(20);
  const [isPending, startTransition] = useTransition();

  // Reload diseases when time range or limit changes
  const handlePeriodChange = (period: "all" | "month" | "week") => {
    setSelectedPeriod(period);
    startTransition(async () => {
      try {
        const data = await getTopDiagnosedDiseases(selectedLimit, period);
        setDiseases(data);
        toast.success(`Loaded morbidity data for: ${period === "week" ? "Last 7 Days" : period === "month" ? "Last 30 Days" : "All Time"}`);
      } catch (err: any) {
        toast.error("Failed to load morbidity data: " + err.message);
      }
    });
  };

  const handleLimitChange = (limit: number) => {
    setSelectedLimit(limit);
    startTransition(async () => {
      try {
        const data = await getTopDiagnosedDiseases(limit, selectedPeriod);
        setDiseases(data);
      } catch (err: any) {
        toast.error("Failed to reload list: " + err.message);
      }
    });
  };

  // Unique categories for filtering
  const categories = useMemo(() => {
    const set = new Set<string>(["All"]);
    diseases.forEach((d) => {
      if (d.category) set.add(d.category);
    });
    return Array.from(set);
  }, [diseases]);

  // Filtered diseases based on search & category
  const filteredDiseases = useMemo(() => {
    return diseases.filter((d) => {
      if (selectedCategory !== "All" && d.category !== selectedCategory) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        d.name.toLowerCase().includes(q) ||
        (d.code || "").toLowerCase().includes(q) ||
        (d.category || "").toLowerCase().includes(q) ||
        (d.amharic || "").toLowerCase().includes(q)
      );
    });
  }, [diseases, selectedCategory, searchQuery]);

  // Aggregate statistics
  const totalCases = useMemo(() => {
    return filteredDiseases.reduce((acc, d) => acc + (d.count || 0), 0);
  }, [filteredDiseases]);

  const topMorbidity = filteredDiseases[0] || null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (filteredDiseases.length === 0) {
      toast.error("No data to export");
      return;
    }

    const rows = filteredDiseases.map((d, idx) => ({
      Rank: idx + 1,
      "ICD-10 Code": d.code || "—",
      "Disease Name (English)": d.name,
      "Amharic Name (የበሽታው ስም)": d.amharic || "—",
      Category: d.category,
      "Cases Recorded": d.count,
      "Prevalence (%)": d.percentage ? `${d.percentage}%` : "0%",
      "Recommended Pharmacotherapy": d.recommendedMedicines || "Standard clinical protocol",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Top Diseases Morbidity");
    const filename = `morbidity_report_${selectedPeriod}_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
    toast.success(`Exported ${filteredDiseases.length} disease records to Excel`);
  };

  const periodLabels = {
    all: "All Cumulative Records (All-Time Surveillance)",
    month: "Last 30 Days (Monthly Morbidity Trend)",
    week: "Last 7 Days (Weekly Epidemiological Surveillance)",
  };

  return (
    <div className="space-y-6">
      {/* ──────────────────────────────────────────────────────────── */}
      {/* SCREEN-ONLY TOOLBAR & CONTROL CENTER                         */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="print:hidden space-y-4">
        {/* Top Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 text-xs text-indigo-300 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-md"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
              </Link>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                Epidemiological Surveillance • የበሽታዎች ቅኝት
              </span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Activity className="w-6 h-6 text-indigo-400" />
              Top Diagnosed Clinical Diseases &amp; Morbidity Report
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Standardized epidemiological surveillance registry with ICD classification, disease prevalence, and pharmacotherapy protocols.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handlePrint}
              disabled={filteredDiseases.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Official Report
            </button>

            <button
              onClick={handleExportExcel}
              disabled={filteredDiseases.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white border border-slate-700 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Export to Excel
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Time Period Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Time Window:
              </span>
              <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg font-semibold">
                <button
                  onClick={() => handlePeriodChange("week")}
                  disabled={isPending}
                  className={`px-3 py-1.5 rounded-md text-xs transition-all cursor-pointer ${
                    selectedPeriod === "week"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  Last 7 Days (Weekly)
                </button>
                <button
                  onClick={() => handlePeriodChange("month")}
                  disabled={isPending}
                  className={`px-3 py-1.5 rounded-md text-xs transition-all cursor-pointer ${
                    selectedPeriod === "month"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  Last 30 Days (Monthly)
                </button>
                <button
                  onClick={() => handlePeriodChange("all")}
                  disabled={isPending}
                  className={`px-3 py-1.5 rounded-md text-xs transition-all cursor-pointer ${
                    selectedPeriod === "all"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  All Time (Cumulative)
                </button>
              </div>
            </div>

            {/* Limit Selector */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-600" /> Rank Depth:
              </span>
              <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg font-semibold">
                {[10, 20, 50, 100].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleLimitChange(num)}
                    disabled={isPending}
                    className={`px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
                      selectedLimit === num
                        ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    Top {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search & Category Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search disease name, ICD code, category, or Amharic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-2 px-3 outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "All" ? "All Clinical Categories" : c}
                  </option>
                ))}
              </select>
              <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">
                {filteredDiseases.length} Morbidities
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* PRINT-READY OFFICIAL REPORT DOCUMENT                         */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="bg-white text-black p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 space-y-6">
        {/* 1. Official Letterhead & Header */}
        <header className="border-b-2 border-black pb-4 text-center space-y-1 print:space-y-0.5">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="w-16 h-16 flex items-center justify-center shrink-0">
              {clinicInfo.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={clinicInfo.logo} alt="Clinic Logo" className="w-14 h-14 object-contain" />
              ) : (
                <Hospital className="w-12 h-12 text-slate-800" />
              )}
            </div>

            {/* Center titles */}
            <div className="text-center flex-1 px-4">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-black">
                {clinicInfo.name}
              </h1>
              <p className="text-sm font-bold text-slate-800">
                {clinicInfo.nameAmharic}
              </p>
              <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-black mt-1">
                TOP DIAGNOSED CLINICAL DISEASES &amp; MORBIDITY SURVEILLANCE REPORT
              </h2>
              <p className="text-[11px] font-semibold text-slate-600">
                ዋና ዋና የበሽታዎች ቅኝትና የክሊኒካል ምርመራዎች ይፋዊ የስታቲስቲክስ ሪፖርት
              </p>
            </div>

            {/* Right meta box */}
            <div className="text-right text-[10px] text-slate-600 font-mono shrink-0 w-32">
              <span className="block font-bold text-black border border-black px-1.5 py-0.5 mb-1 text-center uppercase tracking-wider">
                SURVEILLANCE
              </span>
              <span>Ref: MORB-{new Date().getFullYear()}-{filteredDiseases.length}</span>
            </div>
          </div>

          {/* Metadata bar */}
          <div className="flex flex-wrap justify-between items-center text-[10px] text-slate-600 pt-2 border-t border-slate-300 font-mono">
            <span>
              <strong>Surveillance Window:</strong> {periodLabels[selectedPeriod]}
            </span>
            <span>
              <strong>Date Printed:</strong> {currentEthiopianDateStr} (Eth) / {new Date().toLocaleDateString()}
            </span>
            <span>
              <strong>Prepared By:</strong> {clinicInfo.userName} ({clinicInfo.userRole})
            </span>
            <span className="font-bold text-black">
              Total Encounters Tracked: {totalCases} Cases
            </span>
          </div>
        </header>

        {/* 2. Morbidity Overview KPI Matrix */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border border-black rounded-xl p-3 bg-slate-50/60 print:bg-white text-black">
          <div className="border-r border-slate-300 last:border-r-0 pr-2">
            <span className="text-[10px] text-slate-600 uppercase tracking-wider block font-semibold">
              Total Recorded Cases:
            </span>
            <strong className="text-base font-black text-black">
              {totalCases}
            </strong>{" "}
            <span className="text-[10px] text-slate-500">diagnoses</span>
          </div>

          <div className="border-r border-slate-300 last:border-r-0 px-2">
            <span className="text-[10px] text-slate-600 uppercase tracking-wider block font-semibold">
              #1 Leading Morbidity:
            </span>
            <strong className="text-xs font-black text-black truncate block">
              {topMorbidity ? topMorbidity.name : "None recorded"}
            </strong>
            <span className="text-[10px] text-slate-600 font-mono">
              {topMorbidity ? `${topMorbidity.count} cases (${topMorbidity.percentage}%)` : "—"}
            </span>
          </div>

          <div className="border-r border-slate-300 last:border-r-0 px-2">
            <span className="text-[10px] text-slate-600 uppercase tracking-wider block font-semibold">
              Unique Diagnosed Conditions:
            </span>
            <strong className="text-base font-black text-black">
              {filteredDiseases.filter((d) => d.count > 0).length || filteredDiseases.length}
            </strong>{" "}
            <span className="text-[10px] text-slate-500">conditions</span>
          </div>

          <div className="pl-2">
            <span className="text-[10px] text-slate-600 uppercase tracking-wider block font-semibold">
              Dominant Clinical System:
            </span>
            <strong className="text-xs font-black text-black block truncate">
              {topMorbidity ? topMorbidity.category : "General Primary Care"}
            </strong>
            <span className="text-[10px] text-slate-500">Morbidity surveillance</span>
          </div>
        </section>

        {/* 3. Official Morbidity Table */}
        <section className="space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider border-b border-black pb-1">
            <span className="flex items-center gap-1.5 text-black">
              <Activity className="w-3.5 h-3.5" />
              Morbidity Prevalence &amp; Clinical Regimen Registry (የበሽታዎች ዝርዝርና መደበኛ የሕክምና መመሪያ)
            </span>
            <span className="font-mono text-[10px] text-slate-600">
              Displaying Top {filteredDiseases.length} Diseases
            </span>
          </div>

          {filteredDiseases.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-300 rounded-xl text-slate-500 text-xs">
              No clinical diagnoses matched the filter or have been recorded during this period.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs border border-black">
              <thead>
                <tr className="bg-slate-100 print:bg-slate-100 text-[10px] uppercase tracking-wider text-black border-b border-black">
                  <th className="p-2 border-r border-black w-8 text-center font-black">#</th>
                  <th className="p-2 border-r border-black w-16 text-center font-black">ICD-10</th>
                  <th className="p-2 border-r border-black font-black">Disease / Morbidity Name</th>
                  <th className="p-2 border-r border-black w-28 font-black">Category</th>
                  <th className="p-2 border-r border-black w-20 text-right font-black">Cases</th>
                  <th className="p-2 border-r border-black w-24 text-center font-black">Prevalence (%)</th>
                  <th className="p-2 font-black">First-Line Pharmacotherapy / Recommended Regimen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {filteredDiseases.map((d, idx) => {
                  const rank = idx + 1;
                  const isTop3 = rank <= 3;

                  return (
                    <tr
                      key={d.id || d.name + idx}
                      className={`text-[11px] ${
                        isTop3 ? "bg-indigo-50/30 print:bg-transparent font-medium" : ""
                      }`}
                    >
                      {/* Rank */}
                      <td className="p-2 border-r border-slate-300 text-center font-bold">
                        {rank}
                      </td>

                      {/* Code */}
                      <td className="p-2 border-r border-slate-300 font-mono text-[10px] text-center font-bold">
                        {d.code || "—"}
                      </td>

                      {/* Name & Amharic */}
                      <td className="p-2 border-r border-slate-300">
                        <strong className="text-black block font-bold">
                          {d.name}
                        </strong>
                        {d.amharic && (
                          <span className="text-[10px] text-slate-600 block mt-0.5">
                            {d.amharic}
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="p-2 border-r border-slate-300 text-slate-700 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 print:bg-transparent print:border-none border border-slate-200">
                          {d.category}
                        </span>
                      </td>

                      {/* Case Count */}
                      <td className="p-2 border-r border-slate-300 text-right font-bold text-black">
                        {d.count}
                      </td>

                      {/* Prevalence % & Bar */}
                      <td className="p-2 border-r border-slate-300 text-center">
                        <span className="font-bold text-black text-xs">
                          {d.percentage || 0}%
                        </span>
                        <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden mt-1 print:hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full"
                            style={{ width: `${Math.max(d.percentage || 0, d.count > 0 ? 5 : 2)}%` }}
                          />
                        </div>
                      </td>

                      {/* Recommended Regimens */}
                      <td className="p-2 text-[10px] text-slate-800">
                        {d.recommendedMedicines ? (
                          <div className="space-y-0.5">
                            <span className="font-semibold text-black">
                              {d.recommendedMedicines}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Standard outpatient protocol</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 print:bg-slate-100 border-t-2 border-black font-bold text-[11px] text-black">
                  <td colSpan={4} className="p-2 border-r border-black text-right uppercase tracking-wider">
                    Total Diagnosed Encounters in Surveillance Period:
                  </td>
                  <td className="p-2 border-r border-black text-right font-black">
                    {totalCases}
                  </td>
                  <td className="p-2 border-r border-black text-center font-black">
                    100%
                  </td>
                  <td className="p-2 text-[10px] text-slate-600 italic">
                    Certified from Clinic Consultation EHR Database
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </section>

        {/* 4. Official Certification & Signatures Footer */}
        <footer className="pt-6 border-t-2 border-black space-y-4 print-avoid-break">
          {/* Certification Box */}
          <div className="bg-slate-50 print:bg-white border border-black p-3 rounded-lg text-center">
            <p className="text-[11px] font-bold text-black uppercase tracking-wider">
              Official Clinic Morbidity Surveillance &amp; Epidemiological Record Certification
            </p>
            <p className="text-[10px] text-slate-700 mt-0.5">
              ይህ የበሽታዎች ቅኝትና የክሊኒካል ምርመራዎች ሪፖርት ከክሊኒኩ ኤሌክትሮኒክ የህክምና መዝገብ (EHR) በቀጥታ የተዘጋጀ ይፋዊ የስታቲስቲክስ ሰነድ ሲሆን፤ ለክሊኒኩ አስተዳደርና ለጤና ጥበቃ መምሪያ ሪፖርት ማቅረቢያነት ያገለግላል።
            </p>
          </div>

          {/* Signature Grid */}
          <div className="grid grid-cols-2 gap-8 text-xs pt-2">
            <div className="space-y-1">
              <p className="font-bold text-black text-[11px]">Attending Medical Officer / Head Physician:</p>
              <p className="text-slate-600 text-[10px]">Name: ____________________________________________________</p>
              <p className="text-slate-600 text-[10px] pt-4">Signature: ______________________ Date: _________________</p>
            </div>

            <div className="space-y-1 text-right">
              <p className="font-bold text-black text-[11px]">Clinic Medical Director / Health Service Manager:</p>
              <p className="text-slate-600 text-[10px]">Name: {clinicInfo.userName} ({clinicInfo.userRole})</p>
              <p className="text-slate-600 text-[10px] pt-4">Signature: ______________________ Seal: [ &nbsp; STAMP &nbsp; ]</p>
            </div>
          </div>

          {/* Footer Line */}
          <div className="text-center text-[9px] text-slate-500 font-mono pt-3 border-t border-slate-300">
            {clinicInfo.name} • Clinical Morbidity &amp; Epidemiological Surveillance System • Printed: {new Date().toLocaleString()}
          </div>
        </footer>
      </div>
    </div>
  );
}
