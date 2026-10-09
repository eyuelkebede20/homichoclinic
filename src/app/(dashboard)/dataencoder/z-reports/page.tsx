import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { ZReportsClient } from "./z-reports-client";

export default async function ZReportsPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) redirect("/login");

  const role = session.user.role || "User";
  const userPermissions = ROLE_PERMISSIONS[role] || [];
  
  if (!userPermissions.includes(PERMISSIONS.INVOICE_READ)) {
    redirect("/dashboard");
  }

  // Fetch all paid invoices and their payments
  const invoices = await prisma.invoice.findMany({
    where: { status: "paid" },
    include: {
      payments: true,
    },
    orderBy: { createdAt: "desc" }
  });

  // Group by date (YYYY-MM-DD)
  const grouped = invoices.reduce((acc, inv) => {
    // Note: use local time instead of UTC to avoid date shifting
    const date = inv.createdAt.toLocaleDateString('en-CA'); // e.g. "2026-10-09"
    if (!acc[date]) {
      acc[date] = {
        date,
        totalRevenue: 0,
        totalDiscounts: 0,
        cash: 0,
        card: 0,
        transfer: 0,
        invoiceCount: 0,
      };
    }
    
    acc[date].invoiceCount += 1;
    acc[date].totalRevenue += inv.total;
    acc[date].totalDiscounts += (inv.subtotal - inv.total);
    
    inv.payments.forEach(p => {
      if (p.method === "cash") acc[date].cash += p.amount;
      else if (p.method === "card") acc[date].card += p.amount;
      else if (p.method === "transfer") acc[date].transfer += p.amount;
    });
    
    return acc;
  }, {} as Record<string, any>);

  const reports = Object.values(grouped).sort((a: any, b: any) => b.date.localeCompare(a.date));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Z-Reports</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          End-of-day financial summaries and reconciliation.
        </p>
      </div>

      <ZReportsClient reports={reports} />
    </div>
  );
}
