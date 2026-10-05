import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { LabResultForm } from "@/features/clinical/components/lab-result-form";
import { Search } from "lucide-react";
import { NotificationPing } from "@/components/notification-ping";

export default async function LaboratoryDashboardPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");

  const role = session.user.role || "User";
  const userPermissions = ROLE_PERMISSIONS[role] || [];

  if (!userPermissions.includes(PERMISSIONS.LAB_READ)) {
    return (
      <div className="p-8 text-center text-red-600">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p>You do not have permission to access the laboratory module.</p>
      </div>
    );
  }

  // Auto-remove pings after a week (7 days) for pending items
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const whereClause: import("@prisma/client").Prisma.LabRequestWhereInput = {
    OR: [{ status: "completed" }, { status: "requested", createdAt: { gte: oneWeekAgo } }],
  };

  if (query) {
    whereClause.patient = {
      OR: [{ firstName: { contains: query, mode: "insensitive" } }, { lastName: { contains: query, mode: "insensitive" } }],
    };
  }

  // Fetch requests (both pending and completed history logs)
  const requests = await prisma.labRequest.findMany({
    where: whereClause,
    include: { patient: true, test: true, result: true },
    orderBy: { createdAt: "desc" },
    take: 100, // Keep logs up to 100 recent
  });

  const pendingRequests = requests.filter((r) => r.status === "requested");
  const completedRequests = requests.filter((r) => r.status === "completed");

  const canResult = userPermissions.includes(PERMISSIONS.LAB_RESULT);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Polling notification component */}
      <NotificationPing endpoint="/api/polling/lab" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Laboratory Dashboard
            {pendingRequests.length > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">{pendingRequests.length} New</span>}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Manage pending lab requests and input results.</p>
        </div>

        <form className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            name="q"
            defaultValue={query}
            type="text"
            placeholder="Search patient logs..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-blue-500 focus:border-blue-500"
          />
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Requests Column */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Pending Tests</h2>
          <div className="bg-white dark:bg-slate-900/50 shadow-sm rounded-xl border border-slate-200 dark:border-slate-800/60 overflow-hidden min-h-[300px]">
            {pendingRequests.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No active lab requests.</div>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {pendingRequests.map((req) => (
                  <li key={req.id} className="p-4 bg-blue-50/30 dark:bg-blue-900/10">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">
                          {req.patient.firstName} {req.patient.lastName}
                        </span>
                        <span className="text-xs text-slate-500">{req.createdAt.toLocaleString()}</span>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:text-yellow-400">Pending</span>
                    </div>
                    <div className="text-sm text-slate-700 dark:text-slate-300 mb-4 font-medium">Test: {req.test.name}</div>
                    <div className="flex justify-end gap-2">{canResult ? <LabResultForm requestId={req.id} /> : <span className="text-slate-400 text-xs">View Only</span>}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Completed Logs Column */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Recent Completed Logs</h2>
          <div className="bg-white dark:bg-slate-900/50 shadow-sm rounded-xl border border-slate-200 dark:border-slate-800/60 overflow-hidden min-h-[300px]">
            {completedRequests.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No completed logs found.</div>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {completedRequests.map((req) => (
                  <li key={req.id} className="p-4 opacity-75 hover:opacity-100 transition-opacity">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {req.patient.firstName} {req.patient.lastName}
                      </span>
                      <span className="text-xs text-slate-500">{req.updatedAt.toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Test:</span> {req.test.name}
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded text-xs text-slate-600 dark:text-slate-400">
                      <span className="font-semibold block mb-1">Findings:</span>
                      {req.result?.findings || "No findings recorded."}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
