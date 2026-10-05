import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { UserActionsRow } from "@/features/admin/components/user-actions";
import { LowPowerToggle } from "@/features/admin/components/low-power-toggle";
import { HeavyDutyToggle } from "@/features/admin/components/heavy-duty-toggle";

import { PatientImporter } from "@/features/admin/components/patient-importer";
import { DevWipePatients } from "@/features/admin/components/dev-wipe-patients";
import { DevWipeCatalogs } from "@/features/admin/components/dev-wipe-catalogs";
import { DatabaseBackupButton } from "@/features/admin/components/database-backup-button";
import { SystemUpdater } from "@/features/admin/components/system-updater";
import { ClinicProfileSettings } from "@/features/admin/components/clinic-profile-settings";
import { CreateUserModal } from "@/features/admin/components/create-user-modal";
import Link from "next/link";

export default async function AdminDashboardPage(props: { searchParams: Promise<{ tab?: string; q?: string }> }) {
  const searchParams = await props.searchParams;
  const tab = searchParams.tab || "users";
  const query = searchParams.q || "";

  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) redirect("/login");

  const role = session.user.role || "User";
  const userPermissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
  
  if (!userPermissions.includes(PERMISSIONS.USER_MANAGE)) {
    return (
      <div className="p-8 text-center text-red-600 dark:text-red-400">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2">You do not have permission to manage users.</p>
      </div>
    );
  }

  const [users, lowPowerSetting, heavyDutySetting, clinicNameSetting, clinicLogoSetting] = await Promise.all([
    prisma.user.findMany({ where: query ? { OR: [{ name: { contains: query, mode: "insensitive" } }, { email: { contains: query, mode: "insensitive" } }] } : {}, orderBy: { createdAt: "desc" } }),
    prisma.systemSetting.findUnique({ where: { key: "lowPowerMode" } }),
    prisma.systemSetting.findUnique({ where: { key: "heavyDutyMode" } }),
    prisma.systemSetting.findUnique({ where: { key: "clinicName" } }),
    prisma.systemSetting.findUnique({ where: { key: "clinicLogo" } })
  ]);

  const isLowPower = lowPowerSetting?.value !== "false";
  const isHeavyDuty = heavyDutySetting?.value === "true";
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
            Users & Toggles
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 md:row-span-2 flex flex-col">
              <PatientImporter />
            </div>
            <HeavyDutyToggle initial={isHeavyDuty} />
            <LowPowerToggle initial={isLowPower} />
            <DatabaseBackupButton />
            <SystemUpdater />
            <DevWipePatients />
            <DevWipeCatalogs />
          </div>

          <div className="bg-white dark:bg-slate-900 shadow rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden mt-8">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center gap-4 bg-slate-50 dark:bg-slate-800/20">
  <form className="relative max-w-sm w-full">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
      </svg>
    </div>
    <input name="q" defaultValue={query} type="text" placeholder="Search users by name or email..." className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
  </form>
  <CreateUserModal />
</div>
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
                  <div className="text-xs text-slate-500 mt-1">Role: {user.role || "User"}</div>
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