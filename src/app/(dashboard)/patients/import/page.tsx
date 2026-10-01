import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import Link from "next/link";
import { CsvUploader } from "@/features/patients/components/csv-uploader";

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
          Bulk import staff members and their families into the clinic registry using a CSV file.
          The hired year in Ethiopian Calendar (EC) is used to calculate the staff discount rate automatically.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 shadow rounded-lg border border-slate-200 dark:border-slate-800 p-8">
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Instructions</h2>
          <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-400 space-y-2">
            <li>Ensure your file is a valid <strong>.csv</strong> (Comma Separated Values).</li>
            <li>The CSV must contain 4 columns in the following order:</li>
            <li>To link a Dependent to a Staff member, leave the EmployeeID empty but ensure the <strong>PrimaryPhone</strong> matches the Staff member&apos;s phone.</li>
          </ul>
          
          <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 font-mono text-sm overflow-x-auto text-slate-800 dark:text-slate-200">
            FullName, EmployeeID, HiredYearEC, PrimaryPhone<br/>
            John Doe, STF-1029, 2012, 0911223344<br/>
            Jane Smith, STF-1030, 2005, 0922334455<br/>
            Baby Doe, , , 0911223344
          </div>

          <div className="mt-4">
            <a 
              href="data:text/csv;charset=utf-8,FullName,EmployeeID,HiredYearEC,PrimaryPhone%0AJohn%20Doe,STF-1001,2010,0911223344%0ABaby%20Doe,,,0911223344" 
              download="sample_patients.csv"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              &darr; Download Sample CSV
            </a>
          </div>
        </div>

        <CsvUploader userId={session.user.id} role={role} />
      </div>
    </div>
  );
}
