import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/features/billing/utils";
import { PrintButton } from "@/components/print-button";
import { PrintHeader } from "@/components/print-header";

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
}

function endOfWeek(date: Date) {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) redirect("/login");

  const role = session.user.role || "User";

  // 1. Reception Default
  if (role === "Reception") {
    redirect("/patients");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 2. Doctor Dashboard
  if (role === "Doctor") {
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);
    
    const weeklyAppointments = await prisma.visit.count({
      where: {
        doctorId: session.user.id,
        visitDate: { gte: weekStart, lte: weekEnd }
      }
    });

    const pendingReview = await prisma.visit.count({
      where: {
        doctorId: session.user.id,
        status: "in_progress",
      }
    });

    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Doctor Overview</h1>
            <p className="text-slate-500 dark:text-slate-400">Welcome back, Dr. {session.user.name}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">My Appointments This Week</h3>
            <p className="mt-2 text-4xl font-bold text-slate-900 dark:text-slate-100">{weeklyAppointments}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-orange-200 dark:border-orange-800">
            <h3 className="text-sm font-medium text-orange-600 dark:text-orange-400">Patients Awaiting Review</h3>
            <p className="mt-2 text-4xl font-bold text-slate-900 dark:text-slate-100">{pendingReview}</p>
          </div>
        </div>
      </div>
    );
  }

  // 3. Pharmacy Dashboard
  if (role === "Pharmacy") {
    const allDrugs = await prisma.drug.findMany({
      include: {
        batches: { where: { quantity: { gt: 0 } } }
      }
    });

    const inventory = allDrugs.map(drug => {
      const totalStock = drug.batches.reduce((sum, b) => sum + b.quantity, 0);
      return { ...drug, totalStock };
    });

    // Filter drugs with < 500 stock, sort by lowest
    const lowStockMeds = inventory
      .filter(d => d.totalStock < 500)
      .sort((a, b) => a.totalStock - b.totalStock)
      .slice(0, 20);

    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Pharmacy Inventory Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400">Track critical stock levels</p>
          </div>
        </div>
        
        {lowStockMeds.length > 0 ? (
          <div className="bg-white dark:bg-slate-900 shadow rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800">
              <h2 className="text-lg font-bold text-orange-800 dark:text-orange-300">Low Stock Warnings (Below 500)</h2>
            </div>
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {lowStockMeds.map(med => {
                let statusColor = "text-green-600";
                if (med.totalStock < 100) statusColor = "text-red-600 font-bold";
                else if (med.totalStock < 300) statusColor = "text-orange-600 font-bold";
                else if (med.totalStock < 500) statusColor = "text-yellow-600";

                return (
                  <li key={med.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{med.name}</p>
                      <p className="text-xs text-slate-500">{med.category || "Uncategorized"}</p>
                    </div>
                    <div className={`${statusColor}`}>
                      {med.totalStock} units remaining
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-6 rounded-lg border border-green-200 dark:border-green-800 text-center font-medium">
            All medications are sufficiently stocked (500+ units).
          </div>
        )}
      </div>
    );
  }

  // 4. Laboratory Dashboard
  if (role === "Laboratory") {
    const allTests = await prisma.labTest.findMany();
    const totalMachines = allTests.length;
    const offlineMachines = allTests.filter(t => !t.isOperational).length;
    const onlineMachines = totalMachines - offlineMachines;

    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Laboratory Equipment Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400">Machine availability overview</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-slate-200 dark:border-slate-800 text-center">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Registered Equipment</h3>
            <p className="mt-2 text-4xl font-bold text-slate-900 dark:text-slate-100">{totalMachines}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-green-200 dark:border-green-800 text-center">
            <h3 className="text-sm font-medium text-green-600 dark:text-green-400">Active / Operational</h3>
            <p className="mt-2 text-4xl font-bold text-green-600 dark:text-green-400">{onlineMachines}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-red-200 dark:border-red-800 text-center">
            <h3 className="text-sm font-medium text-red-600 dark:text-red-400">Offline / Maintenance</h3>
            <p className="mt-2 text-4xl font-bold text-red-600 dark:text-red-400">{offlineMachines}</p>
          </div>
        </div>
      </div>
    );
  }

  // 5. Default General Management Dashboard (Admin / Manager)
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
