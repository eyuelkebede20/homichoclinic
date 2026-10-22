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
  Hospital
} from "lucide-react";

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
};

export function ManagerDashboard({
  patientStats,
  medicineStats,
  operationalStats,
  clinicInfo,
}: ManagerDashboardProps) {
  const router = useRouter();
  const [patientSearch, setPatientSearch] = useState("");
  const [patientFilter, setPatientFilter] = useState<"all" | "inpatient" | "checked" | "queue">("all");
  const [medTab, setMedTab] = useState<"expired" | "low_stock">("expired");

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
      {/* 2. MEDICINE INVENTORY & EXPIRY INTELLIGENCE                 */}
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
    </div>
  );
}
