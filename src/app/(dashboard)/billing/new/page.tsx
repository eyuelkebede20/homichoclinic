import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { InvoiceGeneratorForm } from "@/features/billing/components/invoice-generator-form";
import Link from "next/link";

export default async function NewInvoicePage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) redirect("/login");

  const role = session.user.role || "User";
  const userPermissions = ROLE_PERMISSIONS[role] || [];
  
  if (!userPermissions.includes(PERMISSIONS.INVOICE_CREATE)) {
    return (
      <div className="p-8 text-center text-red-600">
        <h2 className="text-2xl font-bold">Access Denied</h2>
      </div>
    );
  }

  const patients = await prisma.patient.findMany({
    take: 50,
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/billing" className="text-blue-600 hover:underline">&larr; Back to Billing</Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Generate Invoice</h1>
        <p className="text-slate-500 dark:text-slate-400">Select a patient and add line items for their visit.</p>
      </div>

      <InvoiceGeneratorForm patients={patients} />
    </div>
  );
}
