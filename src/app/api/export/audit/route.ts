import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) return new Response("Unauthorized", { status: 401 });

  const role = session.user.role || "User";
  const userPermissions = ROLE_PERMISSIONS[role] || [];
  
  if (!userPermissions.includes(PERMISSIONS.AUDIT_READ)) {
    return new Response("Forbidden", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  const whereClause = query ? {
    OR: [
      { action: { contains: query, mode: "insensitive" } as const },
      { resourceId: { contains: query, mode: "insensitive" } as const },
      { reason: { contains: query, mode: "insensitive" } as const },
    ]
  } : undefined;

  const logs = await prisma.auditLog.findMany({
    take: 10000,
    where: whereClause,
    orderBy: { createdAt: "desc" },
  });

  // Construct CSV
  const header = "Timestamp,Actor ID,Action,Resource ID,Details\n";
  const rows = logs.map(log => {
    const ts = log.createdAt.toISOString();
    const actor = `"${log.actorId.replace(/"/g, '""')}"`;
    const action = `"${log.action.replace(/"/g, '""')}"`;
    const resource = `"${(log.resourceId || '').replace(/"/g, '""')}"`;
    const details = `"${(log.reason || '').replace(/"/g, '""')} ${log.newValue ? JSON.stringify(log.newValue).replace(/"/g, '""') : ''}"`;
    
    return `${ts},${actor},${action},${resource},${details}`;
  }).join("\n");

  const csv = header + rows;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
