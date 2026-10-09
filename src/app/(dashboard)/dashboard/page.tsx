import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";
import { getStartOfDayLocal } from "@/lib/date-utils";
import { PrintButton } from "@/components/print-button";
import { PrintHeader } from "@/components/print-header";
import { DoctorLabResultsInbox } from "@/features/clinical/components/doctor-lab-results-inbox";
import { ReceptionDashboard } from "@/features/clinical/components/reception-dashboard";
import { NurseDashboard } from "@/features/clinical/components/nurse-dashboard";
import { LabDashboard } from "@/features/clinical/components/lab-dashboard";
import { PharmacyDashboard } from "@/features/clinical/components/pharmacy-dashboard";

import { VisitForm } from "@/features/clinical/components/visit-form";
import { DoctorPatientQueue } from "@/features/clinical/components/doctor-queue";
import { DoctorWeeklyAppointmentsCard } from "@/features/clinical/components/doctor-weekly-appointments-card";
import { DoctorAwaitingReviewCard } from "@/features/clinical/components/doctor-awaiting-review-card";

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
    const today = getStartOfDayLocal();

    const [sysSetting, totalRoomsSetting, activeVisits, patientsRaw, doctors] = await Promise.all([
      prisma.systemSetting.findUnique({ where: { key: "activeOpdRoomsList" } }),
      prisma.systemSetting.findUnique({ where: { key: "totalOpdRooms" } }),
      prisma.visit.findMany({
        where: { status: { in: ["scheduled", "in_progress"] }, visitDate: { gte: today }, deletedAt: null },
        include: { patient: { select: { id: true, firstName: true, lastName: true, contactNumber: true } } }
      }),
      prisma.patient.findMany({ select: { id: true, firstName: true, lastName: true }, orderBy: { firstName: "asc" } }),
      prisma.user.findMany({ where: { role: "Doctor" }, select: { id: true, name: true, currentOpdRoom: true }, orderBy: { name: "asc" } })
    ]);

    let activeOpds = [1, 2, 3];
    if (sysSetting && sysSetting.value) {
      try { activeOpds = JSON.parse(sysSetting.value); } catch(e) {}
    }

    const totalRoomsCount = totalRoomsSetting?.value ? parseInt(totalRoomsSetting.value) : 5;
    const patients = patientsRaw.map(p => ({ id: p.id, name: p.firstName + " " + p.lastName }));

    return (
      <div className="p-8 max-w-[1600px] mx-auto space-y-8">
        <VisitForm patients={patients} doctors={doctors} />
        <ReceptionDashboard activeOpds={activeOpds} activeVisits={activeVisits} activeDoctors={doctors.filter(d => d.currentOpdRoom != null).map(d => ({ name: d.name, currentOpdRoom: d.currentOpdRoom }))} totalRoomsCount={totalRoomsCount} />
      </div>
    );
  }

  const today = getStartOfDayLocal();

  // 2. Doctor Dashboard
  if (role === "Doctor") {
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);

    // Fetch user first because we need currentOpdRoom
    const fullUser = await prisma.user.findUnique({ where: { id: session.user.id } });
    const currentOpdRoom = fullUser?.currentOpdRoom || null;
    
    const [weeklyAppointmentsData, pendingVisits, unreadLabResults] = await Promise.all([
      prisma.visit.findMany({
        where: { doctorId: session.user.id, visitDate: { gte: weekStart, lte: weekEnd } },
        include: { patient: { select: { id: true, firstName: true, lastName: true, yob: true, gender: true, militaryId: true, employeeId: true } } },
        orderBy: { visitDate: "asc" }
      }),
      prisma.visit.findMany({
        where: {
          ...(currentOpdRoom ? { opdRoom: currentOpdRoom, OR: [{ doctorId: session.user.id }, { doctorId: null }] } : { doctorId: session.user.id }),
          status: { in: ["scheduled", "in_progress"] },
          visitDate: { gte: today },
        },
        include: {
          patient: {
            include: {
              labRequests: {
                where: {
                  status: { in: ["urgent", "requested", "completed"] },
                  createdAt: { gte: today },
                },
                include: { test: true },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" }
      }),
      prisma.labResult.findMany({
        where: { isReadByDoctor: false, request: { requestedBy: session.user.id } },
        include: { request: { include: { patient: true, test: true } } },
        orderBy: { createdAt: "desc" }
      })
    ]);

    const { getDictionary } = await import("@/lib/i18n");
    const dict = await getDictionary();

    const weeklyAppointments = weeklyAppointmentsData.length;

    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
              {dict["dash.doctorOverview"] || "Doctor Overview"}
              {currentOpdRoom && (
                <span className="text-sm font-semibold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                  {dict["dash.operatingInOpd"] || "Operating in OPD"} {currentOpdRoom}
                </span>
              )}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">{dict["dash.welcomeBackDr"] || "Welcome back, Dr."} {session.user.name}</p>
          </div>
        </div>
        
        <DoctorLabResultsInbox results={unreadLabResults} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DoctorWeeklyAppointmentsCard appointments={weeklyAppointmentsData as any} count={weeklyAppointments} />
          <DoctorAwaitingReviewCard count={pendingVisits.length} />
        </div>

        <div id="patient-queue-section">
          <DoctorPatientQueue visits={pendingVisits} />
        </div>
      </div>
    );
  }

  // 3. Nurse Dashboard
  if (role === "Nurse") {
    const pendingVisits = await prisma.visit.findMany({
      where: { status: { in: ["scheduled", "in_progress"] } },
      include: { patient: { select: { firstName: true, lastName: true } } },
      orderBy: { updatedAt: "desc" }
    });
    return <div className="p-8 max-w-7xl mx-auto"><NurseDashboard visits={pendingVisits} /></div>;
  }

  // 4. Lab Dashboard
  if (role === "Lab Technician" || role === "Laboratory") {
    const [requests, setting, nameSetting, amhSetting, logoSetting] = await Promise.all([
      prisma.labRequest.findMany({
        where: { status: { in: ["requested", "in_progress", "urgent"] } },
        include: { patient: true, test: { select: { name: true } } },
        orderBy: { createdAt: "asc" }
      }),
      prisma.systemSetting.findUnique({ where: { key: "referral_destinations" } }),
      prisma.systemSetting.findUnique({ where: { key: "clinicName" } }),
      prisma.systemSetting.findUnique({ where: { key: "clinicNameAmharic" } }),
      prisma.systemSetting.findUnique({ where: { key: "clinicLogo" } })
    ]);

    let referralDestinations: string[] = [];
    let clinicName = "DEFENCE ENGINEERING INDUSTRIES GROUP";
    let clinicNameAmharic = "የመከላከያ ኢንጂነሪንግ ኢንዱስትሪዎች ግሩፕ";
    let clinicSubName = "HOMICHO AMMUNATION ENGINEERING INDUSTRY HEALTH CENTER";
    let clinicSubNameAmharic = "ሆሚጮ ጥይት ኢንጂነሪንግ ኢንዱስትሪ ጤና ጣቢያ";
    let clinicLogo = "";

    if (setting) {
      try { referralDestinations = JSON.parse(setting.value); } catch (e) {}
    }
    if (nameSetting) clinicName = nameSetting.value;
    if (amhSetting) clinicNameAmharic = amhSetting.value;
    if (logoSetting) clinicLogo = logoSetting.value;

    const clinicNames = { clinicName, clinicNameAmharic, clinicSubName, clinicSubNameAmharic, clinicLogo };

    return <div className="p-8 max-w-7xl mx-auto"><LabDashboard requests={requests} referralDestinations={referralDestinations} clinicNames={clinicNames} /></div>;
  }

  // 6. Dataencoder Dashboard
  if (role === "Dataencoder") {
    redirect("/dataencoder");
  }

  // 5. Pharmacy Dashboard
  if (role === "Pharmacy" || role === "Pharmacist") {
    const [prescriptions, allDrugs, expiringBatches] = await Promise.all([
      prisma.prescription.findMany({
        where: { status: "pending" },
        include: { patient: { select: { firstName: true, lastName: true } }, items: { include: { drug: { select: { name: true } } } } },
        orderBy: { createdAt: "asc" }
      }),
      prisma.drug.findMany({
        include: { batches: { where: { quantity: { gt: 0 } } } }
      }),
      prisma.stockBatch.count({
        where: {
          expiryDate: { lte: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000) },
          quantity: { gt: 0 }
        }
      })
    ]);

    const lowStockCount = allDrugs.filter(d => 
      d.batches.reduce((sum, b) => sum + b.quantity, 0) < 10 // Hardcoded threshold for now
    ).length;

    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Pharmacy Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage patient orders and view inventory.</p>
        </div>

        {/* 1. Patient Orders (Prescriptions) */}
        <PharmacyDashboard prescriptions={prescriptions} />

        {/* 2. Inventory Stats */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6">Inventory Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900/50 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Drug Types</h3>
              <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">{allDrugs.length}</p>
            </div>
            <div className="bg-white dark:bg-slate-900/50 p-6 rounded-xl shadow-sm border border-red-200 dark:border-red-900/30">
              <h3 className="text-sm font-medium text-red-600 dark:text-red-500">Low Stock Alerts</h3>
              <p className="mt-2 text-3xl font-semibold text-red-700 dark:text-red-400">{lowStockCount}</p>
            </div>
            <div className="bg-white dark:bg-slate-900/50 p-6 rounded-xl shadow-sm border border-orange-200 dark:border-orange-900/30">
              <h3 className="text-sm font-medium text-orange-600 dark:text-orange-500">Expiring Soon (30d)</h3>
              <p className="mt-2 text-3xl font-semibold text-orange-700 dark:text-orange-400">{expiringBatches}</p>
            </div>
          </div>

          <div className="mt-8">
            <a href="/pharmacy" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Open Pharmacy Inventory &rarr;
            </a>
          </div>
        </div>
      </div>
    );
  }

  const [clinicNameSetting] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { key: "clinicName" } })
  ]);
  const clinicName = clinicNameSetting?.value || "Clinic ERP";

  const { getDictionary } = await import("@/lib/i18n");
  const dict = await getDictionary();

  // 4. Default / Fallback Dashboard (Admins, Dataencoders, Lab)
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{dict["dash.welcome"] ? dict["dash.welcome"] : `Welcome to ${clinicName}`}</h1>
          <p className="text-slate-500 dark:text-slate-400">{dict["dash.hello"] || "Hello"}, {session.user.name}</p>
        </div>
        <PrintButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Placeholder cards */}
        <div className="bg-white dark:bg-slate-900/50 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{dict["dash.systemStatus"] || "System Status"}</h3>
          <p className="mt-2 text-xl font-semibold text-emerald-600 dark:text-emerald-500">{dict["dash.online"] || "Online"}</p>
        </div>
        <div className="bg-white dark:bg-slate-900/50 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{dict["dash.yourRole"] || "Your Role"}</h3>
          <p className="mt-2 text-xl font-semibold text-blue-600 dark:text-blue-500">{role}</p>
        </div>
      </div>
    </div>
  );
}
