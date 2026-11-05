"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  User, 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  ArrowLeft, 
  Phone, 
  Shield, 
  Building2, 
  Percent, 
  Users, 
  AlertCircle, 
  Stethoscope 
} from "lucide-react";
import { calculateAge, formatToEthiopianDate } from "@/lib/date-utils";
import { DiscountSlider } from "./discount-slider";

interface CompactPatientBannerProps {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    salutation?: string | null;
    gender?: string | null;
    yob?: string | number | null;
    contactNumber?: string | null;
    employeeId?: string | null;
    militaryId?: string | null;
    patientType: string;
    relationship?: string | null;
    permanentSince?: string | null;
    department?: string | null;
    c_m?: string | null;
    discountPercent: number;
    status: string;
    createdAt: Date;
    primaryPatient?: any | null;
    dependents?: any[];
  };
  canEdit?: boolean;
  canUpdateDiscount?: boolean;
  canReadHistory?: boolean;
  opdRoom?: number | string | null;
  printButtonSlot?: React.ReactNode;
}

export function CompactPatientBanner({
  patient,
  canEdit = false,
  canUpdateDiscount = false,
  opdRoom,
  printButtonSlot,
}: CompactPatientBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isNanSince =
    patient.patientType === "Civilian Staff" &&
    (!patient.permanentSince || patient.permanentSince === "NaN");

  const identifier = patient.employeeId || patient.militaryId || "N/A";
  const fullName = `${patient.salutation ? `${patient.salutation}. ` : ""}${patient.firstName} ${patient.lastName}`;
  const dependentsCount = patient.dependents?.length || 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs transition-all overflow-hidden print:border-none print:shadow-none">
      {/* High-Density Header Bar (Visible on Page Load without Scrolling) */}
      <div className="p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        {/* Left: Patient Avatar & Key Identity Tokens */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
            {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 truncate tracking-tight">
                {fullName}
              </h1>

              {/* Patient Type & Rank Badges */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <Shield className="w-3 h-3 text-slate-500" />
                {patient.patientType}
              </span>

              {opdRoom && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 animate-pulse">
                  <Stethoscope className="w-3 h-3 text-blue-600" />
                  OPD Room {opdRoom}
                </span>
              )}

              {isNanSince && (
                <span className="inline-flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400 font-semibold border border-red-200 dark:border-red-800 px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/40">
                  <AlertCircle className="w-3 h-3" />
                  Missing &apos;Since&apos; Date
                </span>
              )}
            </div>

            {/* Horizontal Vital Metadata Chips */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400 mt-1">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {calculateAge(patient.yob)} yrs
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="capitalize">{patient.gender || "N/A"}</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded text-[11px]">
                ID: {identifier}
              </span>

              {patient.department && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="inline-flex items-center gap-1 truncate max-w-[180px]" title={patient.department}>
                    <Building2 className="w-3 h-3 text-slate-400" />
                    {patient.department}
                  </span>
                </>
              )}

              {patient.contactNumber && (
                <>
                  <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                  <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 hidden sm:inline">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {patient.contactNumber}
                  </span>
                </>
              )}

              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="inline-flex items-center gap-0.5 text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.2 rounded text-[11px]">
                <Percent className="w-3 h-3" />
                {patient.discountPercent}% Benefit
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0 print:hidden">
          <Link
            href="/patients"
            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Back to Patient Registry"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Patients</span>
          </Link>

          {printButtonSlot}

          {canEdit && (
            <Link
              href={`/patients/${patient.id}/edit`}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Edit Patient Details"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </Link>
          )}

          {/* Toggle Details & Family Drawer */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              isExpanded
                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60"
            }`}
            title="Toggle full demographics, family tree, and benefit details"
          >
            <Users className="w-3.5 h-3.5" />
            <span>{isExpanded ? "Hide Details" : "Details & Family"}</span>
            {dependentsCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                isExpanded ? "bg-white text-blue-600" : "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100"
              }`}>
                {dependentsCount}
              </span>
            )}
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Clinical & Demographic Details Panel */}
      {isExpanded && (
        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 p-4 sm:p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-slate-400 block font-medium">Full Legal Name</span>
              <span className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5 block">{fullName}</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-slate-400 block font-medium">Age & Gender</span>
              <span className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5 block">
                {calculateAge(patient.yob)} years ({patient.gender || "N/A"})
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-slate-400 block font-medium">Employee / Military ID</span>
              <span className="font-bold text-slate-800 dark:text-slate-100 text-sm font-mono mt-0.5 block">{identifier}</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-slate-400 block font-medium">Permanent Since (ቋሚ የሆነበት ቀን)</span>
              <span className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5 block">
                {patient.permanentSince ? formatToEthiopianDate(patient.permanentSince) : "N/A"}
              </span>
            </div>

            {patient.department && (
              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <span className="text-slate-400 block font-medium">Department / Division</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5 block">{patient.department}</span>
              </div>
            )}

            {patient.c_m && (
              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <span className="text-slate-400 block font-medium">C/M Reference</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm uppercase mt-0.5 block">{patient.c_m}</span>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-slate-400 block font-medium">Contact Phone</span>
              <span className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5 block">{patient.contactNumber || "N/A"}</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-slate-400 block font-medium">Benefit Tier & Discount</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm mt-0.5 block">{patient.discountPercent}% Subsidized</span>
            </div>
          </div>

          {/* Linked Primary Staff / Soldier Section (if dependent) */}
          {patient.primaryPatient && (
            <div className="border border-blue-200 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-950/30 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
                  Linked Primary Staff Member / Soldier
                </h3>
                <Link
                  href={`/patients/${patient.primaryPatient.id}`}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold underline"
                >
                  View Primary Profile &rarr;
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block font-medium">Name:</span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    {patient.primaryPatient.firstName} {patient.primaryPatient.lastName}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block font-medium">Card / Military / Employee ID:</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">
                    {patient.primaryPatient.militaryId || patient.primaryPatient.employeeId || "N/A"}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block font-medium">Relationship & Category:</span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    {patient.relationship || "Dependent"} • {patient.primaryPatient.patientType}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Family Tree / Dependents Section */}
          {dependentsCount > 0 && (
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Family Tree & Registered Dependents ({dependentsCount})
                  </h3>
                  <p className="text-xs text-slate-500">Family members covered under this staff medical benefit</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  {patient.patientType === "Soldier" ? "100% Family Benefit" : "95% Family Benefit"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {patient.dependents?.map((dep: any) => (
                  <div
                    key={dep.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex justify-between items-center hover:border-blue-400 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <Link href={`/patients/${dep.id}`} className="font-bold text-xs text-slate-800 dark:text-slate-200 hover:text-blue-600 block truncate">
                        {dep.firstName} {dep.lastName}
                      </Link>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        <span>{dep.relationship || "Dependent"}</span>
                        {dep.yob && <span> • {calculateAge(dep.yob)} yrs</span>}
                      </div>
                    </div>
                    <span className="text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 shrink-0">
                      {dep.discountPercent}% Off
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manager Discount Slider (If user has update permissions) */}
          {canUpdateDiscount && (
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Manager Control: Adjust Patient Benefit Discount
              </h3>
              <DiscountSlider patientId={patient.id} initialDiscount={patient.discountPercent} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
