"use client";

import { useRouter } from "next/navigation";
import { calculateECAge } from "@/lib/ethiopian-calendar";

export function PatientRow({ patient }: { patient: import('@prisma/client').Patient }) {
  const router = useRouter();

  const isNanSince = !patient.permanentSince || patient.permanentSince === "NaN";

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
      <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">{calculateECAge(patient.yob)}</td>
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
    </tr>
  );
}
