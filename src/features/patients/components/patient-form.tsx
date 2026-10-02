"use client";

import { useState } from "react";
import { createPatient } from "../actions";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function PatientForm({ userRole = "User" }: { userRole?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ageMode, setAgeMode] = useState(false);
  const [patientType, setPatientType] = useState("Soldier");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    let dob = formData.get("dob") as string;
    
    if (ageMode) {
      const ageStr = formData.get("age") as string;
      if (ageStr) {
        const age = parseInt(ageStr, 10);
        if (!isNaN(age)) {
          const currentYear = new Date().getFullYear();
          dob = `${currentYear - age}-01-01`;
        }
      }
    }

    const result = await createPatient({
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      dob: dob,
      gender: formData.get("gender") as string,
      contactNumber: formData.get("contactNumber") as string,
      patientType: patientType,
      militaryId: formData.get("militaryId") as string || undefined,
      rank: formData.get("rank") as string || undefined,
      division: formData.get("division") as string || undefined,
      permanentSince: formData.get("permanentSince") as string || undefined,
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
        <div className="flex flex-col">
          <div className="flex justify-between items-end mb-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {ageMode ? "Age (Years)" : "Date of Birth (DOB)"}
            </label>
            <button 
              type="button" 
              onClick={() => setAgeMode(!ageMode)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Use {ageMode ? "Date" : "Age"} instead
            </button>
          </div>
          {ageMode ? (
            <input 
              name="age" 
              type="number" 
              min="0"
              max="150"
              placeholder="e.g. 45"
              className="block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
            />
          ) : (
            <input 
              name="dob" 
              type="date"
              className="block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
            />
          )}
        </div>
        <div className="flex flex-col justify-end">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gender</label>
          <select name="gender" className="block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
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
            <option value="Civilian Staff">Civilian Staff</option>
            <option value="Civilian Family">Civilian Family</option>
            <option value="Guest">Guest Attendee</option>
          </select>
        </div>
      </div>

      {patientType === "Soldier" && (
        <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Military ID</label>
            <input required name="militaryId" type="text" className="mt-1 block w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Rank</label>
            <input required name="rank" type="text" className="mt-1 block w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Division</label>
            <input required name="division" type="text" className="mt-1 block w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-2 py-1 text-sm" />
          </div>
        </div>
      )}

      {patientType === "Civilian Family" && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div>
            <label className="block text-xs font-medium text-blue-800 dark:text-blue-300">Staff Member Search (Phone or ID)</label>
            <input required name="staffSearchStr" type="text" placeholder="Enter staff phone or ID" className="mt-1 block w-full rounded border border-blue-300 dark:border-blue-700 dark:bg-slate-950 px-2 py-1 text-sm" />
            <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">Look up primary staff member to inherit benefits.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-blue-800 dark:text-blue-300">Relationship to Staff</label>
            <select required name="relationship" className="mt-1 block w-full rounded border border-blue-300 dark:border-blue-700 dark:bg-slate-950 px-2 py-1 text-sm">
              <option value="">Select...</option>
              <option value="Spouse">Spouse</option>
              <option value="Child">Child</option>
              <option value="Parent">Parent</option>
              <option value="Sibling">Sibling</option>
              <option value="Other">Other Dependent</option>
            </select>
          </div>
        </div>
      )}

      {patientType === "Civilian Staff" && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Permanent Since (Date)</label>
          <input name="permanentSince" type="date" className="mt-1 block w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-2 py-1 text-sm" />
          <p className="text-[10px] text-slate-500 mt-1">Leave empty to flag as missing (NaN) for Receptionists to fix.</p>
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
