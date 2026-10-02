import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { UserActionsRow } from "@/features/admin/components/user-actions";
import { LowPowerToggle } from "@/features/admin/components/low-power-toggle";

import { PatientImporter } from "@/features/admin/components/patient-importer";
import { DevWipePatients } from "@/features/admin/components/dev-wipe-patients";
import { DatabaseBackupButton } from "@/features/admin/components/database-backup-button";
import { ClinicProfileSettings } from "@/features/admin/components/clinic-profile-settings";
import Link from "next/link";

export default async function AdminDashboardPage(props: { searchParams: Promise<{ tab?: string }> }) {
  const searchParams = await props.searchParams;
  const tab = searchParams.tab || "users";

  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) redirect("/login");

  const role = session.user.role || "User";
  const userPermissions = ROLE_PERMISSIONS[role] || [];
  
  if (!userPermissions.includes(PERMISSIONS.USER_MANAGE)) {
    return (
      <div className="p-8 text-center text-red-600 dark:text-red-400">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2">You do not have permission to manage users.</p>
      </div>
    );
  }

  const [users, lowPowerSetting, clinicNameSetting, clinicLogoSetting] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.systemSetting.findUnique({ where: { key: "lowPowerMode" } }),
    prisma.systemSetting.findUnique({ where: { key: "clinicName" } }),
    prisma.systemSetting.findUnique({ where: { key: "clinicLogo" } })
  ]);

  const isLowPower = lowPowerSetting?.value !== "false";
  const clinicName = clinicNameSetting?.value || "Clinic System";
  const clinicLogo = clinicLogoSetting?.value || "";

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Administration</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage clinic staff and global configurations.</p>
      </div>

      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="-mb-px flex space-x-8">
          <Link 
            href="?tab=users" 
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${tab === 'users' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-300'}`}
          >
            Users & System
          </Link>
          <Link 
            href="?tab=clinic" 
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${tab === 'clinic' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-300'}`}
          >
            Clinic Profile
          </Link>
        </nav>
      </div>

      {tab === "users" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <LowPowerToggle initial={isLowPower} />
            <PatientImporter />
            <DatabaseBackupButton />
            <DevWipePatients />
          </div>

          <div className="bg-white dark:bg-slate-900 shadow rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Email</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Management Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                  {user.name}
                  {session.user.id === user.id && (
                    <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full">You</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 flex justify-end">
                  {session.user.id !== user.id ? (
                    <UserActionsRow user={user} />
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 text-xs italic">Cannot manage own account</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>
      )}

      {tab === "clinic" && (
        <ClinicProfileSettings initialName={clinicName} initialLogo={clinicLogo} />
      )}
    </div>
  );
}
