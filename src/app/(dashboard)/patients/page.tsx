import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Search } from "lucide-react";
import { Pagination } from "@/components/pagination";
import { PrintButton } from "@/components/print-button";
import { PrintHeader } from "@/components/print-header";

export default async function PatientsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";
  const page = parseInt(resolvedParams.page || "1", 10);
  const PAGE_SIZE = 20;

  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) redirect("/login");

  const role = session.user.role || "User";
  const userPermissions = ROLE_PERMISSIONS[role] || [];
  
  if (!userPermissions.includes(PERMISSIONS.PATIENT_READ)) {
    return (
      <div className="p-8 text-center text-red-600">
        <h2 className="text-2xl font-bold">Access Denied</h2>
      </div>
    );
  }

  const whereClause = query ? {
    OR: [
      { firstName: { contains: query, mode: "insensitive" } as const },
      { lastName: { contains: query, mode: "insensitive" } as const },
      { contactNumber: { contains: query, mode: "insensitive" } as const }
    ]
  } : undefined;

  const [patients, totalItems] = await Promise.all([
    prisma.patient.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.patient.count({ where: whereClause })
  ]);

  const canCreate = userPermissions.includes(PERMISSIONS.PATIENT_CREATE);
  const canManageUsers = userPermissions.includes(PERMISSIONS.USER_MANAGE) || role === "Admin" || role === "Manager";

  return (
    <div className="p-8 print:p-0 print:max-w-none">
      <PrintHeader title="Patient Directory Report" subtitle="Complete registry of registered patients" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Patients</h1>
        
        <div className="flex w-full md:w-auto gap-4">
          <PrintButton label="Print Directory" />
          <form className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <input 
              name="q"
              defaultValue={query}
              type="text" 
              placeholder="Search by name or phone..." 
              className="pl-9 pr-4 py-2 w-full border border-slate-300 dark:border-slate-700 rounded-md text-sm bg-white dark:bg-slate-900"
            />
          </form>
          {canManageUsers && (
            <Link href="/patients/import" className="whitespace-nowrap px-4 py-2 bg-slate-800 text-white font-medium rounded hover:bg-slate-900 text-sm flex items-center">
              Import CSV
            </Link>
          )}
          {canCreate && (
            <Link href="/patients/new" className="whitespace-nowrap px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 text-sm flex items-center">
              + New Patient
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 shadow rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Salutation</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Full Name</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Gender</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">DOB</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Permanent</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">C/M</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Department</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Primary Mobile</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Emergency Contact</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Emergency Mobile</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
              {patients.map(patient => (
                <tr key={patient.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">{patient.id.slice(-6)}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">{patient.salutation || "-"}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                    {patient.firstName} {patient.lastName}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500 capitalize">{patient.gender || "-"}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">
                    {patient.dateOfBirth ? patient.dateOfBirth.toLocaleDateString() : "-"}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">{patient.permanent || "-"}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">{patient.c_m || "-"}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">{patient.department || "-"}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">{patient.contactNumber || "-"}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">{patient.emergencyContact || "-"}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">{patient.emergencyMobile || "-"}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/patients/${patient.id}`} className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-6 py-8 text-center text-sm text-slate-500">
                    {query ? "No patients match your search." : "No patients found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="print:hidden">
          {totalItems > 0 && (
            <Pagination 
              currentPage={page} 
              totalItems={totalItems} 
              pageSize={PAGE_SIZE} 
              baseUrl="/patients" 
              searchQuery={query} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
