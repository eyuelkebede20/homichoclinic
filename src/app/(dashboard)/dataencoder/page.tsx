import { prisma } from "@/lib/prisma";
import { DataEncoderClient } from "./data-encoder-client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { parseEthiopianDateString, ethiopianToGregorian } from "@/lib/date-utils";

import Link from "next/link";
import { FileText } from "lucide-react";

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
  let fromDate: Date | undefined;
  if (resolvedParams.from) {
    const eth = parseEthiopianDateString(resolvedParams.from);
    if (eth) {
      fromDate = ethiopianToGregorian(eth.year, eth.month, eth.day, 0, 0, 0);
    } else {
      const d = new Date(resolvedParams.from);
      if (!isNaN(d.getTime())) fromDate = d;
    }
  }

  let toDate: Date | undefined;
  if (resolvedParams.to) {
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Data Encoder</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Reconcile manual ledgers with software entries.
          </p>
        </div>
        <Link
          href="/dataencoder/z-reports"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors self-start sm:self-auto"
        >
          <FileText className="w-4 h-4" />
          View Z-Reports (Finance Ledger)
        </Link>
      </div>

      <DataEncoderClient initialInvoices={invoices} />
    </div>
  );
}
