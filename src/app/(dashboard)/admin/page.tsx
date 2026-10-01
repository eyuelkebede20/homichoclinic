import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { UserActionsRow } from "@/features/admin/components/user-actions";
import { LowPowerToggle } from "@/features/admin/components/low-power-toggle";

export default async function AdminDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) redirect("/login");

  const role = session.user.role || "User";
  const userPermissions = ROLE_PERMISSIONS[role] || [];
  
  if (!userPermissions.includes(PERMISSIONS.USER_MANAGE)) {
    return (
      <div className="p-8 text-center text-red-600">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p>You do not have permission to manage users.</p>
      </div>
    );
  }

  const [users, lowPowerSetting] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.systemSetting.findUnique({ where: { key: "lowPowerMode" } })
  ]);

  const isLowPower = lowPowerSetting?.value !== "false";

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">User Management</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage clinic staff, assign roles, and configure global settings.</p>
      </div>

      <LowPowerToggle initial={isLowPower} />

      <div className="bg-white dark:bg-slate-900 shadow rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Management Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                  {user.name}
                  {session.user.id === user.id && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">You</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 flex justify-end">
                  {session.user.id !== user.id ? (
                    <UserActionsRow user={user} />
                  ) : (
                    <span className="text-slate-400 text-xs italic">Cannot manage own account</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
