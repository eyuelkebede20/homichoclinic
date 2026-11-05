import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { ZReportsClient } from "./z-reports-client";
import { formatToEthiopianDate, parseEthiopianDateString, ethiopianToGregorian } from "@/lib/date-utils";

export default async function ZReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) redirect("/login");

  const role = session.user.role || "User";
  const userPermissions = ROLE_PERMISSIONS[role] || [];
  
  if (!userPermissions.includes(PERMISSIONS.INVOICE_READ)) {
    redirect("/dashboard");
  }

  const resolvedParams = await searchParams;
  let fromDate: Date | undefined;
  if (resolvedParams?.from) {
    const eth = parseEthiopianDateString(resolvedParams.from);
    if (eth) {
      fromDate = ethiopianToGregorian(eth.year, eth.month, eth.day, 0, 0, 0);
    } else {
      const d = new Date(resolvedParams.from);
      if (!isNaN(d.getTime())) fromDate = d;
    }
  }

  let toDate: Date | undefined;
  if (resolvedParams?.to) {
    const eth = parseEthiopianDateString(resolvedParams.to);
    if (eth) {
      toDate = ethiopianToGregorian(eth.year, eth.month, eth.day, 23, 59, 59, 999);
    } else {
      const d = new Date(resolvedParams.to);
      if (!isNaN(d.getTime())) {
        d.setHours(23, 59, 59, 999);
        toDate = d;
      }
    }
  }

  const whereClause: any = { status: "paid" };
  if (fromDate || toDate) {
    whereClause.createdAt = {};
    if (fromDate) whereClause.createdAt.gte = fromDate;
    if (toDate) whereClause.createdAt.lte = toDate;
  }

  // Fetch all paid invoices and their items matching date filter
  const invoices = await prisma.invoice.findMany({
    where: whereClause,
    include: {
      patient: {
        include: {
          primaryPatient: true,
        }
      },
      items: true,
      payments: true,
      labRequests: {
        include: { test: true }
      },
      prescriptionItems: {
        include: { drug: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const encoderIds = Array.from(new Set(invoices.flatMap(inv => inv.payments.map(p => p.dataencoderId)).filter(Boolean)));
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      action: "invoice:approve",
      resourceId: { in: invoices.map(i => i.id) }
    }
  });

  const allActorIds = Array.from(new Set([...encoderIds, ...auditLogs.map(a => a.actorId)]));
  const staffUsers = await prisma.user.findMany({
    where: { id: { in: allActorIds } },
    select: { id: true, name: true, role: true }
  });
  const userMap = new Map(staffUsers.map(u => [u.id, u.name]));
  const auditMap = new Map(auditLogs.map(a => [a.resourceId, a.actorId]));

  const [nameSetting, amhSetting, logoSetting] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { key: "clinicName" } }),
    prisma.systemSetting.findUnique({ where: { key: "clinicNameAmharic" } }),
    prisma.systemSetting.findUnique({ where: { key: "clinicLogo" } }),
  ]);

  const clinicInfo = {
    name: nameSetting?.value || "Bure Card Clinic",
    nameAmharic: amhSetting?.value || "ቡሬ ካርድ ክሊኒክ",
    logo: logoSetting?.value || "",
  };

  const reports = invoices.map(inv => {
    let laboratoryCost = 0;
    let pharmacyCost = 0;

    const items = inv.items.map(item => {
      const lineTotal = item.unitPrice * item.quantity;
      const descLower = item.description.toLowerCase();
      let category: "Laboratory" | "Pharmacy" | "Clinical / Service" = "Clinical / Service";

      if (descLower.startsWith("lab test:") || descLower.startsWith("lab:")) {
        laboratoryCost += lineTotal;
        category = "Laboratory";
      } else if (descLower.startsWith("pharmacy:") || descLower.startsWith("drug:")) {
        pharmacyCost += lineTotal;
        category = "Pharmacy";
      }

      return {
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: lineTotal,
        category,
      };
    });

    const isDependent = !!inv.patient.primaryPatient;
    const staffPatient = isDependent ? inv.patient.primaryPatient! : inv.patient;
    const staffMemberName = `${staffPatient.firstName} ${staffPatient.lastName}`;
    const staffId = staffPatient.employeeId || staffPatient.militaryId || staffPatient.id || "N/A";
    const staffDept = staffPatient.department || "N/A";
    const staffType = staffPatient.patientType || "Staff";
    const staffRank = staffPatient.rank || inv.patient.rank || staffPatient.salutation || "-";
    const patientRank = inv.patient.rank || inv.patient.salutation || "-";

    const labNames = inv.labRequests?.map((lr: any) => lr.test?.name).filter(Boolean) || [];
    const drugNames = inv.prescriptionItems?.map((pi: any) => pi.drug?.name).filter(Boolean) || [];
    let remarks = "";
    if (labNames.length > 0 && drugNames.length > 0) {
      remarks = `${labNames.join(", ")} | ${drugNames.join(", ")}`;
    } else if (drugNames.length > 0) {
      remarks = drugNames.join(", ");
    } else if (labNames.length > 0) {
      remarks = labNames.join(", ");
    } else {
      remarks = inv.items.map(it => it.description).join(", ") || "-";
    }

    const encoderId = inv.payments[0]?.dataencoderId || auditMap.get(inv.id);
    const encoderName = encoderId ? (userMap.get(encoderId) || "Staff / Encoder") : "Staff / Encoder";

    return {
      invoiceNumber: inv.id,
      createdAt: inv.createdAt.toISOString(),
      date: formatToEthiopianDate(inv.createdAt),
      time: inv.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      patientName: `${inv.patient.firstName} ${inv.patient.lastName}`,
      patientType: inv.patient.patientType,
      relationship: inv.patient.relationship || (isDependent ? "Dependent" : "Self"),
      staffMemberName,
      staffId,
      staffDepartment: staffDept,
      staffType,
      rank: staffRank,
      patientRank,
      remarks,
      encoderName,
      discountPercent: inv.discountPercentApplied,
      laboratoryCost,
      pharmacyCost,
      total: inv.subtotal,
      discountAmount: inv.subtotal - inv.total,
      afterDiscount: inv.total,
      items,
    };
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Z-Reports</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          End-of-day financial summaries and reconciliation.
        </p>
      </div>

      <ZReportsClient 
        reports={reports} 
        clinicInfo={clinicInfo} 
        dateRange={{ from: resolvedParams?.from, to: resolvedParams?.to }}
      />
    </div>
  );
}
