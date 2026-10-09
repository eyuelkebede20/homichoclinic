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
      patient: true,
      items: true,
    },
    orderBy: { createdAt: "desc" }
  });

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

    return {
      invoiceNumber: inv.id,
      patientName: `${inv.patient.firstName} ${inv.patient.lastName}`,
      discountPercent: inv.discountPercentApplied,
      laboratoryCost,
      pharmacyCost,
      total: inv.subtotal,
      discountAmount: inv.subtotal - inv.total,
      afterDiscount: inv.total,
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
