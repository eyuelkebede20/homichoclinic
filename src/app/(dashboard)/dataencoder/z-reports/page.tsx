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

  // Fetch all paid invoices and their items
  const invoices = await prisma.invoice.findMany({
    where: { status: "paid" },
    include: {
      patient: {
        include: {
          primaryPatient: true,
        }
      },
      items: true,
      payments: true,
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

  const reports = invoices.map(inv => {
    let laboratoryCost = 0;
    let pharmacyCost = 0;

    inv.items.forEach(item => {
      const lineTotal = item.unitPrice * item.quantity;
      if (item.description.startsWith("Lab Test:")) {
        laboratoryCost += lineTotal;
      } else if (item.description.startsWith("Pharmacy:")) {
        pharmacyCost += lineTotal;
      }
    });

    const isDependent = !!inv.patient.primaryPatient;
    const staffMemberName = isDependent 
      ? `${inv.patient.primaryPatient!.firstName} ${inv.patient.primaryPatient!.lastName}`
      : `${inv.patient.firstName} ${inv.patient.lastName}`;
    const staffId = isDependent
      ? (inv.patient.primaryPatient!.employeeId || inv.patient.primaryPatient!.militaryId || "N/A")
      : (inv.patient.employeeId || inv.patient.militaryId || "N/A");
    const staffDept = isDependent
      ? (inv.patient.primaryPatient!.department || "N/A")
      : (inv.patient.department || "N/A");

    const encoderId = inv.payments[0]?.dataencoderId || auditMap.get(inv.id);
    const encoderName = encoderId ? (userMap.get(encoderId) || "Staff / Encoder") : "Staff / Encoder";

    return {
      invoiceNumber: inv.id,
      patientName: `${inv.patient.firstName} ${inv.patient.lastName}`,
      patientType: inv.patient.patientType,
      relationship: inv.patient.relationship || (isDependent ? "Dependent" : "Self"),
      staffMemberName,
      staffId,
      staffDepartment: staffDept,
      encoderName,
      discountPercent: inv.discountPercentApplied,
      laboratoryCost,
      pharmacyCost,
      total: inv.subtotal,
      discountAmount: inv.subtotal - inv.total,
      afterDiscount: inv.total,
      date: inv.createdAt.toLocaleDateString(),
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

      <ZReportsClient reports={reports} />
    </div>
  );
}
