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
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actor ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Resource ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                    {log.createdAt.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-900 dark:text-slate-300">
                    {log.actorId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-blue-600 dark:text-blue-400">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-500 dark:text-slate-400">
                    {log.resourceId}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400 max-w-md truncate">
                    {log.reason && <span className="font-semibold block">{log.reason}</span>}
                    <span className="font-mono text-[10px]">{JSON.stringify(log.newValue)}</span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
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
