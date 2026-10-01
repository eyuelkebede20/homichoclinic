import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { VisitForm } from "@/features/clinical/components/visit-form";
import { VisitStatusActions } from "@/features/clinical/components/visit-status-actions";
import { OpdSetupModal } from "@/features/clinical/components/opd-setup-modal";

export default async function VisitsQueuePage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) redirect("/login");

  const role = session.user.role || "User";
  const userPermissions = ROLE_PERMISSIONS[role] || [];
  
  if (!userPermissions.includes(PERMISSIONS.VISIT_READ)) {
    return (
      <div className="p-8 text-center text-red-600 dark:text-red-400">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p>You do not have permission to view the visit queue.</p>
      </div>
    );
  }

  const canCreateVisit = userPermissions.includes(PERMISSIONS.VISIT_CREATE);

  // Get today's visits
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [visits, doctors, opdSetting] = await Promise.all([
    prisma.visit.findMany({
      where: { visitDate: { gte: today } },
      include: { patient: true },
      orderBy: { visitDate: "asc" }
    }),
    canCreateVisit ? prisma.user.findMany({ where: { role: "Doctor" }, select: { id: true, name: true } }) : [],
    prisma.systemSetting.findUnique({ where: { key: "activeOpdRooms" } })
  ]);

  const patientList: any[] = []; // Replaced by async search

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Daily Queue & Scheduling</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage patient check-ins and active appointments.</p>
      </div>

      {canCreateVisit && (
        <>
          <OpdSetupModal initialValue={opdSetting?.value} />
          <VisitForm patients={patientList} doctors={doctors} />
        </>
      )}

      <div className="bg-white dark:bg-slate-900 shadow rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-950">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Room</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Notes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
            {visits.map(v => (
              <tr key={v.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                  {v.visitDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                  {v.patient.firstName} {v.patient.lastName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600 dark:text-blue-400">
                  {v.opdRoom ? `OPD ${v.opdRoom}` : "-"}
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">
                  {v.notes || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                    v.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                    v.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  }`}>
                    {v.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <VisitStatusActions visitId={v.id} currentStatus={v.status} />
                </td>
              </tr>
            ))}
            {visits.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">No visits scheduled for today.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
