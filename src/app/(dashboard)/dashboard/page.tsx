import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/features/billing/utils";
import { getStartOfDayLocal } from "@/lib/date-utils";
import { PrintButton } from "@/components/print-button";
import { PrintHeader } from "@/components/print-header";
import { DoctorLabResultsInbox } from "@/features/clinical/components/doctor-lab-results-inbox";
import { ReceptionDashboard } from "@/features/clinical/components/reception-dashboard";
import { DoctorPatientQueue } from "@/features/clinical/components/doctor-queue";

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
    const sysSetting = await prisma.systemSetting.findUnique({ where: { key: "activeOpdRooms" } });
    const opdRooms = sysSetting && !isNaN(parseInt(sysSetting.value, 10)) ? parseInt(sysSetting.value, 10) : 3;

    const activeVisits = await prisma.visit.findMany({
      where: {
        status: { in: ["scheduled", "in_progress"] },
        deletedAt: null
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, contactNumber: true } }
      }
    });

    return (
      <div className="p-8 max-w-[1600px] mx-auto space-y-8">
        <ReceptionDashboard opdRooms={opdRooms} activeVisits={activeVisits} />
      </div>
    );
  }

  const today = getStartOfDayLocal();

  // 2. Doctor Dashboard
  if (role === "Doctor") {
    const fullUser = await prisma.user.findUnique({ where: { id: session.user.id } });
    const currentOpdRoom = fullUser?.currentOpdRoom || null;

    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);
    
    const weeklyAppointments = await prisma.visit.count({
      where: {
        doctorId: session.user.id,
        visitDate: { gte: weekStart, lte: weekEnd }
      }
    });

    const pendingVisits = await prisma.visit.findMany({
      where: {
        OR: [
          { doctorId: session.user.id },
          ...(currentOpdRoom ? [{ opdRoom: currentOpdRoom }] : [])
        ],
        status: { in: ["scheduled", "in_progress"] },
      },
      include: {
        patient: {
          include: {
            labRequests: {
              where: {
                status: "completed",
                createdAt: { gte: today }
              }
            }
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    const unreadLabResults = await prisma.labResult.findMany({
      where: {
        isReadByDoctor: false,
        request: { requestedBy: session.user.id }
      },
      include: {
        request: {
          include: { patient: true, test: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
              Doctor Overview 
              {currentOpdRoom && (
                <span className="text-sm font-semibold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                  Operating in OPD {currentOpdRoom}
                </span>
              )}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Welcome back, Dr. {session.user.name}</p>
          </div>
        </div>
        
        <DoctorLabResultsInbox results={unreadLabResults} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">My Appointments This Week</h3>
            <p className="mt-2 text-4xl font-bold text-slate-900 dark:text-slate-100">{weeklyAppointments}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-orange-200 dark:border-orange-800">
            <h3 className="text-sm font-medium text-orange-600 dark:text-orange-400">Patients Awaiting Review</h3>
            <p className="mt-2 text-4xl font-bold text-slate-900 dark:text-slate-100">{pendingVisits.length}</p>
          </div>
        </div>

        <DoctorPatientQueue visits={pendingVisits} />
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

    const lowStockCount = allDrugs.filter(d => 
      d.batches.reduce((sum, b) => sum + b.quantity, 0) < d.minimumStock
    ).length;

    const expiringBatches = await prisma.drugBatch.count({
      where: {
        expiryDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        quantity: { gt: 0 }
      }
    });

    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Pharmacy Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Inventory and dispensing overview.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Drug Types</h3>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{allDrugs.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10">
            <h3 className="text-sm font-medium text-red-600 dark:text-red-400">Low Stock Alerts</h3>
            <p className="mt-2 text-3xl font-bold text-red-700 dark:text-red-500">{lowStockCount}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-900/10">
            <h3 className="text-sm font-medium text-orange-600 dark:text-orange-400">Expiring Soon (30d)</h3>
            <p className="mt-2 text-3xl font-bold text-orange-700 dark:text-orange-500">{expiringBatches}</p>
          </div>
        </div>

        <div className="mt-8">
          <a href="/pharmacy" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Open Pharmacy Inventory &rarr;
          </a>
        </div>
      </div>
    );
  }

  // 4. Default / Fallback Dashboard (Admins, Cashiers, Lab)
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Welcome to Clinic ERP</h1>
          <p className="text-slate-500 dark:text-slate-400">Hello, {session.user.name}</p>
        </div>
        <PrintButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Placeholder cards */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">System Status</h3>
          <p className="mt-2 text-xl font-bold text-green-600 dark:text-green-500">Online</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Your Role</h3>
          <p className="mt-2 text-xl font-bold text-blue-600 dark:text-blue-500">{role}</p>
        </div>
      </div>
    </div>
  );
}