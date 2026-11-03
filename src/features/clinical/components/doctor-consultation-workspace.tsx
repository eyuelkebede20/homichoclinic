"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FileText,
  Activity,
  Stethoscope,
  FlaskConical,
  Droplet,
  Pill,
  Send,
  Printer,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Loader2,
  Search,
  X,
  Heart,
  Thermometer,
  Scale,
  Save,
  Check,
  ChevronRight,
  FileCheck,
  ArrowRight,
  Clock,
  ExternalLink,
  History,
  FileUp,
  Trash2,
} from "lucide-react";
import {
  addClinicalNote,
  requestLabTest,
  createPrescription,
  deletePrescription,
  deletePrescriptionItem,
  saveReferral,
  toggleAdmissionStatus,
  deactivatePatientOpd,
} from "../actions";
import { FinalDiagnosisModal } from "./final-diagnosis-modal";
import { StructuredLabResultView } from "./structured-lab-result-view";
import { openPrintLabResultWindow } from "../utils/print-lab-result";
import { openPrintReferralWindow } from "../utils/print-referral";
import { isStoolTest, isUrineTest, isHematologyTest, formatLabSummary } from "../types/lab-panels";
import { formatToEthiopianDate, calculateAge } from "@/lib/date-utils";
import { MedicalRecordItem, MedicalRecordWithAuthor } from "@/features/patients/components/medical-record-item";
import { PrescriptionHistoryItem } from "@/features/patients/components/prescription-history-item";
import { PaperImportForm } from "./paper-import-form";
import { ScheduleAppointmentForm } from "@/features/visits/components/schedule-appointment-form";

export type DoctorConsultationWorkspaceProps = {
  patient: any;
  activeVisit?: any;
  timeline: Array<{
    type: "record" | "prescription";
    date: Date;
    data: any;
  }>;
  labTests: { id: string; name: string }[];
  drugs: { id: string; name: string }[];
  doctorsList: { id: string; name: string }[];
  referralDestinations?: string[];
  clinicNames?: {
    clinicName?: string;
    clinicNameAmharic?: string;
    clinicSubName?: string;
    clinicSubNameAmharic?: string;
    clinicLogo?: string;
  };
  admissionStatus?: string | null;
  canWriteHistory?: boolean;
  canPrescribe?: boolean;
  canRequestLab?: boolean;
  canCreateVisit?: boolean;
};

type WorkspaceTab = "history" | "vitals" | "assessment" | "results" | "pharmacy" | "referral";

export function DoctorConsultationWorkspace({
  patient,
  activeVisit,
  timeline,
  labTests,
  drugs,
  doctorsList,
  referralDestinations = [],
  clinicNames,
  admissionStatus = "Outpatient",
  canWriteHistory = true,
  canPrescribe = true,
  canRequestLab = true,
  canCreateVisit = true,
}: DoctorConsultationWorkspaceProps) {
  const router = useRouter();
  const patientId = patient.id;

  // Active Tab state (synced with hash if present)
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("history");

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase().replace("#", "");
      if (hash === "pharmacy" || hash === "prescriptions" || hash === "prescription") {
        setActiveTab("pharmacy");
      } else if (hash === "lab-request" || hash === "lab" || hash === "assessment") {
        setActiveTab("assessment");
      } else if (hash === "results" || hash === "lab-results") {
        setActiveTab("results");
      } else if (hash === "vitals") {
        setActiveTab("vitals");
      } else if (hash === "referral") {
        setActiveTab("referral");
      } else if (hash === "history" || hash === "medical-history") {
        setActiveTab("history");
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const [loading, setLoading] = useState(false);

  // ----------------------------------------------------
  // Vitals & SOAP State
  // ----------------------------------------------------
  const nurseVitals = activeVisit?.vitals || {};
  const hasNurseVitals = !!(
    nurseVitals.bloodPressure ||
    nurseVitals.heartRate ||
    nurseVitals.temperature ||
    nurseVitals.weight
  );

  const [bp, setBp] = useState<string>(nurseVitals.bloodPressure || "");
  const [heartRate, setHeartRate] = useState<string>(nurseVitals.heartRate ? String(nurseVitals.heartRate) : "");
  const [temp, setTemp] = useState<string>(nurseVitals.temperature ? String(nurseVitals.temperature) : "");
  const [weight, setWeight] = useState<string>(nurseVitals.weight ? String(nurseVitals.weight) : "");

  const [subjective, setSubjective] = useState<string>("");
  const [objective, setObjective] = useState<string>("");
  const [assessment, setAssessment] = useState<string>("");
  const [plan, setPlan] = useState<string>("");

  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [showPaperImport, setShowPaperImport] = useState(false);

  async function handleSaveClinicalNote(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!assessment.trim() && !subjective.trim() && !plan.trim() && !bp && !heartRate && !temp && !weight) {
      toast.error("Please enter clinical notes, vitals, or assessment before saving.");
      return;
    }

    setLoading(true);
    const res = await addClinicalNote({
      patientId,
      bp: bp.trim() || undefined,
      heartRate: heartRate && !isNaN(parseFloat(heartRate)) ? parseFloat(heartRate) : undefined,
      temp: temp && !isNaN(parseFloat(temp)) ? parseFloat(temp) : undefined,
      weight: weight && !isNaN(parseFloat(weight)) ? parseFloat(weight) : undefined,
      subjective: subjective.trim() || undefined,
      objective: objective.trim() || undefined,
      assessment: assessment.trim() || undefined,
      plan: plan.trim() || undefined,
      content: assessment.trim()
        ? `Clinical Consultation Record - ${assessment.trim()}`
        : "Clinical Consultation Record",
    });
    setLoading(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Clinical record saved successfully.");
      router.refresh();
    }
  }

  // ----------------------------------------------------
  // Lab Tests Ordering State
  // ----------------------------------------------------
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [labSearch, setLabSearch] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  // Stool Panel & Sub-tests
  const mainStoolTest =
    labTests.find((t) => {
      const n = t.name.toLowerCase().trim();
      return (
        n === "stool examination" ||
        n === "stool test" ||
        n === "stool (complete examination)" ||
        (isStoolTest(t.name) && !t.name.includes("-"))
      );
    }) || labTests.find((t) => isStoolTest(t.name));
  const stoolSubTests = labTests.filter((t) => isStoolTest(t.name) && t.id !== mainStoolTest?.id);
  const allStoolTestIds = new Set([mainStoolTest?.id, ...stoolSubTests.map((t) => t.id)].filter(Boolean));

  // Urine Panel & Sub-tests
  const mainUrineTest =
    labTests.find((t) => {
      const n = t.name.toLowerCase().trim();
      return (
        n === "urine examination" ||
        n === "routine urinalysis" ||
        n === "urinalysis" ||
        (isUrineTest(t.name) && !t.name.includes("-"))
      );
    }) || labTests.find((t) => isUrineTest(t.name));
  const urineSubTests = labTests.filter((t) => isUrineTest(t.name) && t.id !== mainUrineTest?.id);
  const allUrineTestIds = new Set([mainUrineTest?.id, ...urineSubTests.map((t) => t.id)].filter(Boolean));

  // Hematology Panel & Sub-tests
  const mainHematologyTest =
    labTests.find((t) => {
      const n = t.name.toLowerCase().trim();
      return (
        n === "hematology" ||
        n === "hematology (complete cbc)" ||
        (isHematologyTest(t.name) && !t.name.includes("-"))
      );
    }) || labTests.find((t) => isHematologyTest(t.name));
  const hematologySubTests = labTests.filter((t) => isHematologyTest(t.name) && t.id !== mainHematologyTest?.id);
  const allHematologyTestIds = new Set(
    [mainHematologyTest?.id, ...hematologySubTests.map((t) => t.id)].filter(Boolean)
  );

  const [showStoolPicker, setShowStoolPicker] = useState(false);
  const [showUrinePicker, setShowUrinePicker] = useState(false);
  const [showHematologyPicker, setShowHematologyPicker] = useState(false);

  const coreIds = new Set([
    ...Array.from(allStoolTestIds),
    ...Array.from(allUrineTestIds),
    ...Array.from(allHematologyTestIds),
  ].filter(Boolean));
  const otherTests = labTests.filter((t) => !coreIds.has(t.id));
  const filteredOtherTests = labSearch.trim()
    ? otherTests.filter((t) => t.name.toLowerCase().includes(labSearch.toLowerCase().trim()))
    : otherTests;

  const selectedStoolCount = Array.from(selectedTests).filter((id) => allStoolTestIds.has(id)).length;
  const isFullStoolSelected = mainStoolTest ? selectedTests.has(mainStoolTest.id) : false;

  const selectedUrineCount = Array.from(selectedTests).filter((id) => allUrineTestIds.has(id)).length;
  const isFullUrineSelected = mainUrineTest ? selectedTests.has(mainUrineTest.id) : false;

  const selectedHematologyCount = Array.from(selectedTests).filter((id) => allHematologyTestIds.has(id)).length;
  const isFullHematologySelected = mainHematologyTest ? selectedTests.has(mainHematologyTest.id) : false;

  function toggleTest(id: string) {
    const next = new Set(selectedTests);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedTests(next);
  }

  async function handleLabSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedTests.size === 0) {
      toast.error("Please select at least one laboratory test.");
      return;
    }

    setLoading(true);
    const res = await requestLabTest({
      patientId,
      testIds: Array.from(selectedTests),
      isUrgent,
    });
    setLoading(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success(isUrgent ? "⚡ URGENT lab request sent to laboratory!" : "Lab request sent to laboratory.");
      setSelectedTests(new Set());
      setIsUrgent(false);
      router.refresh();
      // Auto-advance to results/plan step
      setActiveTab("results");
    }
  }

  // ----------------------------------------------------
  // Prescriptions State (With Quantity Input Fix!)
  // ----------------------------------------------------
  type RxRow = {
    drugId: string;
    search: string;
    quantity: number | string;
    instructions: string;
  };
  const [rxItems, setRxItems] = useState<RxRow[]>([
    { drugId: "", search: "", quantity: 1, instructions: "" },
  ]);

  // Check for returned prescriptions from pharmacy
  const returnedPrescriptions = useMemo(() => {
    return (patient.prescriptions || []).filter((p: any) => p.status === "returned");
  }, [patient.prescriptions]);

  // Check for queued prescriptions waiting at pharmacy (pending dispensing)
  const queuedPrescriptions = useMemo(() => {
    return (patient.prescriptions || []).filter(
      (p: any) =>
        p.status === "pending" &&
        !p.deletedAt &&
        (p.items || []).some((i: any) => !i.deletedAt)
    );
  }, [patient.prescriptions]);

  async function handleRxSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const filledItems = rxItems.filter((i) => i.search || i.drugId || i.instructions);
    const invalidItems = filledItems.filter(
      (i) => !i.drugId || Number(i.quantity) <= 0 || !i.instructions.trim()
    );

    if (filledItems.length === 0) {
      toast.error("Please complete at least one prescription item.");
      setLoading(false);
      return;
    }

    if (invalidItems.length > 0) {
      toast.error("One or more items are invalid (missing drug selection, quantity < 1, or empty dosage).");
      setLoading(false);
      return;
    }

    const payload = filledItems.map((item) => ({
      drugId: item.drugId,
      quantity: Math.max(1, Number(item.quantity) || 1),
      instructions: item.instructions.trim(),
    }));

    const res = await createPrescription({ patientId, items: payload });
    setLoading(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Prescription sent to pharmacy successfully.");
      setRxItems([{ drugId: "", search: "", quantity: 1, instructions: "" }]);
      router.refresh();
    }
  }

  // ----------------------------------------------------
  // Referral State
  // ----------------------------------------------------
  const [refType, setRefType] = useState("Standard Referral");
  const [refDest, setRefDest] = useState("");
  const [refReason, setRefReason] = useState("");

  async function handleReferralSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!refDest.trim() || !refReason.trim()) {
      toast.error("Destination and Reason are required.");
      return;
    }
    setLoading(true);
    const res = await saveReferral({
      patientId,
      destination: refDest.trim(),
      reason: refReason.trim(),
      type: refType,
    });
    setLoading(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Referral record created. Opening single-page A4 print view...");
      openPrintReferralWindow({
        patient,
        destination: refDest.trim(),
        reason: refReason.trim(),
        clinicNames,
      });
      setRefDest("");
      setRefReason("");
      router.refresh();
    }
  }

  // Completed lab requests for this patient
  const completedLabRequests = (patient.labRequests || []).filter((r: any) => r.status === "completed");
  const pendingLabRequests = (patient.labRequests || []).filter((r: any) => r.status !== "completed");

  return (
    <div className="space-y-6">
      {/* OPD Station Bar & Admission Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Doctor Consultation Workspace
              </h2>
              {activeVisit?.opdRoom && (
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                  OPD Room {activeVisit.opdRoom}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Structured clinical flow: History &rarr; Vitals &rarr; Assessment &rarr; Plan &rarr; Pharmacy
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeVisit?.opdRoom && (
            <button
              type="button"
              onClick={async () => {
                if (!confirm("Release and deactivate this patient from OPD queue?")) return;
                setLoading(true);
                const res = await deactivatePatientOpd({ patientId, visitId: activeVisit?.id });
                setLoading(false);
                if (res.error) toast.error(res.error);
                else {
                  toast.success("Patient released from OPD queue.");
                  router.refresh();
                }
              }}
              disabled={loading}
              className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 font-semibold px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800 transition-colors"
            >
              Release OPD Room
            </button>
          )}

          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              admissionStatus === "Inpatient"
                ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
            }`}
          >
            {admissionStatus || "Outpatient"}
          </span>

          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              const res = await toggleAdmissionStatus({ patientId, currentStatus: admissionStatus });
              setLoading(false);
              if (res.error) toast.error(res.error);
              else router.refresh();
            }}
            disabled={loading}
            className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-1 px-3 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors"
          >
            {admissionStatus === "Inpatient" ? "Discharge to Outpatient" : "Admit to Inpatient"}
          </button>
        </div>
      </div>

      {/* Returned Prescriptions Banner Alert */}
      {returnedPrescriptions.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-700 rounded-2xl p-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Action Required: Prescription Returned by Pharmacy ({returnedPrescriptions.length})
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                The pharmacy flagged an issue with the ordered medication. Review the note below and prescribe an updated regimen.
              </p>
              <div className="mt-2.5 space-y-1.5">
                {returnedPrescriptions.map((rx: any) => (
                  <div
                    key={rx.id}
                    className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 p-2.5 rounded-lg text-xs"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                      <span>Prescription #{rx.id.slice(-6).toUpperCase()}</span>
                      <span className="text-[11px] text-slate-400">{formatToEthiopianDate(rx.updatedAt)}</span>
                    </div>
                    {rx.items?.map((it: any) => (
                      <p key={it.id} className="text-amber-900 dark:text-amber-300 font-medium mt-1">
                        • {it.drug?.name} (Qty: {it.quantity}) - {it.instructions}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("pharmacy")}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-xs"
              >
                <Pill className="w-3.5 h-3.5" />
                Go to Pharmacy Tab to Rewrite Medication &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Tab Navigation Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto bg-slate-50/50 dark:bg-slate-950/40">
          {/* Tab 1: History */}
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === "history"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 shadow-2xs"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100/50"
            }`}
          >
            <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>1. History & Clinical Note</span>
            {timeline.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 font-mono">
                {timeline.length}
              </span>
            )}
          </button>

          {/* Tab 2: Vitals */}
          <button
            type="button"
            onClick={() => setActiveTab("vitals")}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === "vitals"
                ? "border-rose-600 text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 shadow-2xs"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100/50"
            }`}
          >
            <Activity className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>2. Vital Signs</span>
            {hasNurseVitals && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 font-semibold">
                ✓ Nurse
              </span>
            )}
          </button>

          {/* Tab 3: Assessment & Lab Work */}
          <button
            type="button"
            onClick={() => setActiveTab("assessment")}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === "assessment"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 shadow-2xs"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100/50"
            }`}
          >
            <FlaskConical className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>3. Assessment & Lab Orders</span>
            {selectedTests.size > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-600 text-white font-mono font-bold animate-pulse">
                {selectedTests.size} selected
              </span>
            )}
          </button>

          {/* Tab 4: Lab Results & Final Diagnosis */}
          <button
            type="button"
            onClick={() => setActiveTab("results")}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === "results"
                ? "border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-900 shadow-2xs"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100/50"
            }`}
          >
            <FileCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>4. Lab Results & Plan</span>
            {completedLabRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 font-mono">
                {completedLabRequests.length} Ready
              </span>
            )}
          </button>

          {/* Tab 5: Pharmacy (Prominent Pill Icon!) */}
          <button
            type="button"
            onClick={() => setActiveTab("pharmacy")}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === "pharmacy"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 shadow-2xs"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100/50"
            }`}
          >
            <Pill className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>5. Pharmacy / Prescribe</span>
            {returnedPrescriptions.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold animate-pulse">
                ! Returned
              </span>
            )}
          </button>

          {/* Tab 6: Referral & Appointments */}
          <button
            type="button"
            onClick={() => setActiveTab("referral")}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === "referral"
                ? "border-sky-600 text-sky-600 dark:text-sky-400 bg-white dark:bg-slate-900 shadow-2xs"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100/50"
            }`}
          >
            <Send className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>6. Referral & Follow-up</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="p-6">
          {/* ========================================================= */}
          {/* TAB 1: HISTORY & CLINICAL NOTES (Take history first!) */}
          {/* ========================================================= */}
          {activeTab === "history" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Patient History & Subjective Assessment
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review past medical records first, then record presenting symptoms and history of present illness.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPaperImport(!showPaperImport)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <FileUp className="w-3.5 h-3.5 text-amber-600" />
                  {showPaperImport ? "Hide Paper Import" : "+ Import Legacy Paper Card"}
                </button>
              </div>

              {/* Collapsible Paper Import Box */}
              {showPaperImport && (
                <div className="p-4 bg-orange-50/60 dark:bg-orange-950/20 border-2 border-orange-300 dark:border-orange-800 rounded-xl animate-in fade-in duration-200">
                  <PaperImportForm patientId={patient.id} />
                </div>
              )}

              {/* Subjective Chief Complaint Form */}
              <div className="bg-blue-50/40 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 space-y-3">
                <label className="block text-xs font-bold text-blue-950 dark:text-blue-300">
                  Subjective (Chief Complaint & History of Present Illness):
                </label>
                <textarea
                  value={subjective}
                  onChange={(e) => setSubjective(e.target.value)}
                  rows={3}
                  placeholder="Patient's primary complaints, symptoms onset, duration, severity, and medical background..."
                  className="w-full text-xs rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-950 p-3 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSaveClinicalNote()}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Note
                  </button>
                </div>
              </div>

              {/* Past Medical History Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Archived Medical Records & Past Consultations ({timeline.length})
                </h4>

                {timeline.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
                    No past records found for this patient. This is their first recorded clinical encounter.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {timeline.map((item) =>
                      item.type === "record" ? (
                        <MedicalRecordItem key={item.data.id} record={item.data as MedicalRecordWithAuthor} />
                      ) : (
                        <PrescriptionHistoryItem key={item.data.id} prescription={item.data as any} />
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Step Navigation Button */}
              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab("vitals")}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <span>Next: Check Vital Signs</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: VITAL SIGNS TELEMETRY */}
          {/* ========================================================= */}
          {activeTab === "vitals" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    Patient Vital Signs
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review triage measurements pre-filled by nursing staff or update with current examination numbers.
                  </p>
                </div>
                {hasNurseVitals && (
                  <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 px-3 py-1 rounded-full font-bold border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Pre-filled by Triage Nurse
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Blood Pressure */}
                <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-indigo-500" />
                      Blood Pressure
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">mmHg</span>
                  </div>
                  <input
                    type="text"
                    value={bp}
                    onChange={(e) => setBp(e.target.value)}
                    placeholder="120/80"
                    className="w-full text-lg font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 block">Normal range: ~120/80 mmHg</span>
                </div>

                {/* Heart Rate */}
                <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-rose-500" />
                      Heart Rate
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">bpm</span>
                  </div>
                  <input
                    type="number"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    placeholder="72"
                    className="w-full text-lg font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 block">Normal range: 60 - 100 bpm</span>
                </div>

                {/* Temperature */}
                <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Thermometer className="w-4 h-4 text-amber-500" />
                      Temperature
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">°C</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    placeholder="36.5"
                    className="w-full text-lg font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 block">Normal range: 36.5 - 37.5 °C</span>
                </div>

                {/* Weight */}
                <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-emerald-500" />
                      Weight
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">kg</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="70"
                    className="w-full text-lg font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 block">Body weight in kilograms</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleSaveClinicalNote()}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Vitals
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("assessment")}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <span>Next: Assessment & Lab Orders</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: ASSESSMENT & LAB ORDERS */}
          {/* ========================================================= */}
          {activeTab === "assessment" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Working Assessment & Laboratory Orders
                  </h3>
                  <p className="text-xs text-slate-500">
                    Document initial physical findings and order diagnostic panels (Hematology, Stool, Urine, or Serology).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUrgent(!isUrgent)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    isUrgent
                      ? "bg-red-600 text-white border-red-700 shadow-md animate-pulse ring-2 ring-red-400/50"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                  }`}
                >
                  <AlertTriangle className={`w-3.5 h-3.5 ${isUrgent ? "text-white" : "text-amber-500"}`} />
                  {isUrgent ? "⚡ MARKED AS URGENT (STAT)" : "Mark Order as Urgent"}
                </button>
              </div>

              {/* Physical Exam & Initial Assessment Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Objective (Physical Examination Findings):
                  </label>
                  <textarea
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    rows={2}
                    placeholder="Cardiovascular, respiratory, abdominal, neurological findings..."
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Working Clinical Assessment (Differential Diagnosis):
                  </label>
                  <textarea
                    value={assessment}
                    onChange={(e) => setAssessment(e.target.value)}
                    rows={2}
                    placeholder="Suspected condition, syndromic diagnosis, or differential..."
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Lab Request Form */}
              <form onSubmit={handleLabSubmit} className="space-y-5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    Core Diagnostic Panels (Selective Sub-tests Available)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* 1. Stool Examination */}
                    <div
                      className={`flex flex-col text-left p-3.5 rounded-xl border-2 transition-all ${
                        selectedStoolCount > 0
                          ? "bg-emerald-700 text-white border-emerald-800 shadow-md"
                          : "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200 hover:border-emerald-400"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-1.5 rounded-lg ${
                              selectedStoolCount > 0
                                ? "bg-white/20 text-white"
                                : "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300"
                            }`}
                          >
                            <FlaskConical className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-sm block">Stool Examination</span>
                            <span
                              className={`text-[10px] block ${
                                selectedStoolCount > 0 ? "text-emerald-200" : "text-slate-400"
                              }`}
                            >
                              {selectedStoolCount === 0
                                ? "Click to order"
                                : isFullStoolSelected
                                ? "Complete Stool Panel"
                                : `${selectedStoolCount} test(s) selected`}
                            </span>
                          </div>
                        </div>
                        {selectedStoolCount > 0 && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>

                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-emerald-200/50 dark:border-emerald-800/50">
                        {mainStoolTest && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = new Set(selectedTests);
                              if (next.has(mainStoolTest.id)) next.delete(mainStoolTest.id);
                              else {
                                stoolSubTests.forEach((st) => next.delete(st.id));
                                next.add(mainStoolTest.id);
                              }
                              setSelectedTests(next);
                            }}
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                              isFullStoolSelected
                                ? "bg-white text-emerald-800 shadow-sm"
                                : selectedStoolCount > 0
                                ? "bg-emerald-800 text-white border border-emerald-500"
                                : "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200"
                            }`}
                          >
                            {isFullStoolSelected ? "✓ Full Stool" : "Order Full Stool"}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setShowStoolPicker(!showStoolPicker)}
                          className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-black/10 hover:bg-black/20 text-current transition-colors"
                        >
                          {showStoolPicker ? "Hide ▲" : "Pick Sub-tests ▼"}
                        </button>
                      </div>

                      {showStoolPicker && (
                        <div className="mt-2.5 pt-2.5 border-t border-emerald-300/40 dark:border-emerald-800/60 space-y-1.5 animate-in fade-in duration-150">
                          <p className="text-[10px] font-bold opacity-90">Select specific sub-test(s):</p>
                          <div className="flex flex-wrap gap-1">
                            {stoolSubTests.map((sub) => {
                              const isSubSelected = selectedTests.has(sub.id);
                              const label = sub.name.replace(/^Stool\s*-\s*/i, "");
                              return (
                                <button
                                  key={sub.id}
                                  type="button"
                                  onClick={() => {
                                    const next = new Set(selectedTests);
                                    if (mainStoolTest) next.delete(mainStoolTest.id);
                                    if (isSubSelected) next.delete(sub.id);
                                    else next.add(sub.id);
                                    setSelectedTests(next);
                                  }}
                                  className={`text-[10px] px-2 py-0.5 rounded border transition-all ${
                                    isSubSelected
                                      ? "bg-white text-emerald-900 border-white font-bold"
                                      : "bg-black/10 border-transparent hover:bg-black/20"
                                  }`}
                                >
                                  {isSubSelected ? "✓ " : "+ "}
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2. Urine Examination */}
                    <div
                      className={`flex flex-col text-left p-3.5 rounded-xl border-2 transition-all ${
                        selectedUrineCount > 0
                          ? "bg-amber-600 text-white border-amber-700 shadow-md"
                          : "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60 text-amber-950 dark:text-amber-200 hover:border-amber-400"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-1.5 rounded-lg ${
                              selectedUrineCount > 0
                                ? "bg-white/20 text-white"
                                : "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300"
                            }`}
                          >
                            <Droplet className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-sm block">Urine Examination</span>
                            <span
                              className={`text-[10px] block ${
                                selectedUrineCount > 0 ? "text-amber-200" : "text-slate-400"
                              }`}
                            >
                              {selectedUrineCount === 0
                                ? "Click to order"
                                : isFullUrineSelected
                                ? "Complete Urine Panel"
                                : `${selectedUrineCount} test(s) selected`}
                            </span>
                          </div>
                        </div>
                        {selectedUrineCount > 0 && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>

                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-amber-200/50 dark:border-amber-800/50">
                        {mainUrineTest && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = new Set(selectedTests);
                              if (next.has(mainUrineTest.id)) next.delete(mainUrineTest.id);
                              else {
                                urineSubTests.forEach((st) => next.delete(st.id));
                                next.add(mainUrineTest.id);
                              }
                              setSelectedTests(next);
                            }}
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                              isFullUrineSelected
                                ? "bg-white text-amber-900 shadow-sm"
                                : selectedUrineCount > 0
                                ? "bg-amber-700 text-white border border-amber-400"
                                : "bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 hover:bg-amber-200"
                            }`}
                          >
                            {isFullUrineSelected ? "✓ Full Urine" : "Order Full Urine"}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setShowUrinePicker(!showUrinePicker)}
                          className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-black/10 hover:bg-black/20 text-current transition-colors"
                        >
                          {showUrinePicker ? "Hide ▲" : "Pick Sub-tests ▼"}
                        </button>
                      </div>

                      {showUrinePicker && (
                        <div className="mt-2.5 pt-2.5 border-t border-amber-300/40 dark:border-amber-800/60 space-y-1.5 animate-in fade-in duration-150">
                          <p className="text-[10px] font-bold opacity-90">Select specific sub-test(s):</p>
                          <div className="flex flex-wrap gap-1">
                            {urineSubTests.map((sub) => {
                              const isSubSelected = selectedTests.has(sub.id);
                              const label = sub.name.replace(/^Urine\s*-\s*/i, "");
                              return (
                                <button
                                  key={sub.id}
                                  type="button"
                                  onClick={() => {
                                    const next = new Set(selectedTests);
                                    if (mainUrineTest) next.delete(mainUrineTest.id);
                                    if (isSubSelected) next.delete(sub.id);
                                    else next.add(sub.id);
                                    setSelectedTests(next);
                                  }}
                                  className={`text-[10px] px-2 py-0.5 rounded border transition-all ${
                                    isSubSelected
                                      ? "bg-white text-amber-950 border-white font-bold"
                                      : "bg-black/10 border-transparent hover:bg-black/20"
                                  }`}
                                >
                                  {isSubSelected ? "✓ " : "+ "}
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 3. Hematology / CBC */}
                    <div
                      className={`flex flex-col text-left p-3.5 rounded-xl border-2 transition-all ${
                        selectedHematologyCount > 0
                          ? "bg-rose-700 text-white border-rose-800 shadow-md"
                          : "bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60 text-rose-950 dark:text-rose-200 hover:border-rose-400"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-1.5 rounded-lg ${
                              selectedHematologyCount > 0
                                ? "bg-white/20 text-white"
                                : "bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300"
                            }`}
                          >
                            <Activity className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-sm block">Hematology / CBC</span>
                            <span
                              className={`text-[10px] block ${
                                selectedHematologyCount > 0 ? "text-rose-200" : "text-slate-400"
                              }`}
                            >
                              {selectedHematologyCount === 0
                                ? "Click to order"
                                : isFullHematologySelected
                                ? "Complete CBC Panel"
                                : `${selectedHematologyCount} test(s) selected`}
                            </span>
                          </div>
                        </div>
                        {selectedHematologyCount > 0 && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>

                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-rose-200/50 dark:border-rose-800/50">
                        {mainHematologyTest && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = new Set(selectedTests);
                              if (next.has(mainHematologyTest.id)) next.delete(mainHematologyTest.id);
                              else {
                                hematologySubTests.forEach((st) => next.delete(st.id));
                                next.add(mainHematologyTest.id);
                              }
                              setSelectedTests(next);
                            }}
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                              isFullHematologySelected
                                ? "bg-white text-rose-800 shadow-sm"
                                : selectedHematologyCount > 0
                                ? "bg-rose-800 text-white border border-rose-500"
                                : "bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 hover:bg-rose-200"
                            }`}
                          >
                            {isFullHematologySelected ? "✓ Full CBC" : "Order Full CBC"}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setShowHematologyPicker(!showHematologyPicker)}
                          className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-black/10 hover:bg-black/20 text-current transition-colors"
                        >
                          {showHematologyPicker ? "Hide ▲" : "Pick Sub-tests ▼"}
                        </button>
                      </div>

                      {showHematologyPicker && (
                        <div className="mt-2.5 pt-2.5 border-t border-rose-300/40 dark:border-rose-800/60 space-y-1.5 animate-in fade-in duration-150">
                          <p className="text-[10px] font-bold opacity-90">Select specific sub-test(s):</p>
                          <div className="flex flex-wrap gap-1">
                            {hematologySubTests.map((sub) => {
                              const isSubSelected = selectedTests.has(sub.id);
                              const label = sub.name.replace(/^Hematology\s*-\s*/i, "");
                              return (
                                <button
                                  key={sub.id}
                                  type="button"
                                  onClick={() => {
                                    const next = new Set(selectedTests);
                                    if (mainHematologyTest) next.delete(mainHematologyTest.id);
                                    if (isSubSelected) next.delete(sub.id);
                                    else next.add(sub.id);
                                    setSelectedTests(next);
                                  }}
                                  className={`text-[10px] px-2 py-0.5 rounded border transition-all ${
                                    isSubSelected
                                      ? "bg-white text-rose-900 border-white font-bold"
                                      : "bg-black/10 border-transparent hover:bg-black/20"
                                  }`}
                                >
                                  {isSubSelected ? "✓ " : "+ "}
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Tests & Serology Catalog (Dynamic live search!) */}
                {otherTests.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Additional Diagnostic & Serology Catalog ({otherTests.length} tests available)
                      </h4>
                      <div className="relative w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search catalog tests..."
                          value={labSearch}
                          onChange={(e) => setLabSearch(e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-7 py-1.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                        {labSearch && (
                          <button
                            type="button"
                            onClick={() => setLabSearch("")}
                            className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/60 dark:bg-slate-950/40 flex flex-wrap gap-1.5">
                      {filteredOtherTests.length === 0 ? (
                        <p className="text-xs text-slate-400 italic p-2">No tests match &quot;{labSearch}&quot;.</p>
                      ) : (
                        filteredOtherTests.map((t) => {
                          const isSelected = selectedTests.has(t.id);
                          return (
                            <button
                              type="button"
                              key={t.id}
                              onClick={() => toggleTest(t.id)}
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                                isSelected
                                  ? "bg-indigo-600 border-indigo-500 text-white font-bold shadow-xs"
                                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-indigo-400"
                              }`}
                            >
                              {isSelected ? "✓ " : "+ "}
                              {t.name}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Selected Tests Summary & Submit */}
                {selectedTests.size > 0 && (
                  <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
                    <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      {selectedTests.size} Laboratory Test{selectedTests.size > 1 ? "s" : ""} Selected
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedTests(new Set())}
                        className="text-xs text-red-600 hover:underline font-semibold mr-2"
                      >
                        Clear Selection
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        Send Lab Request &rarr;
                      </button>
                    </div>
                  </div>
                )}
              </form>

              {/* Step Navigation Button */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleSaveClinicalNote()}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Assessment
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("results")}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <span>Next: Review Lab Results & Plan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: LAB RESULTS & PLAN (FINAL DIAGNOSIS) */}
          {/* ========================================================= */}
          {activeTab === "results" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    Laboratory Diagnostic Findings & Final Diagnosis
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review validated findings from the laboratory (cleanly formatted, zero raw JSON) and confirm the Final Diagnosis.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDiagnosisModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Confirm Final Diagnosis (ICD-10)
                </button>
              </div>

              {/* Patient's Lab Results Cards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Patient Lab Findings ({patient.labRequests?.length || 0})
                  </h4>
                  {pendingLabRequests.length > 0 && (
                    <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {pendingLabRequests.length} investigation(s) in progress by lab
                    </span>
                  )}
                </div>

                {!patient.labRequests || patient.labRequests.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
                    No laboratory tests ordered yet for this patient. Switch to Tab 3 (Assessment & Lab Orders) to request investigations.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {patient.labRequests.map((req: any) => {
                      const isCompleted = req.status === "completed";
                      return (
                        <div
                          key={req.id}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                            <div className="flex items-center gap-2">
                              <FlaskConical className="w-4 h-4 text-purple-600" />
                              <strong className="text-sm text-slate-900 dark:text-slate-100">{req.test.name}</strong>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isCompleted
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                    : req.status === "urgent"
                                    ? "bg-rose-100 text-rose-800 font-bold animate-pulse"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {req.status.toUpperCase()}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400">
                                {formatToEthiopianDate(req.createdAt)}
                              </span>
                              {isCompleted && req.result && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openPrintLabResultWindow({
                                      patient,
                                      testName: req.test.name,
                                      findings: req.result.findings,
                                      date: req.result.createdAt,
                                      clinicNames,
                                    })
                                  }
                                  className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
                                  title="Print Lab Voucher"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Render Formatted Lab Findings (Zero Raw JSON) */}
                          {isCompleted && req.result ? (
                            <StructuredLabResultView findings={req.result.findings} testName={req.test.name} />
                          ) : (
                            <p className="text-xs text-slate-400 italic">
                              Specimen under analysis in laboratory. Findings will appear here automatically upon release.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Management Plan Form */}
              <div className="bg-purple-50/40 dark:bg-purple-950/20 p-4 rounded-xl border border-purple-200 dark:border-purple-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-purple-950 dark:text-purple-300">
                    Plan / Management Therapy (Counseling, Follow-up, Nursing Orders):
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowDiagnosisModal(true)}
                    className="text-xs font-bold text-purple-700 dark:text-purple-300 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Disease to Assessment
                  </button>
                </div>
                <textarea
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  rows={3}
                  placeholder="Definitive therapy plan, dietary advice, follow-up instructions..."
                  className="w-full text-xs rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-950 p-3 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSaveClinicalNote()}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Plan & Record
                  </button>
                </div>
              </div>

              {/* Step Navigation Button */}
              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab("pharmacy")}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <Pill className="w-4 h-4" />
                  <span>Next: Prescribe Medications</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: PHARMACY / PRESCRIBE (Prominent Pill Icon!) */}
          {/* ========================================================= */}
          {activeTab === "pharmacy" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Pill className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    Electronic Prescriptions & Medication Formulary
                  </h3>
                  <p className="text-xs text-slate-500">
                    Search active institutional formulary medicines, specify dosage instructions, and dispatch to pharmacy.
                  </p>
                </div>
              </div>

              {/* Returned Prescriptions Notice */}
              {returnedPrescriptions.length > 0 && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Note:</strong> Pharmacy previously returned a prescription for this patient. Please review the returned note and submit an adjusted medication order.
                  </span>
                </div>
              )}

              {/* Queued Prescriptions at Pharmacy Notice / Card */}
              {queuedPrescriptions.length > 0 && (
                <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                        Currently Queued at Pharmacy (Pending Dispensing)
                      </h4>
                      <span className="text-[10px] font-bold bg-amber-200 dark:bg-amber-800/60 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full">
                        {queuedPrescriptions.reduce(
                          (acc: number, p: any) =>
                            acc + (p.items?.filter((i: any) => !i.deletedAt)?.length || 0),
                          0
                        )}{" "}
                        queued
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-700/80 dark:text-amber-400">
                      Click <span className="font-bold">✕</span> to remove any medicine before it is dispensed
                    </p>
                  </div>

                  <div className="space-y-2">
                    {queuedPrescriptions.map((rx: any) => {
                      const activeItems = (rx.items || []).filter((i: any) => !i.deletedAt);
                      if (activeItems.length === 0) return null;
                      return (
                        <div
                          key={rx.id}
                          className="bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/40 rounded-xl p-3 shadow-2xs"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
                            <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              Prescribed {formatToEthiopianDate(rx.createdAt)}
                            </span>
                            <button
                              type="button"
                              onClick={async () => {
                                if (
                                  !confirm(
                                    "Are you sure you want to cancel and remove this entire prescription from the pharmacy queue?"
                                  )
                                )
                                  return;
                                setLoading(true);
                                const res = await deletePrescription({ prescriptionId: rx.id });
                                setLoading(false);
                                if (res.error) toast.error(res.error);
                                else {
                                  toast.success("Prescription removed from pharmacy queue.");
                                  router.refresh();
                                }
                              }}
                              disabled={loading}
                              className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 hover:underline flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              Remove Entire Prescription
                            </button>
                          </div>

                          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                            {activeItems.map((item: any) => (
                              <li
                                key={item.id}
                                className="py-2 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300"
                              >
                                <div className="flex items-center gap-2">
                                  <Pill className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  <span className="font-bold text-slate-900 dark:text-slate-100">
                                    {item.drug?.name || "Medication"}
                                  </span>
                                  <span className="text-slate-500 font-mono">×{item.quantity}</span>
                                  {item.instructions && (
                                    <span className="text-slate-400 italic truncate max-w-xs">
                                      — {item.instructions}
                                    </span>
                                  )}
                                </div>

                                {/* Simple X button */}
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const drugName = item.drug?.name || "this medicine";
                                    if (
                                      !confirm(
                                        `Remove "${drugName}" from pharmacy queue before it is dispensed?`
                                      )
                                    )
                                      return;
                                    setLoading(true);
                                    const res = await deletePrescriptionItem({ itemId: item.id });
                                    setLoading(false);
                                    if (res.error) toast.error(res.error);
                                    else {
                                      toast.success(`"${drugName}" removed from pharmacy queue.`);
                                      router.refresh();
                                    }
                                  }}
                                  disabled={loading}
                                  className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                  title={`Remove ${item.drug?.name || "medicine"} before dispensing`}
                                >
                                  <X className="w-4 h-4 text-slate-400 hover:text-red-600" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Prescription Items Form */}
              <form onSubmit={handleRxSubmit} className="space-y-4">
                <div className="space-y-3">
                  {rxItems.map((item, index) => {
                    const filteredDrugs = drugs.filter((d) =>
                      d.name.toLowerCase().includes(item.search.toLowerCase())
                    );

                    return (
                      <div
                        key={index}
                        className="flex flex-col md:flex-row gap-3 items-start md:items-center p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50"
                      >
                        {/* Drug Selector / Search */}
                        <div className="flex-1 w-full relative">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Drug Name (Available in Stock)
                          </label>
                          <input
                            type="text"
                            placeholder="Type to search medication..."
                            value={item.search}
                            onChange={(e) => {
                              const newItems = [...rxItems];
                              newItems[index].search = e.target.value;
                              newItems[index].drugId = "";
                              setRxItems(newItems);
                            }}
                            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500 outline-none"
                          />
                          {item.search && !item.drugId && (
                            <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                              {filteredDrugs.length === 0 ? (
                                <div className="p-2 text-xs text-slate-400">No matching drug found in active stock.</div>
                              ) : (
                                filteredDrugs.map((d) => (
                                  <div
                                    key={d.id}
                                    onClick={() => {
                                      const newItems = [...rxItems];
                                      newItems[index].drugId = d.id;
                                      newItems[index].search = d.name;
                                      setRxItems(newItems);
                                    }}
                                    className="p-2.5 text-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer border-b last:border-0 border-slate-100 dark:border-slate-800 font-medium"
                                  >
                                    {d.name}
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>

                        {/* Quantity Input (FIXED: Can remove 1!) */}
                        <div className="w-full md:w-28">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity === "" ? "" : item.quantity}
                            onChange={(e) => {
                              const val = e.target.value;
                              const newItems = [...rxItems];
                              // Allow typing freely; don't snap back to 1 immediately on backspace
                              newItems[index].quantity = val === "" ? ("" as any) : parseInt(val, 10) || 0;
                              setRxItems(newItems);
                            }}
                            onBlur={() => {
                              const newItems = [...rxItems];
                              if (!newItems[index].quantity || Number(newItems[index].quantity) < 1) {
                                newItems[index].quantity = 1;
                                setRxItems(newItems);
                              }
                            }}
                            className="w-full text-xs font-bold font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500 outline-none"
                          />
                        </div>

                        {/* Dosage Instructions */}
                        <div className="flex-1 w-full">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Dosage & Intake Instructions
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="e.g. 500mg PO TID x 5 days after meals"
                              value={item.instructions}
                              onChange={(e) => {
                                const newItems = [...rxItems];
                                newItems[index].instructions = e.target.value;
                                setRxItems(newItems);
                              }}
                              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500 outline-none"
                            />
                            {rxItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setRxItems(rxItems.filter((_, idx) => idx !== index))}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors shrink-0"
                                title="Remove drug line"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setRxItems([...rxItems, { drugId: "", search: "", quantity: 1, instructions: "" }])
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Add Another Medication
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pill className="w-3.5 h-3.5" />}
                    Send Prescription to Pharmacy &rarr;
                  </button>
                </div>
              </form>

              {/* Step Navigation Button */}
              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab("referral")}
                  className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <span>Next: Referral & Follow-up</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: REFERRAL & FOLLOW-UP APPOINTMENTS */}
          {/* ========================================================= */}
          {activeTab === "referral" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Send className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    Referral Letter & Follow-up Appointments
                  </h3>
                  <p className="text-xs text-slate-500">
                    Generate an official single-page A4 referral letter and schedule follow-up outpatient visits.
                  </p>
                </div>
              </div>

              {/* Referral Form */}
              <form onSubmit={handleReferralSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Referral Destination Hospital / Center
                    </label>
                    <input
                      type="text"
                      list="destinations"
                      placeholder="e.g. Tikur Anbessa Hospital, Felege Hiwot Hospital..."
                      value={refDest}
                      onChange={(e) => setRefDest(e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-sky-500 outline-none"
                    />
                    <datalist id="destinations">
                      {referralDestinations.map((d, i) => (
                        <option key={i} value={d} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Referral Type
                    </label>
                    <select
                      value={refType}
                      onChange={(e) => setRefType(e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-sky-500 outline-none"
                    >
                      <option value="Standard Referral">Standard Referral</option>
                      <option value="Emergency Transfer">⚡ Emergency Transfer</option>
                      <option value="Specialist Consultation">Specialist Consultation</option>
                      <option value="Diagnostic Investigation">Diagnostic Investigation</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Clinical Reason & Summary of Findings
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Brief summary of presenting complaints, provisional diagnosis, treatment rendered, and reason for transfer..."
                    value={refReason}
                    onChange={(e) => setRefReason(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Generate & Print Single-Page A4 Referral Letter
                  </button>
                </div>
              </form>

              {/* Schedule Follow-up Appointment */}
              {canCreateVisit && (
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Book Follow-up Appointment (Ethiopian Calendar)
                  </h4>
                  <ScheduleAppointmentForm patientId={patient.id} doctors={doctorsList} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Disease Selection Modal */}
      {showDiagnosisModal && (
        <FinalDiagnosisModal
          isOpen={showDiagnosisModal}
          onClose={() => setShowDiagnosisModal(false)}
          patientName={`${patient.firstName} ${patient.lastName}`}
          patientId={patientId}
          title="Select Diagnosed Generalized Diseases"
          confirmLabel="Add to Assessment & Plan"
          onConfirm={async ({ finalDiagnosis }) => {
            setAssessment((prev) => (prev.trim() ? `${prev.trim()}; ${finalDiagnosis}` : finalDiagnosis));
            setPlan((prev) =>
              prev.trim()
                ? `${prev.trim()}; Protocol instituted for ${finalDiagnosis}`
                : `Treatment protocol instituted for: ${finalDiagnosis}`
            );
            setShowDiagnosisModal(false);
            toast.success(`Added ${finalDiagnosis} to Assessment & Plan.`);
          }}
        />
      )}
    </div>
  );
}
