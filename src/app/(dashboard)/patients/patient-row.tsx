"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { calculateAge, formatToEthiopianDate } from "@/lib/date-utils";
import { admitPatient } from "@/features/visits/actions";
import { approvePatient } from "@/features/patients/actions";
import { deactivatePatientOpd } from "@/features/clinical/actions";
import { toast } from "sonner";

export function PatientRow({ 
  patient, 
  totalOpdRooms = 5, 
  canAdmit = true, 
  canApprove = false,
  activeVisit = (patient as any).visits?.[0] || null
}: { 
  patient: import('@prisma/client').Patient; 
  totalOpdRooms?: number; 
  canAdmit?: boolean; 
  canApprove?: boolean;
  activeVisit?: { id: string; opdRoom: number | null; status: string } | null;
}) {
  const router = useRouter();
  const [selectedOpd, setSelectedOpd] = useState<string>("1");
  const [isExecuting, setIsExecuting] = useState(false);

  const isNanSince = patient.patientType === "Civilian Staff" && (!patient.permanentSince || patient.permanentSince === "NaN");
  const isPending = patient.status === "PENDING";

  const handleAdmit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExecuting(true);
    const result = await admitPatient({ patientId: patient.id, opdRoom: parseInt(selectedOpd, 10) });
    setIsExecuting(false);
    
    if (result.success) {
      toast.success("Patient admitted to OPD successfully!");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to admit patient.");
    }
  };

  const handleDeactivate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExecuting(true);
    const result = await deactivatePatientOpd({ patientId: patient.id, visitId: activeVisit?.id });
    setIsExecuting(false);

    if (result.success) {
      toast.success("Patient deactivated from OPD (reset to null)");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to deactivate patient.");
    }
  };

  const handleApprove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExecuting(true);
    const result = await approvePatient({ patientId: patient.id });
    setIsExecuting(false);
    
    if (result.success) {
      toast.success("Patient registration approved!");
    } else {
      toast.error(result.error || "Failed to approve patient.");
    }
  };

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <tr 
      onClick={() => router.push(`/patients/${patient.id}`)}
      className={`${isNanSince ? "bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20" : isPending ? "bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/10 dark:hover:bg-amber-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"} cursor-pointer transition-colors`}
    >
      <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">{patient.employeeId || patient.militaryId || patient.id.slice(-6)}</td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">{patient.salutation || "-"}</td>
      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
        <span className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${isNanSince ? "bg-red-400" : isPending ? "bg-amber-400" : "bg-emerald-400"}`} />
          {patient.firstName} {patient.lastName}
        </span>
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500 capitalize">{patient.gender || "-"}</td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">{calculateAge(patient.yob)}</td>
      <td className="px-3 py-4 whitespace-nowrap text-sm">
        {isNanSince
          ? <span className="text-red-500 text-xs font-semibold">Missing ⚠</span>
          : <span className="text-slate-500">{patient.permanentSince ? formatToEthiopianDate(patient.permanentSince, { format: "full" }) : "-"}</span>
        }
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">{patient.c_m || "-"}</td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">{patient.department || "-"}</td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">{patient.contactNumber || "-"}</td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">{patient.emergencyContact || "-"}</td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">{patient.emergencyMobile || "-"}</td>
      {canAdmit && (
        <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">
          <div className="flex items-center gap-2">
            {isPending ? (
              canApprove ? (
                <button 
                  onClick={handleApprove}
                  disabled={isExecuting}
                  className="px-3 py-1 bg-amber-600 text-white rounded text-sm hover:bg-amber-700 disabled:opacity-50"
                >
                  {isExecuting ? "..." : "Approve"}
                </button>
              ) : (
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium border border-amber-200 dark:border-amber-800 rounded px-2 py-1">Pending Approval</span>
              )
            ) : activeVisit?.opdRoom ? (
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  In OPD {activeVisit.opdRoom}
                </span>
                <button 
                  onClick={handleDeactivate}
                  disabled={isExecuting}
                  title="Deactivate / Release from OPD (reset to null)"
                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded text-xs font-semibold disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isExecuting ? "..." : "Deactivate"}
                </button>
              </div>
            ) : (
              <>
                <select 
                  value={selectedOpd}
                  onChange={(e) => setSelectedOpd(e.target.value)}
                  onClick={handleDropdownClick}
                  className="border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-sm bg-white dark:bg-slate-900"
                >
                  {Array.from({ length: totalOpdRooms }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>OPD {i + 1}</option>
                  ))}
                </select>
                <button 
                  onClick={handleAdmit}
                  disabled={isExecuting}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {isExecuting ? "..." : "Admit"}
                </button>
              </>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}
