"use client";

import { useState } from "react";
import { updatePatient } from "../actions";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function PatientEditForm({ patient }: { 
  patient: { id: string; firstName: string; lastName: string; dateOfBirth: Date | null; gender: string | null; contactNumber: string | null; } 
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ageMode, setAgeMode] = useState(false);
  const router = useRouter();

  // Parse initial DOB
  const initialDobStr = patient.dateOfBirth ? new Date(patient.dateOfBirth.getTime() - (patient.dateOfBirth.getTimezoneOffset() * 60000)).toISOString().split("T")[0] : "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    let dateOfBirth = formData.get("dateOfBirth") as string;
    
    if (ageMode) {
      const ageStr = formData.get("age") as string;
      if (ageStr) {
        const age = parseInt(ageStr, 10);
        if (!isNaN(age)) {
          const currentYear = new Date().getFullYear();
          dateOfBirth = `${currentYear - age}-01-01`;
        }
      }
    }

    const result = await updatePatient({
      patientId: patient.id,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      dateOfBirth: dateOfBirth || undefined,
      gender: formData.get("gender") as string,
      contactNumber: formData.get("contactNumber") as string,
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
      <h2 className="text-xl font-semibold mb-4">Edit Patient Profile</h2>
      
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">First Name</label>
          <input required defaultValue={patient.firstName} name="firstName" type="text" className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Last Name</label>
          <input required defaultValue={patient.lastName} name="lastName" type="text" className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <div className="flex justify-between items-end mb-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {ageMode ? "Age (Years)" : "Date of Birth"}
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
              name="dateOfBirth" 
              type="date" 
              defaultValue={initialDobStr}
              className="block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
            />
          )}
        </div>
        <div className="flex flex-col justify-end">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gender</label>
          <select defaultValue={patient.gender || ""} name="gender" className="block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
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
          <input defaultValue={patient.contactNumber || ""} name="contactNumber" type="tel" className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Role - Work Branch</label>
          <input disabled type="text" value="" placeholder="HR Integration Pending..." className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-400 cursor-not-allowed" />
        </div>
      </div>

      <div className="flex justify-between items-center mt-6">
        <button
          type="button"
          onClick={() => router.push(`/patients/${patient.id}`)}
          className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Update Profile
        </button>
      </div>
    </form>
  );
}
