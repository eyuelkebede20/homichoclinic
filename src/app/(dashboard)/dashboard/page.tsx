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
import { ManagerDashboard } from "@/features/admin/components/manager-dashboard";

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
        include: { patient: { select: { id: true, firstName: true, lastName: true, contactNumber: true, patientType: true, militaryId: true, employeeId: true, rank: true } } }
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
    if (logoSetting?.value) clinicLogo = logoSetting.value;
    if (!clinicLogo) clinicLogo = "/icon.png";

    const clinicNames = { clinicName, clinicNameAmharic, clinicSubName, clinicSubNameAmharic, clinicLogo };

    return <div className="p-8 max-w-7xl mx-auto"><LabDashboard requests={requests} clinicNames={clinicNames} /></div>;
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

  const [clinicNameSetting, clinicAmhSetting] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { key: "clinicName" } }),
    prisma.systemSetting.findUnique({ where: { key: "clinicNameAmharic" } }),
  ]);
  const clinicName = clinicNameSetting?.value || "Bure Card Clinic";
  const clinicNameAmharic = clinicAmhSetting?.value || "ቡሬ ካርድ ክሊኒክ";

  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [
    currentInpatients,
    admittedTodayVisits,
    checkedTodayVisits,
    waitingVisits,
    inProgressVisits,
    totalPatients,
    totalCompletedVisits,
    patientTypeCounts,
    recentVisitsRaw,
    allDrugs,
    expiredBatchesRaw,
    expiringSoonBatchesRaw,
    todayPaidInvoices,
    allTimeRevenueAgg,
    pendingInvoices,
    pendingPatientsCount,
    pendingCatalogCount,
    todayLabRequestsCount,
    todayPrescriptionsCount,
    activeDoctors,
    totalRoomsSetting,
    activeOpdRoomsListSetting,
  ] = await Promise.all([
    // 1. Inpatients currently admitted
    prisma.patient.count({ where: { admissionStatus: "Inpatient", deletedAt: null } }),
    // Admitted to clinic today
    prisma.visit.count({ where: { visitDate: { gte: today }, deletedAt: null } }),
    // Checked / completed consultations today
    prisma.visit.count({
      where: {
        status: "completed",
        OR: [{ updatedAt: { gte: today } }, { visitDate: { gte: today } }],
        deletedAt: null,
      },
    }),
    // Scheduled waiting visits today
    prisma.visit.count({ where: { status: "scheduled", visitDate: { gte: today }, deletedAt: null } }),
    // In progress visits today
    prisma.visit.count({ where: { status: "in_progress", visitDate: { gte: today }, deletedAt: null } }),
    // Total registered patients
    prisma.patient.count({ where: { deletedAt: null } }),
    // All-time completed visits
    prisma.visit.count({ where: { status: "completed", deletedAt: null } }),
    // Patient demographic groups
    prisma.patient.groupBy({
      by: ["patientType"],
      where: { deletedAt: null },
      _count: { id: true },
    }),
    // Recent visits for live table
    prisma.visit.findMany({
      take: 25,
      orderBy: { updatedAt: "desc" },
      where: { deletedAt: null },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            patientType: true,
            militaryId: true,
            employeeId: true,
            admissionStatus: true,
          },
        },
      },
    }),
    // All drugs with batches
    prisma.drug.findMany({
      where: { deletedAt: null },
      include: {
        batches: {
          where: { deletedAt: null },
          orderBy: { expiryDate: "asc" },
        },
      },
    }),
    // Expired batches with quantity > 0
    prisma.stockBatch.findMany({
      where: {
        expiryDate: { lt: today },
        quantity: { gt: 0 },
        deletedAt: null,
      },
      include: { drug: { select: { name: true, category: true } } },
      orderBy: { expiryDate: "desc" },
    }),
    // Expiring soon (30 days) batches
    prisma.stockBatch.findMany({
      where: {
        expiryDate: { gte: today, lte: thirtyDaysFromNow },
        quantity: { gt: 0 },
        deletedAt: null,
      },
      select: { quantity: true },
    }),
    // Today's paid invoices
    prisma.invoice.findMany({
      where: {
        status: { in: ["paid", "approved"] },
        updatedAt: { gte: today },
        deletedAt: null,
      },
      select: { total: true, subtotal: true, discountPercentApplied: true },
    }),
    // All-time revenue
    prisma.invoice.aggregate({
      where: { status: { in: ["paid", "approved"] }, deletedAt: null },
      _sum: { total: true },
    }),
    // Pending invoices
    prisma.invoice.findMany({
      where: { status: "pending", deletedAt: null },
      select: { total: true },
    }),
    // Pending patient paperwork approvals
    prisma.patient.count({ where: { status: "PENDING", deletedAt: null } }),
    // Pending catalog requests
    prisma.catalogChangeRequest.count({ where: { status: "PENDING" } }),
    // Lab requests today
    prisma.labRequest.count({ where: { createdAt: { gte: today }, deletedAt: null } }),
    // Prescriptions today
    prisma.prescription.count({ where: { createdAt: { gte: today }, deletedAt: null } }),
    // Active doctors on duty
    prisma.user.findMany({
      where: { role: "Doctor", currentOpdRoom: { not: null } },
      select: { id: true, name: true, currentOpdRoom: true },
    }),
    // Total rooms setting
    prisma.systemSetting.findUnique({ where: { key: "totalOpdRooms" } }),
    // Active OPD rooms list
    prisma.systemSetting.findUnique({ where: { key: "activeOpdRoomsList" } }),
  ]);

  const doctorIds = Array.from(new Set(recentVisitsRaw.map(v => v.doctorId).filter(Boolean))) as string[];
  const doctorUsers = doctorIds.length > 0 ? await prisma.user.findMany({
    where: { id: { in: doctorIds } },
    select: { id: true, name: true },
  }) : [];
  const doctorNameMap = new Map(doctorUsers.map(d => [d.id, d.name]));

  const queueByRoom = await prisma.visit.groupBy({
    by: ["opdRoom"],
    where: {
      status: { in: ["scheduled", "in_progress"] },
      visitDate: { gte: today },
      deletedAt: null,
    },
    _count: { id: true },
  });
  const roomQueueMap = new Map(queueByRoom.map(q => [q.opdRoom, q._count.id]));

  let totalOpdCount = 5;
  if (totalRoomsSetting?.value) {
    const parsed = parseInt(totalRoomsSetting.value, 10);
    if (!isNaN(parsed)) totalOpdCount = parsed;
  }

  const opdRoomsStatus = Array.from({ length: totalOpdCount }, (_, i) => {
    const room = i + 1;
    const doc = activeDoctors.find(d => d.currentOpdRoom === room);
    const queue = roomQueueMap.get(room) || 0;
    return {
      room,
      doctorName: doc?.name || null,
      queueCount: queue,
    };
  });

  // Calculate demographics
  let soldiersCount = 0;
  let civilianStaffCount = 0;
  let civilianFamilyCount = 0;
  let guestsCount = 0;
  let otherCount = 0;

  for (const group of patientTypeCounts) {
    const type = (group.patientType || "").toLowerCase();
    if (type.includes("soldier")) soldiersCount += group._count.id;
    else if (type.includes("civilian staff") || type.includes("staff")) civilianStaffCount += group._count.id;
    else if (type.includes("civilian family") || type.includes("family")) civilianFamilyCount += group._count.id;
    else if (type.includes("guest")) guestsCount += group._count.id;
    else otherCount += group._count.id;
  }

  // Format relative time
  const nowMs = Date.now();
  const formatTimeAgo = (d: Date) => {
    const diffMins = Math.floor((nowMs - d.getTime()) / (1000 * 60));
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const recentVisits = recentVisitsRaw.map(v => ({
    id: v.id,
    patientId: v.patient.id,
    patientName: `${v.patient.firstName} ${v.patient.lastName}`,
    patientType: v.patient.patientType || "General",
    militaryId: v.patient.militaryId,
    employeeId: v.patient.employeeId,
    admissionStatus: v.patient.admissionStatus || "Outpatient",
    status: v.status,
    opdRoom: v.opdRoom,
    doctorName: v.doctorId ? doctorNameMap.get(v.doctorId) || null : null,
    visitDate: v.visitDate.toLocaleDateString(),
    timeAgo: formatTimeAgo(v.updatedAt || v.visitDate),
  }));

  // Calculate drug stock metrics
  let totalUnitsInStock = 0;
  let outOfStockCount = 0;
  let lowStockCount = 0;
  const lowStockDrugsList: Array<{ id: string; name: string; category?: string | null; price: number; currentStock: number }> = [];

  for (const drug of allDrugs) {
    let drugStock = 0;
    if (drug.batches.length > 0) {
      drugStock = drug.batches
        .filter(b => b.quantity > 0 && new Date(b.expiryDate).getTime() >= today.getTime())
        .reduce((sum, b) => sum + b.quantity, 0);
    } else if (drug.amountInStock != null) {
      drugStock = drug.amountInStock;
    }

    totalUnitsInStock += drugStock;

    if (drugStock === 0) {
      outOfStockCount++;
      lowStockDrugsList.push({
        id: drug.id,
        name: drug.name,
        category: drug.category,
        price: drug.price,
        currentStock: 0,
      });
    } else if (drugStock <= 10) {
      lowStockCount++;
      lowStockDrugsList.push({
        id: drug.id,
        name: drug.name,
        category: drug.category,
        price: drug.price,
        currentStock: drugStock,
      });
    }
  }

  const expiredBatchesCount = expiredBatchesRaw.length;
  const expiredUnitsCount = expiredBatchesRaw.reduce((sum, b) => sum + b.quantity, 0);
  const expiredLossCost = expiredBatchesRaw.reduce((sum, b) => sum + (b.cost * b.quantity), 0);
  const expiringSoonBatchesCount = expiringSoonBatchesRaw.length;
  const expiringSoonUnitsCount = expiringSoonBatchesRaw.reduce((sum, b) => sum + b.quantity, 0);

  const expiredBatchesList = expiredBatchesRaw.map(b => ({
    id: b.id,
    drugName: b.drug.name,
    category: b.drug.category,
    batchNumber: b.batchNumber,
    quantity: b.quantity,
    expiryDate: b.expiryDate.toLocaleDateString(),
    cost: b.cost,
    docNo: b.docNo,
  }));

  // Financial metrics
  const todayRevenue = todayPaidInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const todayDiscountsSubsidized = todayPaidInvoices.reduce((sum, inv) => {
    const disc = Math.round((inv.subtotal * (inv.discountPercentApplied || 0)) / 100);
    return sum + disc;
  }, 0);
  const allTimeRevenue = allTimeRevenueAgg._sum.total || 0;
  const pendingInvoicesCount = pendingInvoices.length;
  const pendingInvoicesTotal = pendingInvoices.reduce((sum, inv) => sum + inv.total, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <ManagerDashboard
        patientStats={{
          currentInpatients,
          admittedToday: admittedTodayVisits,
          checkedToday: checkedTodayVisits,
          inProgressNow: inProgressVisits,
          waitingInQueue: waitingVisits,
          totalRegisteredPatients: totalPatients,
          totalCompletedVisits,
          categories: {
            soldiers: soldiersCount,
            civilianStaff: civilianStaffCount,
            civilianFamily: civilianFamilyCount,
            guests: guestsCount,
            other: otherCount,
          },
          recentVisits,
        }}
        medicineStats={{
          totalDrugTypes: allDrugs.length,
          totalUnitsInStock,
          outOfStockCount,
          lowStockCount,
          expiredBatchesCount,
          expiredUnitsCount,
          expiredLossCost,
          expiringSoonBatchesCount,
          expiringSoonUnitsCount,
          expiredBatches: expiredBatchesList,
          lowStockDrugs: lowStockDrugsList.slice(0, 30),
        }}
        operationalStats={{
          todayRevenue,
          allTimeRevenue,
          todayDiscountsSubsidized,
          pendingInvoicesCount,
          pendingInvoicesTotal,
          pendingPatientApprovalsCount: pendingPatientsCount,
          pendingCatalogRequestsCount: pendingCatalogCount,
          todayLabRequestsCount,
          todayPrescriptionsCount,
          activeDoctorsCount: activeDoctors.length,
          opdRoomsStatus,
        }}
        clinicInfo={{
          name: clinicName,
          nameAmharic: clinicNameAmharic,
          userName: session.user.name,
          userRole: role,
        }}
      />
    </div>
  );
}
