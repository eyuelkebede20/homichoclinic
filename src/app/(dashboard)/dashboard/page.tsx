import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/features/billing/utils";
import { PrintButton } from "@/components/print-button";
import { PrintHeader } from "@/components/print-header";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) redirect("/login");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch basic analytics
  const [
    todayVisits,
    pendingLabs,
    pendingPrescriptions,
    todayRevenue
  ] = await Promise.all([
    prisma.visit.count({ where: { visitDate: { gte: today } } }),
    prisma.labRequest.count({ where: { status: "requested" } }),
    prisma.prescription.count({ where: { status: "pending" } }),
    prisma.payment.aggregate({
      where: { createdAt: { gte: today } },
      _sum: { amount: true }
    })
  ]);

  const totalRevenue = todayRevenue._sum.amount || 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 print:p-0 print:max-w-none">
      <PrintHeader title="General Management Overview" subtitle="Daily executive summary report" />
      
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Overview</h1>
          <p className="text-slate-500 dark:text-slate-400">Welcome back, {session.user.name}</p>
        </div>
        <PrintButton label="Print Overview" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:grid-cols-4 print:gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Today's Visits</h3>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{todayVisits}</p>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Lab Tests</h3>
          <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{pendingLabs}</p>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Prescriptions</h3>
          <p className="mt-2 text-3xl font-bold text-orange-600 dark:text-orange-400">{pendingPrescriptions}</p>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Today's Revenue</h3>
          <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>
    </div>
  );
}
