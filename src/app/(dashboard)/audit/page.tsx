import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Search, Download } from "lucide-react";
import { Pagination } from "@/components/pagination";

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
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
  
  if (!userPermissions.includes(PERMISSIONS.AUDIT_READ)) {
    return (
      <div className="p-8 text-center text-red-600">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p>You do not have permission to view audit logs.</p>
      </div>
    );
  }

  const whereClause = query ? {
    OR: [
      { action: { contains: query, mode: "insensitive" } as const },
      { resourceId: { contains: query, mode: "insensitive" } as const },
      { reason: { contains: query, mode: "insensitive" } as const },
    ]
  } : undefined;

  const [logs, totalItems] = await Promise.all([
    prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where: whereClause })
  ]);

  // Fetch actor details for human readability
  const actorIds = [...new Set(logs.map(l => l.actorId))];
  const actors = await prisma.user.findMany({
    where: { id: { in: actorIds } },
    select: { id: true, name: true, role: true }
  });
  const actorMap = Object.fromEntries(actors.map(a => [a.id, a]));

  function getHumanReadableDetail(log: typeof logs[0], actorName: string) {
    try {
      const newVal = log.newValue ? JSON.parse(log.newValue) : null;
      const actionParts = log.action.split(':');
      const domain = actionParts[0]; // e.g. patient, discount, visit
      const action = actionParts[1]; // e.g. update, create

      if (log.action === "discount:update" && newVal) {
        return `Updated patient discount to ${newVal.discountPercent}%`;
      }
      if (log.action === "patient:create") {
        return `Registered a new patient`;
      }
      if (log.action === "visit:create") {
        return `Scheduled a visit (Status: ${newVal?.status})`;
      }
      if (log.action === "lab:request" && newVal) {
        return `Requested ${newVal.testCount} lab test(s)`;
      }
      if (log.action === "lab:result") {
        return `Submitted lab test results`;
      }
      
      // Fallback
      if (newVal) {
        const keys = Object.keys(newVal);
        if (keys.length > 0) return `Updated fields: ${keys.join(", ")}`;
      }
      return log.reason || "Performed system action";
    } catch (e) {
      return log.reason || "Performed system action";
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Audit Logs</h1>
          <p className="text-slate-500 dark:text-slate-400">Review system activity and security events.</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-4">
          <form className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <input 
              name="q"
              defaultValue={query}
              type="text" 
              placeholder="Search logs..." 
              className="pl-9 pr-4 py-2 w-full border border-slate-300 dark:border-slate-700 rounded-md text-sm bg-white dark:bg-slate-900"
            />
          </form>
          <a href={`/api/export/audit?q=${encodeURIComponent(query)}`} className="whitespace-nowrap px-4 py-2 bg-slate-800 text-white font-medium rounded hover:bg-slate-700 text-sm flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </a>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 shadow rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User (Role)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Event Details</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
              {logs.map(log => {
                const actor = actorMap[log.actorId];
                const actorDisplay = actor ? `${actor.name} (${actor.role})` : `Unknown User (${log.actorId.slice(0, 8)})`;
                
                return (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                      {log.createdAt.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                      {actorDisplay}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/10 rounded-full px-2">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      <span className="block text-slate-900 dark:text-slate-100">{getHumanReadableDetail(log, actorDisplay)}</span>
                      {log.resourceId && <span className="text-[10px] text-slate-400 font-mono mt-1 block">Ref ID: {log.resourceId}</span>}
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                    {query ? "No audit logs match your search." : "No audit logs found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalItems > 0 && (
          <Pagination 
            currentPage={page} 
            totalItems={totalItems} 
            pageSize={PAGE_SIZE} 
            baseUrl="/audit" 
            searchQuery={query} 
          />
        )}
      </div>
    </div>
  );
}
