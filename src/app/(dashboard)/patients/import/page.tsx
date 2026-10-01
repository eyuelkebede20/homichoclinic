import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import Link from "next/link";
import { PatientImporter } from "@/features/admin/components/patient-importer";

export default async function PatientImportPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) redirect("/login");

  const role = session.user.role || "User";
  const userPermissions = ROLE_PERMISSIONS[role] || [];
  
  // Only Managers and Admins
  if (!userPermissions.includes(PERMISSIONS.USER_MANAGE) && role !== "Admin" && role !== "Manager") {
    return (
      <div className="p-8 text-center text-red-600 dark:text-red-400">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p>You do not have permission to import patient lists.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/patients" className="text-blue-600 hover:underline">&larr; Back to Patients</Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Staff Demographics Import</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Bulk import staff members and their families into the clinic registry using an Excel or CSV file.
        </p>
      </div>

      <PatientImporter />
    </div>
  );
}
