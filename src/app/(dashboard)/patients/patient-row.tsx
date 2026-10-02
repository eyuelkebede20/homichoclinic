"use client";

import { useRouter } from "next/navigation";

export function PatientRow({ patient }: { patient: any }) {
  const router = useRouter();

  return (
    <tr 
      onClick={() => router.push(`/patients/${patient.id}`)}
      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
    >
      <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">{patient.employeeId || patient.militaryId || patient.id.slice(-6)}</td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">{patient.salutation || "-"}</td>
      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
        {patient.firstName} {patient.lastName}
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500 capitalize">{patient.gender || "-"}</td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">{patient.dob || "-"}</td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">{patient.permanentSince || "-"}</td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">{patient.c_m || "-"}</td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">{patient.department || "-"}</td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">{patient.contactNumber || "-"}</td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">{patient.emergencyContact || "-"}</td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">{patient.emergencyMobile || "-"}</td>
    </tr>
  );
}
