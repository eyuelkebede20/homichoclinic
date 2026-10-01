import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ApprovalsList } from "@/features/catalogs/components/approvals-list";

export default async function CatalogApprovalsPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) redirect("/login");

  const role = session.user.role || "User";
  const userPermissions = ROLE_PERMISSIONS[role] || [];
  
  if (!userPermissions.includes(PERMISSIONS.CATALOG_APPROVE)) {
    return (
      <div className="p-8 text-center text-red-600 dark:text-red-400">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p>You do not have permission to approve catalog changes.</p>
      </div>
    );
  }

  const pendingRequests = await prisma.catalogChangeRequest.findMany({
    where: { status: "PENDING" },
    include: { requestedBy: true },
    orderBy: { createdAt: "desc" }
  });

  const historyRequests = await prisma.catalogChangeRequest.findMany({
    where: { status: { not: "PENDING" } },
    include: { requestedBy: true, evaluatedBy: true },
    orderBy: { updatedAt: "desc" },
    take: 20
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/catalogs" className="text-blue-600 hover:underline">&larr; Back to Catalogs</Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Catalog Change Approvals</h1>
        <p className="text-slate-500 dark:text-slate-400">Review requested additions, updates, and removals of Drugs and Lab Tests.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white dark:bg-slate-900 shadow rounded-lg border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Pending Requests</h2>
          <ApprovalsList requests={pendingRequests} isPending={true} />
        </div>

        <div className="bg-white dark:bg-slate-900 shadow rounded-lg border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Recent History</h2>
          <ApprovalsList requests={historyRequests} isPending={false} />
        </div>
      </div>
    </div>
  );
}
