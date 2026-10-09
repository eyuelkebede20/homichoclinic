import { prisma } from "@/lib/prisma";
import { DataEncoderClient } from "./data-encoder-client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";

export default async function DataEncoderPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role || "User";
  const userPermissions = ROLE_PERMISSIONS[role] || [];
  
  if (!userPermissions.includes(PERMISSIONS.INVOICE_READ)) {
    redirect("/dashboard");
  }

  const resolvedParams = await searchParams;
  const fromDate = resolvedParams.from ? new Date(resolvedParams.from) : undefined;
  const toDate = resolvedParams.to ? new Date(resolvedParams.to) : undefined;
  
  if (toDate) {
    // Include the entire end day
    toDate.setHours(23, 59, 59, 999);
  }

  const whereClause: any = {};
  if (fromDate || toDate) {
    whereClause.createdAt = {};
    if (fromDate) whereClause.createdAt.gte = fromDate;
    if (toDate) whereClause.createdAt.lte = toDate;
  }

  const rawInvoices = await prisma.invoice.findMany({
    where: whereClause,
    include: {
      patient: true,
      items: true,
      labRequests: {
        include: { test: true }
      },
      prescriptionItems: {
        include: { drug: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  // Map to the shape we need
  const invoices = rawInvoices.map(inv => {
    let labCost = 0;
    let pharmaCost = 0;

    for (const item of inv.items) {
      if (item.description.startsWith("Lab Test: ") || item.description.startsWith("Lab: ")) {
        labCost += item.quantity * item.unitPrice;
      } else if (item.description.startsWith("Pharmacy: ") || item.description.startsWith("Drug: ")) {
        pharmaCost += item.quantity * item.unitPrice;
      }
    }

    const subtotal = labCost + pharmaCost;
    const discountAmount = Math.round((subtotal * inv.discountPercentApplied) / 100);
    const total = subtotal - discountAmount;

    return {
      id: inv.id,
      createdAt: inv.createdAt.toISOString(),
      patientName: `${inv.patient.firstName} ${inv.patient.lastName}`,
      patientType: inv.patient.patientType || "Unknown",
      discountPercentApplied: inv.discountPercentApplied,
      labCost,
      pharmaCost,
      subtotal,
      total,
      status: inv.status,
      labUsed: inv.labRequests.map(lr => lr.test.name).join(", ") || "-",
      pharmaUsed: inv.prescriptionItems.map(pi => pi.drug.name).join(", ") || "-",
      discountAmount,
    };
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Data Encoder</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Reconcile manual ledgers with software entries.
        </p>
      </div>

      <DataEncoderClient initialInvoices={invoices} />
    </div>
  );
}
