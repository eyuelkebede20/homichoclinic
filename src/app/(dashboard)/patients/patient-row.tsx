"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { calculateAge } from "@/lib/date-utils";
import { admitPatient } from "@/features/visits/actions";
import { toast } from "sonner";

export function PatientRow({ patient, totalOpdRooms = 5, canAdmit = true }: { patient: import('@prisma/client').Patient, totalOpdRooms?: number, canAdmit?: boolean }) {
  const router = useRouter();
  const [selectedOpd, setSelectedOpd] = useState<string>("1");
  const [isExecuting, setIsExecuting] = useState(false);

  const isNanSince = !patient.permanentSince || patient.permanentSince === "NaN";

  const handleAdmit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExecuting(true);
    const result = await admitPatient({ patientId: patient.id, opdRoom: parseInt(selectedOpd, 10) });
    setIsExecuting(false);
    
    if (result.success) {
      toast.success("Patient admitted to OPD successfully!");
    } else {
      toast.error(result.error || "Failed to admit patient.");
    }
  };

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <tr 
      onClick={() => router.push(`/patients/${patient.id}`)}
      className={`${isNanSince ? "bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"} cursor-pointer transition-colors`}
    >
      <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">{patient.employeeId || patient.militaryId || patient.id.slice(-6)}</td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">{patient.salutation || "-"}</td>
      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
        <span className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${isNanSince ? "bg-red-400" : "bg-emerald-400"}`} />
          {patient.firstName} {patient.lastName}
        </span>
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500 capitalize">{patient.gender || "-"}</td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">{calculateAge(patient.yob)}</td>
      <td className="px-3 py-4 whitespace-nowrap text-sm">
        {isNanSince
          ? <span className="text-red-500 text-xs font-semibold">Missing ⚠</span>
          : <span className="text-slate-500">{patient.permanentSince}</span>
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
          </div>
        </td>
      )}
    </tr>
  );
}
