import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Search } from "lucide-react";
import { NotificationPing } from "@/components/notification-ping";
import { groupPendingLabRequests } from "@/features/clinical/types/lab-panels";
import { CompletedLabLogs } from "@/features/clinical/components/completed-lab-logs";
import { PendingLabWorklistCard } from "@/features/clinical/components/pending-lab-worklist-card";

export default async function LaboratoryDashboardPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q?.trim() || "";

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

  const statusFilter: import("@prisma/client").Prisma.LabRequestWhereInput = {
    OR: [{ status: "completed" }, { status: { in: ["requested", "urgent"] }, createdAt: { gte: oneWeekAgo } }],
  };

  const whereClause: import("@prisma/client").Prisma.LabRequestWhereInput = query
    ? {
        AND: [
          statusFilter,
          {
            OR: [
              {
                patient: {
                  OR: [
                    { firstName: { contains: query, mode: "insensitive" } },
                    { lastName: { contains: query, mode: "insensitive" } },
                    { militaryId: { contains: query, mode: "insensitive" } },
                    { employeeId: { contains: query, mode: "insensitive" } },
                  ],
                },
              },
              {
                test: {
                  name: { contains: query, mode: "insensitive" },
                },
              },
              {
                result: {
                  findings: { contains: query, mode: "insensitive" },
                },
              },
            ],
          },
        ],
      }
    : statusFilter;

  // Fetch requests (both pending and completed history logs)
  const requests = await prisma.labRequest.findMany({
    where: whereClause,
    include: { patient: true, test: true, result: true },
    orderBy: { createdAt: "desc" },
    take: 100, // Keep logs up to 100 recent
  });

  const pendingRequests = requests.filter((r) => r.status === "requested" || r.status === "urgent");
  const pendingGrouped = groupPendingLabRequests(pendingRequests);
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
            {pendingGrouped.length > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">{pendingGrouped.length} New</span>}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Manage pending lab requests, enter diagnostic findings, and search test history.</p>
        </div>

        <form className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            name="q"
            defaultValue={query}
            type="text"
            placeholder="Search patient, MRN, test, findings..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
          />
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Requests Column */}
        <PendingLabWorklistCard groupedRequests={pendingGrouped} canResult={canResult} />

        {/* Completed Logs Column */}
        <CompletedLabLogs requests={completedRequests} />
      </div>
    </div>
  );
}
