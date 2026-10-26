"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Printer,
  Calendar,
  BedDouble,
  User,
  Activity,
  FileText,
  Pill,
  FlaskConical,
  CheckCircle2,
  Stethoscope,
  Clock,
  ShieldCheck,
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  Hospital,
  AlertCircle,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Tag
} from "lucide-react";
import { toggleAdmissionStatus } from "@/features/clinical/actions";
import { formatLabSummary } from "@/features/clinical/types/lab-panels";
import { toast } from "sonner";

export type DossierPatient = {
  id: string;
  firstName: string;
  lastName: string;
  salutation?: string | null;
  yob?: string | null;
  gender?: string | null;
  contactNumber?: string | null;
  patientType: string;
  militaryId?: string | null;
  rank?: string | null;
  division?: string | null;
  employeeId?: string | null;
  department?: string | null;
  permanentSince?: string | null;
  c_m?: string | null;
  emergencyContact?: string | null;
  emergencyMobile?: string | null;
  discountPercent: number;
  admissionStatus: string;
  relationship?: string | null;
  primaryPatient?: {
    id: string;
    firstName: string;
    lastName: string;
    militaryId?: string | null;
    employeeId?: string | null;
    patientType: string;
  } | null;
  visits: Array<{
    id: string;
    visitDate: string;
    rawDate: string;
    status: string;
    opdRoom?: number | null;
    doctorName?: string | null;
    notes?: string | null;
    vitals?: {
      bp?: string;
      heartRate?: number;
      temp?: number;
      weight?: number;
    } | null;
  }>;
  medicalRecords: Array<{
    id: string;
    date: string;
    rawDate: string;
    source: string;
    content: string;
    enteredByName?: string | null;
    bp?: string | null;
    heartRate?: number | null;
    temp?: number | null;
    weight?: number | null;
    subjective?: string | null;
    objective?: string | null;
    assessment?: string | null;
    plan?: string | null;
  }>;
  labRequests: Array<{
    id: string;
    date: string;
    rawDate: string;
    testName: string;
    testCategory?: string | null;
    status: string;
    requestedByName?: string | null;
    notes?: string | null;
    result?: {
      id: string;
      findings: string;
      date: string;
      enteredByName?: string | null;
      isReadByDoctor: boolean;
    } | null;
  }>;
  prescriptions: Array<{
    id: string;
    date: string;
    rawDate: string;
    status: string;
    doctorName?: string | null;
    items: Array<{
      id: string;
      drugName: string;
      unit?: string | null;
      quantity: number;
      instructions: string;
    }>;
  }>;
  latestVitals?: {
    bp?: string;
    heartRate?: number;
    temp?: number;
    weight?: number;
  } | null;
  attendingDoctors: string[];
  primaryAssessments: string[];
  lastEncounterDate?: string;
};

export type AdmittedPatientsReportProps = {
  patients: DossierPatient[];
  clinicInfo: {
    name: string;
    nameAmharic: string;
    logo?: string | null;
    userName: string;
    userRole: string;
  };
  defaultPeriodDays?: number;
  currentEthiopianDateStr: string;
  threeMonthsAgoEthiopianDateStr: string;
};

export function AdmittedPatientsReport({
  patients,
  clinicInfo,
  currentEthiopianDateStr,
  threeMonthsAgoEthiopianDateStr,
}: AdmittedPatientsReportProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPatientId = searchParams.get("patientId") || "";
  const initialTab = (searchParams.get("tab") as "all" | "inpatient" | "search") || "inpatient";

  const [activeTab, setActiveTab] = useState<"all" | "inpatient" | "search">(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState<"30" | "90" | "180" | "all">("90");
  const [printingMode, setPrintingMode] = useState<"batch" | "census" | "single">("batch");
  const [singlePrintPatientId, setSinglePrintPatientId] = useState<string>(initialPatientId);
  const [expandedPatientIds, setExpandedPatientIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (initialPatientId) initial[initialPatientId] = true;
    return initial;
  });
  const [isUpdatingAdmission, setIsUpdatingAdmission] = useState<string | null>(null);

  // Compute cutoff date based on selected period
  const cutoffDate = useMemo(() => {
    if (selectedPeriod === "all") return new Date(0);
    const days = parseInt(selectedPeriod, 10);
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  }, [selectedPeriod]);

  // Filter patients based on tab, date cutoffs, and search query
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      // Tab filter
      if (activeTab === "inpatient" && p.admissionStatus !== "Inpatient") {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = `${p.firstName} ${p.lastName}`.toLowerCase().includes(q);
        const matchesMilitary = (p.militaryId || "").toLowerCase().includes(q);
        const matchesEmployee = (p.employeeId || "").toLowerCase().includes(q);
        const matchesContact = (p.contactNumber || "").toLowerCase().includes(q);
        const matchesType = (p.patientType || "").toLowerCase().includes(q);
        const matchesDept = (p.department || "").toLowerCase().includes(q);
        const matchesRank = (p.rank || "").toLowerCase().includes(q);

        if (!matchesName && !matchesMilitary && !matchesEmployee && !matchesContact && !matchesType && !matchesDept && !matchesRank) {
          return false;
        }
      }

      // Period filter: Check if patient has any activity within cutoffDate OR is currently Inpatient
      if (selectedPeriod !== "all") {
        const hasRecentVisit = p.visits.some((v) => new Date(v.rawDate) >= cutoffDate);
        const hasRecentRecord = p.medicalRecords.some((r) => new Date(r.rawDate) >= cutoffDate);
        const hasRecentLab = p.labRequests.some((l) => new Date(l.rawDate) >= cutoffDate);
        const hasRecentRx = p.prescriptions.some((rx) => new Date(rx.rawDate) >= cutoffDate);
        const isCurrentInpatient = p.admissionStatus === "Inpatient";

        if (!hasRecentVisit && !hasRecentRecord && !hasRecentLab && !hasRecentRx && !isCurrentInpatient) {
          return false;
        }
      }

      return true;
    });
  }, [patients, activeTab, searchQuery, selectedPeriod, cutoffDate]);

  // Patients to render when printing
  const printTargetPatients = useMemo(() => {
    if (printingMode === "single" && singlePrintPatientId) {
      return filteredPatients.filter((p) => p.id === singlePrintPatientId);
    }
    return filteredPatients;
  }, [filteredPatients, printingMode, singlePrintPatientId]);

  const handlePrintBatch = () => {
    setPrintingMode("batch");
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintCensus = () => {
    setPrintingMode("census");
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintSingle = (patientId: string) => {
    setPrintingMode("single");
    setSinglePrintPatientId(patientId);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const toggleExpand = (patientId: string) => {
    setExpandedPatientIds((prev) => ({
      ...prev,
      [patientId]: !prev[patientId],
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    filteredPatients.forEach((p) => {
      allExpanded[p.id] = true;
    });
    setExpandedPatientIds(allExpanded);
  };

  const collapseAll = () => {
    setExpandedPatientIds({});
  };

  const handleToggleAdmission = async (patientId: string, currentStatus: string) => {
    setIsUpdatingAdmission(patientId);
    try {
      const res = await toggleAdmissionStatus({ patientId, currentStatus });
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`Patient marked as ${res?.data?.status || "updated"}`);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update admission status");
    } finally {
      setIsUpdatingAdmission(null);
    }
  };

  const calculateAge = (yob: string | null | undefined) => {
    if (!yob) return "N/A";
    const year = parseInt(yob, 10);
    if (isNaN(year)) return yob;
    // Current Gregorian / Ethiopian reference
    const currentYear = new Date().getFullYear();
    const diff = currentYear - year;
    return diff > 0 && diff < 125 ? `${diff} yrs` : yob;
  };

  return (
    <div className="space-y-6">
      {/* ──────────────────────────────────────────────────────────── */}
      {/* SCREEN-ONLY TOOLBAR & CONTROL CENTER                         */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="print:hidden space-y-5">
        {/* Top Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 text-xs text-indigo-300 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-md"
              >
                <ArrowLeft className="w-3 h-3" /> Back to Dashboard
              </Link>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-wider">
                Manager Inpatient Center
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Hospital className="w-6 h-6 text-indigo-400" />
              Admitted Patients: 3-Month Report & Dossier
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Official clinical summaries & patient history for physical chart attachments (የታካሚ ካርድ ማያያዣ የህክምና ታሪክ)
            </p>
          </div>

          {/* Quick Print Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handlePrintBatch}
              disabled={filteredPatients.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl shadow-sm transition-all"
              title="Print full 3-month dossier for all displayed patients (one per page break)"
            >
              <Printer className="w-4 h-4" />
              Print All Dossiers ({filteredPatients.length})
            </button>

            <button
              onClick={handlePrintCensus}
              disabled={filteredPatients.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white border border-slate-700 rounded-xl shadow-sm transition-all"
              title="Print summary table registry of all admitted patients"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Print Census Register
            </button>
          </div>
        </div>

        {/* Filter Navigation & Search Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Tab Switches */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setActiveTab("inpatient")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                  activeTab === "inpatient"
                    ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <BedDouble className="w-3.5 h-3.5" />
                Admitted Inpatients
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                  {patients.filter((p) => p.admissionStatus === "Inpatient").length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("all")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                  activeTab === "all"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                All 3-Month Activity
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  {patients.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("search")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                  activeTab === "search"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                Search Any Patient
              </button>
            </div>

            {/* Period selector */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium">History Window:</span>
              <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg font-semibold">
                <button
                  onClick={() => setSelectedPeriod("30")}
                  className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                    selectedPeriod === "30"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  30 Days
                </button>
                <button
                  onClick={() => setSelectedPeriod("90")}
                  className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                    selectedPeriod === "90"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  3 Months (Standard)
                </button>
                <button
                  onClick={() => setSelectedPeriod("180")}
                  className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                    selectedPeriod === "180"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  6 Months
                </button>
                <button
                  onClick={() => setSelectedPeriod("all")}
                  className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                    selectedPeriod === "all"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  All History
                </button>
              </div>
            </div>
          </div>

          {/* Search bar and toggle buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient name, ID, phone, department, rank..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
              <button
                onClick={expandAll}
                className="px-2.5 py-1 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
              >
                Expand All
              </button>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <button
                onClick={collapseAll}
                className="px-2.5 py-1 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
              >
                Collapse All
              </button>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {filteredPatients.length} Patients Matched
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* CENSUS SUMMARY REGISTER (PRINTABLE & SCREEN VIEW)            */}
      {/* ──────────────────────────────────────────────────────────── */}
      {printingMode === "census" && (
        <div className="bg-white text-black p-4 sm:p-8 rounded-xl border border-slate-300 print:border-none print:p-0">
          <div className="text-center border-b-2 border-black pb-4 mb-6">
            <h1 className="text-2xl font-black uppercase tracking-wider text-black">
              {clinicInfo.name}
            </h1>
            <p className="text-sm font-semibold text-slate-800">{clinicInfo.nameAmharic}</p>
            <h2 className="text-base font-bold uppercase mt-2 text-black">
              ADMITTED PATIENTS 3-MONTH CENSUS & ACTIVITY LOG / የተኝቶ ታካሚዎች የ3 ወር ማጠቃለያ መዝገብ
            </h2>
            <div className="flex justify-between items-center text-xs text-slate-600 mt-3 font-mono">
              <span>Period: {threeMonthsAgoEthiopianDateStr} — {currentEthiopianDateStr}</span>
              <span>Generated by: {clinicInfo.userName} ({clinicInfo.userRole})</span>
              <span>Total Admitted: {filteredPatients.length}</span>
            </div>
          </div>

          <table className="w-full text-left border-collapse text-xs border border-black">
            <thead>
              <tr className="bg-slate-100 text-[11px] uppercase tracking-wider text-black border-b border-black">
                <th className="p-2 border-r border-black w-8">#</th>
                <th className="p-2 border-r border-black">Patient Full Name</th>
                <th className="p-2 border-r border-black">Military / Employee ID</th>
                <th className="p-2 border-r border-black">Age / Sex</th>
                <th className="p-2 border-r border-black">Category / Dept</th>
                <th className="p-2 border-r border-black">Ward Status</th>
                <th className="p-2 border-r border-black">Encounters</th>
                <th className="p-2 border-r border-black">Latest Vitals</th>
                <th className="p-2 border-r border-black">Attending Doctor</th>
                <th className="p-2">Working Assessment / Rx</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {filteredPatients.map((p, idx) => (
                <tr key={p.id} className="text-[11px]">
                  <td className="p-2 border-r border-slate-300 font-mono text-center">{idx + 1}</td>
                  <td className="p-2 border-r border-slate-300 font-bold text-black">
                    {p.salutation ? `${p.salutation}. ` : ""}{p.firstName} {p.lastName}
                  </td>
                  <td className="p-2 border-r border-slate-300 font-mono">
                    {p.militaryId || p.employeeId || "—"}
                  </td>
                  <td className="p-2 border-r border-slate-300">
                    {calculateAge(p.yob)} / {p.gender ? p.gender.charAt(0).toUpperCase() : "—"}
                  </td>
                  <td className="p-2 border-r border-slate-300">
                    {p.patientType} {p.department ? `(${p.department})` : ""}
                  </td>
                  <td className="p-2 border-r border-slate-300 font-bold">
                    {p.admissionStatus === "Inpatient" ? "🏥 INPATIENT" : "Outpatient"}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-center font-bold">
                    {p.visits.length}
                  </td>
                  <td className="p-2 border-r border-slate-300 font-mono text-[10px]">
                    {p.latestVitals?.bp ? `BP:${p.latestVitals.bp}` : "—"}
                    {p.latestVitals?.temp ? ` T:${p.latestVitals.temp}°C` : ""}
                  </td>
                  <td className="p-2 border-r border-slate-300">
                    {p.attendingDoctors.length > 0 ? p.attendingDoctors.join(", ") : "—"}
                  </td>
                  <td className="p-2 text-[10px]">
                    {p.primaryAssessments.length > 0
                      ? p.primaryAssessments.slice(0, 2).join("; ")
                      : p.prescriptions.length > 0
                      ? `${p.prescriptions.length} Prescriptions`
                      : "Routine Observation"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Official Signatures for Census Report */}
          <div className="mt-8 pt-6 border-t border-black grid grid-cols-2 gap-8 text-xs">
            <div>
              <p className="font-bold">Attending Medical Officer:</p>
              <p className="mt-8">Signature: _______________________ Date: ____________</p>
            </div>
            <div>
              <p className="font-bold">Clinic Medical Director / Manager:</p>
              <p className="mt-8">Signature: _______________________ Date: ____________</p>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* INDIVIDUAL PATIENT DOSSIERS (BATCH / SCREEN / SINGLE PRINT)  */}
      {/* ──────────────────────────────────────────────────────────── */}
      {printingMode !== "census" && (
        <div className="space-y-8">
          {filteredPatients.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              <Hospital className="w-12 h-12 mx-auto text-slate-400 mb-3 opacity-60" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                No admitted patients found
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                No patients match the active filter or have admission/inpatient records within the selected 3-month period.
                Try selecting &ldquo;All 3-Month Activity&rdquo; or searching for a specific patient.
              </p>
            </div>
          ) : (
            printTargetPatients.map((patient, pIdx) => {
              const isExpanded = expandedPatientIds[patient.id] ?? false;

              return (
                <article
                  key={patient.id}
                  className="patient-dossier-page bg-white text-black dark:text-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs print:shadow-none print:border-none print:m-0 print:p-0 overflow-hidden print:overflow-visible"
                >
                  {/* Screen Header Controls for each patient */}
                  <div className="print:hidden p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-black text-sm flex items-center justify-center">
                        {pIdx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {patient.salutation ? `${patient.salutation}. ` : ""}
                            {patient.firstName} {patient.lastName}
                          </h2>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              patient.admissionStatus === "Inpatient"
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40"
                                : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            {patient.admissionStatus === "Inpatient" ? "🏥 INPATIENT WARD" : "Outpatient"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          ID: {patient.militaryId || patient.employeeId || "N/A"} • Category: {patient.patientType} • {patient.visits.length} Visits in Period
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {/* Toggle Admission Status */}
                      <button
                        onClick={() => handleToggleAdmission(patient.id, patient.admissionStatus)}
                        disabled={isUpdatingAdmission === patient.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                        title="Toggle Inpatient / Outpatient status"
                      >
                        <BedDouble className="w-3.5 h-3.5" />
                        {patient.admissionStatus === "Inpatient" ? "Discharge" : "Admit to Ward"}
                      </button>

                      {/* Print This Patient's Dossier Only */}
                      <button
                        onClick={() => handlePrintSingle(patient.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print Dossier (Attach to Card)
                      </button>

                      <Link
                        href={`/patients/${patient.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        Live Card &rarr;
                      </Link>

                      <button
                        onClick={() => toggleExpand(patient.id)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        title={isExpanded ? "Collapse preview" : "Expand preview"}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* ──────────────────────────────────────────────────────────── */}
                  {/* OFFICIAL MEDICAL DOSSIER CONTENT (PRINT READY)               */}
                  {/* ──────────────────────────────────────────────────────────── */}
                  <div className={`p-6 sm:p-8 space-y-6 ${!isExpanded ? "print:block hidden" : "block"} print:p-2 print:space-y-2`}>
                    {/* 1. Official Clinic Letterhead */}
                    <header className="border-b-2 border-black pb-4 print:pb-1.5 text-center space-y-1 print:space-y-0.5 print-avoid-break">
                      <div className="flex items-center justify-between">
                        <div className="w-16 h-16 flex items-center justify-center shrink-0">
                          {clinicInfo.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={clinicInfo.logo} alt="Clinic Logo" className="w-14 h-14 object-contain" />
                          ) : (
                            <Hospital className="w-12 h-12 text-slate-800" />
                          )}
                        </div>

                        <div className="text-center flex-1 px-4">
                          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-widest text-black">
                            {clinicInfo.name}
                          </h1>
                          <p className="text-sm font-bold text-slate-800">
                            {clinicInfo.nameAmharic}
                          </p>
                          <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-black mt-1">
                            INPATIENT 3-MONTH MEDICAL REPORT & CLINICAL DOSSIER
                          </h2>
                          <p className="text-[11px] font-semibold text-slate-600">
                            የተኝቶ ታካሚ የ3 ወር የህክምና ታሪክ ማጠቃለያ (ለህክምና ካርድ ማያያዣ የተዘጋጀ)
                          </p>
                        </div>

                        <div className="text-right text-[10px] text-slate-600 font-mono shrink-0 w-28">
                          <span className="block font-bold text-black border border-black px-1 py-0.5 mb-1 text-center uppercase">
                            CONFIDENTIAL
                          </span>
                          <span>Ref: {patient.id.slice(-6).toUpperCase()}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-600 pt-2 border-t border-slate-300 font-mono">
                        <span>Report Window: {threeMonthsAgoEthiopianDateStr} — {currentEthiopianDateStr} (90 Days)</span>
                        <span>Date Printed: {currentEthiopianDateStr} (Eth) / {new Date().toLocaleDateString()}</span>
                        <span className="font-bold text-black">
                          Status: {patient.admissionStatus === "Inpatient" ? "🏥 ADMITTED INPATIENT" : "OUTPATIENT"}
                        </span>
                      </div>
                    </header>

                    {/* 2. Patient Profile & Demographics Grid */}
                    <section className="border border-black rounded-lg p-3 bg-slate-50/60 print:bg-white text-black text-xs">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-black border-b border-black pb-1 mb-2 flex items-center justify-between">
                        <span>Patient Identification & Demographic Matrix</span>
                        <span>Card No / ID: {patient.militaryId || patient.employeeId || patient.id.slice(-8)}</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-[11px]">
                        <div>
                          <span className="text-slate-600 block text-[10px]">Full Name:</span>
                          <strong className="text-black font-extrabold">
                            {patient.salutation ? `${patient.salutation}. ` : ""}{patient.firstName} {patient.lastName}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-600 block text-[10px]">Age / Sex:</span>
                          <strong className="text-black">
                            {calculateAge(patient.yob)} / {patient.gender || "N/A"}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-600 block text-[10px]">Patient Category:</span>
                          <strong className="text-black">{patient.patientType}</strong>
                        </div>
                        <div>
                          <span className="text-slate-600 block text-[10px]">Military / Employee ID:</span>
                          <strong className="text-black font-mono">
                            {patient.militaryId || patient.employeeId || "N/A"}
                          </strong>
                        </div>

                        {patient.rank && (
                          <div>
                            <span className="text-slate-600 block text-[10px]">Military Rank & Division:</span>
                            <strong className="text-black">
                              {patient.rank} {patient.division ? `(${patient.division})` : ""}
                            </strong>
                          </div>
                        )}

                        {patient.department && (
                          <div>
                            <span className="text-slate-600 block text-[10px]">Department / Unit:</span>
                            <strong className="text-black">{patient.department}</strong>
                          </div>
                        )}

                        {patient.permanentSince && (
                          <div>
                            <span className="text-slate-600 block text-[10px]">Permanent Since (ቋሚ የሆነበት ቀን):</span>
                            <strong className="text-black">{patient.permanentSince}</strong>
                          </div>
                        )}

                        <div>
                          <span className="text-slate-600 block text-[10px]">Contact Mobile:</span>
                          <strong className="text-black font-mono">{patient.contactNumber || "N/A"}</strong>
                        </div>

                        {patient.emergencyContact && (
                          <div>
                            <span className="text-slate-600 block text-[10px]">Emergency Contact:</span>
                            <strong className="text-black">
                              {patient.emergencyContact} {patient.emergencyMobile ? `(${patient.emergencyMobile})` : ""}
                            </strong>
                          </div>
                        )}

                        <div>
                          <span className="text-slate-600 block text-[10px]">Coverage / Subsidy:</span>
                          <strong className="text-black">{patient.discountPercent}% Subsidized</strong>
                        </div>

                        {patient.primaryPatient && (
                          <div className="col-span-2">
                            <span className="text-slate-600 block text-[10px]">Linked Primary Sponsor:</span>
                            <strong className="text-black">
                              {patient.primaryPatient.firstName} {patient.primaryPatient.lastName} ({patient.relationship || "Dependent"} of {patient.primaryPatient.militaryId || patient.primaryPatient.employeeId})
                            </strong>
                          </div>
                        )}
                      </div>
                    </section>

                    {/* 3. Clinical Overview & Baseline Vitals Box */}
                    <section className="grid grid-cols-1 sm:grid-cols-4 gap-3 print:grid-cols-4 text-xs">
                      <div className="p-2.5 border border-black rounded-lg bg-slate-50 print:bg-white text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">
                          3-Month Encounters
                        </span>
                        <strong className="text-lg font-black text-black">
                          {patient.visits.length} Visits
                        </strong>
                      </div>

                      <div className="p-2.5 border border-black rounded-lg bg-slate-50 print:bg-white text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">
                          Latest Blood Pressure
                        </span>
                        <strong className="text-lg font-black text-black font-mono">
                          {patient.latestVitals?.bp || "Not recorded"}
                        </strong>
                      </div>

                      <div className="p-2.5 border border-black rounded-lg bg-slate-50 print:bg-white text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">
                          Latest Heart Rate & Temp
                        </span>
                        <strong className="text-sm font-black text-black font-mono block mt-1">
                          {patient.latestVitals?.heartRate ? `${patient.latestVitals.heartRate} bpm` : "—"} • {patient.latestVitals?.temp ? `${patient.latestVitals.temp} °C` : "—"}
                        </strong>
                      </div>

                      <div className="p-2.5 border border-black rounded-lg bg-slate-50 print:bg-white text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">
                          Attending Physicians
                        </span>
                        <strong className="text-xs font-bold text-black block mt-1">
                          {patient.attendingDoctors.length > 0 ? patient.attendingDoctors.join(", ") : "Staff Medical Officer"}
                        </strong>
                      </div>
                    </section>

                    {/* 4. Clinical Encounters & SOAP Medical Records */}
                    <section className="space-y-3">
                      <div className="border-b border-black pb-1 flex items-center justify-between text-xs font-bold uppercase text-black">
                        <span className="flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5" />
                          1. Clinical Encounters & SOAP Progress Notes (የህክምና ምርመራ እና የዶክተር ማስታወሻ)
                        </span>
                        <span>{patient.visits.length + patient.medicalRecords.length} Records</span>
                      </div>

                      {patient.visits.length === 0 && patient.medicalRecords.length === 0 ? (
                        <p className="text-xs text-slate-500 italic p-3 border border-dashed border-slate-300 rounded-lg">
                          No clinical consultation notes or OPD visits recorded in this 3-month window.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {patient.visits.map((v) => (
                            <div
                              key={v.id}
                              className="border border-slate-400 rounded-lg p-3 text-xs space-y-2 bg-white print:border-slate-800"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-1 border-b border-slate-200 pb-1 text-[11px]">
                                <span className="font-bold text-black">
                                  Encounter Date: {v.visitDate}
                                  {v.opdRoom && ` • OPD Room ${v.opdRoom}`}
                                </span>
                                <span className="text-slate-600">
                                  Doctor: <strong className="text-black">{v.doctorName || "General Clinician"}</strong> • Status: {v.status}
                                </span>
                              </div>

                              {/* Vitals */}
                              {v.vitals && (v.vitals.bp || v.vitals.heartRate || v.vitals.temp || v.vitals.weight) && (
                                <div className="flex flex-wrap gap-3 text-[11px] bg-slate-50 p-1.5 rounded border border-slate-200">
                                  {v.vitals.bp && <span>BP: <strong className="font-mono">{v.vitals.bp}</strong> mmHg</span>}
                                  {v.vitals.heartRate && <span>Pulse: <strong className="font-mono">{v.vitals.heartRate}</strong> bpm</span>}
                                  {v.vitals.temp && <span>Temp: <strong className="font-mono">{v.vitals.temp}</strong> °C</span>}
                                  {v.vitals.weight && <span>Weight: <strong className="font-mono">{v.vitals.weight}</strong> kg</span>}
                                </div>
                              )}

                              {v.notes && (
                                <p className="text-[11px] text-slate-800">
                                  <strong className="text-black">Consultation Notes:</strong> {v.notes}
                                </p>
                              )}
                            </div>
                          ))}

                          {/* SOAP Progress Notes from MedicalRecord */}
                          {patient.medicalRecords.map((mr) => (
                            <div
                              key={mr.id}
                              className="border border-slate-400 rounded-lg p-3 text-xs space-y-2 bg-white print:border-slate-800"
                            >
                              <div className="flex justify-between items-center border-b border-slate-200 pb-1 text-[11px]">
                                <span className="font-bold text-black">
                                  Clinical Note Date: {mr.date} {mr.source === "paper_import" ? "(Historical Paper Import)" : ""}
                                </span>
                                <span className="text-slate-600">
                                  Clinician: <strong className="text-black">{mr.enteredByName || "Medical Staff"}</strong>
                                </span>
                              </div>

                              {/* SOAP Vitals */}
                              {(mr.bp || mr.heartRate || mr.temp || mr.weight) && (
                                <div className="flex flex-wrap gap-3 text-[11px] bg-slate-50 p-1.5 rounded border border-slate-200">
                                  {mr.bp && <span>BP: <strong className="font-mono">{mr.bp}</strong> mmHg</span>}
                                  {mr.heartRate && <span>Heart Rate: <strong className="font-mono">{mr.heartRate}</strong> bpm</span>}
                                  {mr.temp && <span>Temp: <strong className="font-mono">{mr.temp}</strong> °C</span>}
                                  {mr.weight && <span>Weight: <strong className="font-mono">{mr.weight}</strong> kg</span>}
                                </div>
                              )}

                              {/* SOAP Structured Fields */}
                              {(mr.subjective || mr.objective || mr.assessment || mr.plan) ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                  {mr.subjective && (
                                    <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                                      <strong className="text-black block text-[10px] uppercase">Subjective (S):</strong>
                                      <p className="text-slate-800">{mr.subjective}</p>
                                    </div>
                                  )}
                                  {mr.objective && (
                                    <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                                      <strong className="text-black block text-[10px] uppercase">Objective (O):</strong>
                                      <p className="text-slate-800">{mr.objective}</p>
                                    </div>
                                  )}
                                  {mr.assessment && (
                                    <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                                      <strong className="text-black block text-[10px] uppercase">Assessment (A):</strong>
                                      <p className="text-slate-800">{mr.assessment}</p>
                                    </div>
                                  )}
                                  {mr.plan && (
                                    <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                                      <strong className="text-black block text-[10px] uppercase">Plan (P):</strong>
                                      <p className="text-slate-800">{mr.plan}</p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                mr.content && <p className="text-[11px] text-slate-800">{mr.content}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </section>

                    {/* 5. Diagnostic Laboratory History */}
                    <section className="space-y-3">
                      <div className="border-b border-black pb-1 flex items-center justify-between text-xs font-bold uppercase text-black">
                        <span className="flex items-center gap-1.5">
                          <FlaskConical className="w-3.5 h-3.5" />
                          2. Diagnostic Laboratory Tests & Findings (የላቦራቶሪ ምርመራ ውጤቶች)
                        </span>
                        <span>{patient.labRequests.length} Tests</span>
                      </div>

                      {patient.labRequests.length === 0 ? (
                        <p className="text-xs text-slate-500 italic p-3 border border-dashed border-slate-300 rounded-lg">
                          No diagnostic laboratory investigations conducted in this 3-month window.
                        </p>
                      ) : (
                        <table className="w-full text-left border-collapse text-xs border border-slate-400">
                          <thead>
                            <tr className="bg-slate-100 text-[10px] uppercase tracking-wider text-black border-b border-slate-400">
                              <th className="p-2 border-r border-slate-300">Date Requested</th>
                              <th className="p-2 border-r border-slate-300">Laboratory Test</th>
                              <th className="p-2 border-r border-slate-300">Requesting Doctor</th>
                              <th className="p-2 border-r border-slate-300">Findings & Result Details</th>
                              <th className="p-2">Performed By & Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-300 text-[11px]">
                            {patient.labRequests.map((lab) => (
                              <tr key={lab.id}>
                                <td className="p-2 border-r border-slate-300 font-mono text-[10px]">
                                  {lab.date}
                                </td>
                                <td className="p-2 border-r border-slate-300 font-bold text-black">
                                  {lab.testName}
                                  {lab.notes && (
                                    <span className="block text-[10px] font-normal text-slate-600">
                                      Notes: {lab.notes}
                                    </span>
                                  )}
                                </td>
                                <td className="p-2 border-r border-slate-300">
                                  {lab.requestedByName || "Doctor"}
                                </td>
                                <td className="p-2 border-r border-slate-300 font-medium print:p-1 print:text-[10px]">
                                  {lab.result?.findings ? (
                                    <span className="text-black font-semibold">{formatLabSummary(lab.result.findings)}</span>
                                  ) : (
                                    <span className="text-amber-700 italic">Results pending processing</span>
                                  )}
                                </td>
                                <td className="p-2 text-[10px] print:p-1 print:text-[9px]">
                                  {lab.result ? (
                                    <div>
                                      <span>Tech: {lab.result.enteredByName || "Lab Tech"}</span>
                                      <span className="block text-emerald-700 font-bold">✓ Completed</span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-500">{lab.status}</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </section>

                    {/* 6. Medication & Prescriptions History */}
                    <section className="space-y-3">
                      <div className="border-b border-black pb-1 flex items-center justify-between text-xs font-bold uppercase text-black">
                        <span className="flex items-center gap-1.5">
                          <Pill className="w-3.5 h-3.5" />
                          3. Prescriptions & Medication Administration (የታዘዙ መድኃኒቶች)
                        </span>
                        <span>
                          {patient.prescriptions.reduce((sum, rx) => sum + rx.items.length, 0)} Items Prescribed
                        </span>
                      </div>

                      {patient.prescriptions.length === 0 ? (
                        <p className="text-xs text-slate-500 italic p-3 border border-dashed border-slate-300 rounded-lg">
                          No pharmacy prescriptions issued in this 3-month window.
                        </p>
                      ) : (
                        <table className="w-full text-left border-collapse text-xs border border-slate-400">
                          <thead>
                            <tr className="bg-slate-100 text-[10px] uppercase tracking-wider text-black border-b border-slate-400">
                              <th className="p-2 border-r border-slate-300">Date</th>
                              <th className="p-2 border-r border-slate-300">Medication / Drug Name</th>
                              <th className="p-2 border-r border-slate-300">Unit & Quantity</th>
                              <th className="p-2 border-r border-slate-300">Dosage Instructions</th>
                              <th className="p-2">Prescribing Doctor & Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-300 text-[11px]">
                            {patient.prescriptions.flatMap((rx) =>
                              rx.items.map((item) => (
                                <tr key={item.id}>
                                  <td className="p-2 border-r border-slate-300 font-mono text-[10px]">
                                    {rx.date}
                                  </td>
                                  <td className="p-2 border-r border-slate-300 font-bold text-black">
                                    {item.drugName}
                                  </td>
                                  <td className="p-2 border-r border-slate-300 font-mono">
                                    {item.quantity} {item.unit || "Units"}
                                  </td>
                                  <td className="p-2 border-r border-slate-300">
                                    {item.instructions || "As directed by physician"}
                                  </td>
                                  <td className="p-2 text-[10px]">
                                    <span className="font-semibold block">{rx.doctorName || "Doctor"}</span>
                                    <span
                                      className={`inline-block px-1 rounded text-[9px] font-bold ${
                                        rx.status === "dispensed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                      }`}
                                    >
                                      {rx.status.toUpperCase()}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      )}
                    </section>

                    {/* 7. Official Physical Chart Certification & Signatures */}
                    <footer className="pt-6 border-t-2 border-black space-y-4 print-avoid-break">
                      <div className="bg-slate-50 print:bg-white border border-black p-3 rounded-lg text-center">
                        <p className="text-[11px] font-bold text-black uppercase tracking-wider">
                          Official Hospital Medical Record Attachment Certification
                        </p>
                        <p className="text-[10px] text-slate-700 mt-0.5">
                          ይህ የህክምና ታሪክ ከኤሌክትሮኒክ የህክምና መዝገብ (EHR) የተወሰደ ህጋዊ ሰነድ ሲሆን፤ በቀጥታ ከታካሚው የወረቀት ማህደር (Bure Card) ጋር ተያይዞ መቀመጥ አለበት።
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-8 text-xs pt-2">
                        <div className="space-y-1">
                          <p className="font-bold text-black text-[11px]">Attending Physician / Doctor:</p>
                          <p className="text-slate-600 text-[10px]">Name: ___________________________________________</p>
                          <p className="text-slate-600 text-[10px] pt-4">Signature: ______________________ Date: ____________</p>
                        </div>

                        <div className="space-y-1 text-right">
                          <p className="font-bold text-black text-[11px]">Clinic Medical Director / Manager:</p>
                          <p className="text-slate-600 text-[10px]">Name: {clinicInfo.userName} ({clinicInfo.userRole})</p>
                          <p className="text-slate-600 text-[10px] pt-4">Signature: ______________________ Seal: [ &nbsp; STAMP &nbsp; ]</p>
                        </div>
                      </div>

                      <div className="text-center text-[9px] text-slate-500 font-mono pt-3 border-t border-slate-300">
                        Homicho Ammunition Engineering Industry Clinic • Inpatient Medical Record System • Printed: {new Date().toLocaleString()}
                      </div>
                    </footer>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
