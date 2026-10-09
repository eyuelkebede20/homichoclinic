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

  // Group by date and dataencoderId
  const grouped = invoices.reduce((acc, inv) => {
    const date = inv.createdAt.toLocaleDateString('en-CA'); // e.g. "2026-10-09"
    
    inv.payments.forEach(p => {
      const key = `${date}_${p.dataencoderId}`;
      if (!acc[key]) {
        acc[key] = {
          date,
          dataencoderId: p.dataencoderId,
          totalRevenue: 0,
          totalDiscounts: 0, // This is tricky as discounts are per invoice, not payment, but we can apportion it or just sum it if this is the first payment of the invoice for this employee.
          cash: 0,
          card: 0,
          transfer: 0,
          invoiceCount: 0,
          invoicesSeen: new Set()
        };
      }
      
      if (!acc[key].invoicesSeen.has(inv.id)) {
        acc[key].invoicesSeen.add(inv.id);
        acc[key].invoiceCount += 1;
        acc[key].totalDiscounts += (inv.subtotal - inv.total);
      }

      acc[key].totalRevenue += p.amount;
      
      if (p.method === "cash") acc[key].cash += p.amount;
      else if (p.method === "card") acc[key].card += p.amount;
      else if (p.method === "transfer") acc[key].transfer += p.amount;
    });
    
    return acc;
  }, {} as Record<string, any>);

  const reportsRaw = Object.values(grouped).sort((a: any, b: any) => b.date.localeCompare(a.date));

  // Resolve employee names
  const encoderIds = Array.from(new Set(reportsRaw.map((r: any) => r.dataencoderId)));
  const encoders = await prisma.user.findMany({
    where: { id: { in: encoderIds as string[] } },
    select: { id: true, name: true }
  });
  const encoderMap = Object.fromEntries(encoders.map(e => [e.id, e.name]));

  const reports = reportsRaw.map((r: any) => ({
    date: r.date,
    employeeName: encoderMap[r.dataencoderId] || "Unknown",
    totalRevenue: r.totalRevenue,
    totalDiscounts: r.totalDiscounts,
    cash: r.cash,
    card: r.card,
    transfer: r.transfer,
    invoiceCount: r.invoiceCount,
  }));

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
