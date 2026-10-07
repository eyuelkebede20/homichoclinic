import { PatientForm } from "@/features/patients/components/patient-form";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PERMISSIONS, getUserPermissions } from "@/lib/permissions";

export default async function NewPatientPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role as string;
  const userPermissions = getUserPermissions(role);
  
  if (!userPermissions.includes(PERMISSIONS.PATIENT_CREATE)) {
    return (
      <div className="p-8 text-center text-red-600">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p>You do not have permission to register new patients.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
        <p className="text-slate-500">Register a new patient into the clinic system.</p>
      </div>
      <PatientForm userRole={role} />
    </div>
  );
}
