"use client";

import { useState } from "react";
import { updatePatient } from "../actions";
import { useRouter } from "next/navigation";
import { Loader2, Link2, Unlink } from "lucide-react";

export function PatientEditForm({ patient }: { 
  patient: { 
    id: string; firstName: string; lastName: string; yob: string | null; gender: string | null; contactNumber: string | null; permanentSince?: string | null; 
    patientType: string;
    primaryPatient?: { id: string; firstName: string; lastName: string; contactNumber: string | null; employeeId: string | null; militaryId: string | null; } | null;
    relationship?: string | null;
  } 
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChangingLink, setIsChangingLink] = useState(!patient.primaryPatient && patient.patientType === "Civilian Family");
  const router = useRouter();

  let initialAge = "";
  if (patient.yob) {
    const y = parseInt(patient.yob, 10);
    if (!isNaN(y)) {
      initialAge = (2019 - y).toString();
    }
  }

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
        if (num < 200) {
          yob = (2019 - num).toString();
        } else {
          yob = num.toString();
        }
      }
    }

    let staffSearchStr: string | undefined = undefined;
    let relationship: string | undefined = undefined;

    if (patient.patientType === "Civilian Family") {
      if (isChangingLink) {
        staffSearchStr = (formData.get("staffSearchStr") as string) || "UNLINK";
        relationship = (formData.get("relationship") as string) || undefined;
      }
    }

    const result = await updatePatient({
      patientId: patient.id,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      yob: yob || undefined,
      gender: formData.get("gender") as string,
      contactNumber: formData.get("contactNumber") as string,
      permanentSince: formData.get("permanentSince") as string || undefined,
      staffSearchStr,
      relationship,
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
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Age (or Year of Birth)</label>
          <input 
            name="age" 
            type="number" 
            min="0"
            defaultValue={initialAge}
            placeholder="e.g. 30 (or 1989)"
            className="block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
          />
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
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Permanent Since (Date)</label>
          <input defaultValue={patient.permanentSince || ""} name="permanentSince" type="date" className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
      </div>

      {patient.patientType === "Civilian Family" && (
        <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-6">
          <h3 className="text-lg font-medium mb-4 flex items-center text-slate-800 dark:text-slate-200">
            <Link2 className="w-5 h-5 mr-2 text-blue-500" />
            Family Linking
          </h3>
          
          {!isChangingLink && patient.primaryPatient ? (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-md border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Currently linked to:</p>
                  <p className="font-medium">{patient.primaryPatient.firstName} {patient.primaryPatient.lastName}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {patient.primaryPatient.contactNumber || patient.primaryPatient.militaryId || patient.primaryPatient.employeeId}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Relationship: {patient.relationship || "Not specified"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChangingLink(true)}
                  className="text-sm flex items-center text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 px-3 py-1.5 rounded transition-colors"
                >
                  <Unlink className="w-4 h-4 mr-1.5" />
                  Unlink / Change
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-md border border-slate-200 dark:border-slate-700">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Link to Staff Member
                </label>
                <input 
                  name="staffSearchStr" 
                  type="text" 
                  placeholder="Enter Phone Number, Military ID, or Employee ID"
                  className="block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                />
                <p className="text-xs text-slate-500 mt-1.5">Leave blank to keep unlinked.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Relationship to Staff
                </label>
                <select 
                  name="relationship" 
                  defaultValue={patient.relationship || ""}
                  className="block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="Wife">Wife</option>
                  <option value="Husband">Husband</option>
                  <option value="Son">Son</option>
                  <option value="Daughter">Daughter</option>
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Brother">Brother</option>
                  <option value="Sister">Sister</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {patient.primaryPatient && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsChangingLink(false)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Cancel Change
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
