"use client";

import { useState } from "react";
import { createPatient } from "../actions";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { FamilyLinkSelector } from "./family-link-selector";
import { EthiopianDatePicker } from "@/components/ethiopian-date-picker";
import { getCurrentEthiopianYear } from "@/lib/date-utils";
import { MilitaryRankSelect } from "./military-rank-select";

export function PatientForm({ userRole = "User" }: { userRole?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patientType, setPatientType] = useState("Soldier");
  const router = useRouter();
  const currentEthYear = getCurrentEthiopianYear();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    let yobStr = formData.get("age") as string;
    let yob = "";
    if (yobStr) {
      const num = parseInt(yobStr, 10);
      if (!isNaN(num)) {
        if (num < 130) {
          yob = (currentEthYear - num).toString();
        } else {
          yob = num.toString();
        }
      }
    }

    const result = await createPatient({
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      yob: yob,
      gender: formData.get("sex") as string,
      contactNumber: formData.get("contactNumber") as string,
      patientType: patientType,
      militaryId: formData.get("militaryId") as string || undefined,
      rank: formData.get("rank") as string || undefined,
      division: formData.get("division") as string || undefined,
      permanentSince: formData.get("permanentSince") as string || undefined,
      primaryPatientId: formData.get("primaryPatientId") as string || undefined,
      staffSearchStr: formData.get("staffSearchStr") as string || undefined,
      relationship: formData.get("relationship") as string || undefined,
      hasPaperwork: formData.get("hasPaperwork") === "on",
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.success && result.data) {
      router.push(`/patients/${result.data.id}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
      <h2 className="text-xl font-semibold mb-4">Register New Patient</h2>
      
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">First Name</label>
          <input required name="firstName" type="text" className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Last Name</label>
          <input required name="lastName" type="text" className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Age (or Ethiopian YOB / ዕድሜ ወይም የልደት ዓ.ም.)
          </label>
          <input 
            name="age" 
            type="number" 
            min="0"
            placeholder={`e.g. 30 (ወይም ${currentEthYear - 30} ዓ.ም.)`}
            className="block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
          />
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            የአሁኑ ዓመት: {currentEthYear} ዓ.ም. (Current Year: {currentEthYear} E.C.)
          </span>
        </div>
        <div className="flex flex-col justify-end">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sex</label>
          <select name="sex" className="block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option value="">Select...</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Contact Number</label>
          <input name="contactNumber" type="tel" className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div className="flex flex-col justify-end">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Patient Type</label>
          <select value={patientType} onChange={(e) => setPatientType(e.target.value)} name="patientType" className="block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option value="Soldier">Soldier</option>
            <option value="Soldier Family">Soldier Family</option>
            <option value="Civilian Staff">Civilian Staff</option>
            <option value="Civilian Family">Civilian Family</option>
            <option value="Guest">Guest Attendee</option>
          </select>
        </div>
      </div>

      {patientType === "Soldier" && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Military ID / የወታደራዊ መታወቂያ ቁጥር
              </label>
              <input 
                required 
                name="militaryId" 
                type="text" 
                placeholder="e.g. MIL-10293" 
                className="mt-1 block w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Division / ክፍለ ጦር
              </label>
              <input 
                required 
                name="division" 
                type="text" 
                placeholder="e.g. 24ኛ ክፍለ ጦር" 
                className="mt-1 block w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100" 
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Military Rank / ወታደራዊ ማዕረግ
            </label>
            <MilitaryRankSelect name="rank" required />
          </div>
        </div>
      )}

      {(patientType === "Civilian Family" || patientType === "Soldier Family") && (
        <FamilyLinkSelector patientType={patientType} />
      )}

      {patientType === "Civilian Staff" && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Permanent Since (የቅጥር/የቋሚነት ቀን - በኢትዮጵያ የቀን አቆጣጠር)
          </label>
          <EthiopianDatePicker
            name="permanentSince"
            placeholder="ቀን ይምረጡ (e.g. 2012-05-10 ዓ.ም.)"
            minYear={1950}
            maxYear={currentEthYear}
            mode="ethiopian-date"
          />
          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
            ⚠ If left empty, the patient will be flagged for a receptionist to provide this date later. It determines the discount tier.
          </p>
        </div>
      )}

      {userRole === "Reception" && ["Soldier", "Soldier Family", "Civilian Staff", "Civilian Family"].includes(patientType) && (
        <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <input type="checkbox" id="hasPaperwork" name="hasPaperwork" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <label htmlFor="hasPaperwork" className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
            I have received physical paperwork verifying this staff/family member.
            <span className="block text-xs font-normal opacity-80">This will mark the registration as PENDING until approved by a Manager/Admin.</span>
          </label>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Register Patient
      </button>
    </form>
  );
}
