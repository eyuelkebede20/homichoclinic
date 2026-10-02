import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PaymentButton } from "@/features/billing/components/payment-button";
import { formatCurrency } from "@/features/billing/utils";
import { Pagination } from "@/components/pagination";
import { Download } from "lucide-react";

export default async function BillingDashboardPage({ searchParams }: { searchParams: Promise<{ page?: string, search?: string }> }) {
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || "1", 10);
  const search = resolvedParams.search || "";
  const PAGE_SIZE = 20;

  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) redirect("/login");

  const role = session.user.role || "User";
  const userPermissions = ROLE_PERMISSIONS[role] || [];
  
  if (!userPermissions.includes(PERMISSIONS.INVOICE_READ)) {
    return (
      <div className="p-8 text-center text-red-600">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p>You do not have permission to view billing data.</p>
      </div>
    );
  }

  const canTakePayment = userPermissions.includes(PERMISSIONS.PAYMENT_CREATE);

  const patientWhere = search ? {
    OR: [
      { firstName: { contains: search, mode: "insensitive" as const } },
      { lastName: { contains: search, mode: "insensitive" as const } },
      { contactNumber: { contains: search, mode: "insensitive" as const } },
    ]
  } : undefined;

  const [invoices, totalItems, unbilledVisits, unbilledLabRequests, unbilledPrescriptions] = await Promise.all([
    prisma.invoice.findMany({
      where: patientWhere ? { patient: patientWhere } : undefined,
      include: {
        patient: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.invoice.count({
      where: patientWhere ? { patient: patientWhere } : undefined,
    }),
    prisma.visit.findMany({
      where: patientWhere ? { invoiceId: null, patient: patientWhere } : { invoiceId: null },
      include: { patient: true }
    }),
    prisma.labRequest.findMany({
      where: patientWhere ? { invoiceId: null, patient: patientWhere } : { invoiceId: null },
      include: { patient: true, test: true }
    }),
    prisma.prescriptionItem.findMany({
      where: patientWhere ? { invoiceId: null, prescription: { patient: patientWhere } } : { invoiceId: null },
      include: { prescription: { include: { patient: true } }, drug: true }
    })
  ]);

  // Group unbilled items by patient
  const unbilledByPatient = new Map<string, { patient: import('@prisma/client').Patient, items: import('@prisma/client').Prisma.LabRequestGetPayload<Record<string, never>>[] }>();
  
  const getPatientGroup = (patient: { id: string; patientType?: string | null } | null) => {
    if (!patient) return null;
    if (!unbilledByPatient.has(patient.id)) {
      unbilledByPatient.set(patient.id, {
        patient,
        visits: [],
        labRequests: [],
        prescriptions: []
      });
    }
    return unbilledByPatient.get(patient.id);
  };

  unbilledVisits.forEach(v => getPatientGroup(v.patient).visits.push(v));
  unbilledLabRequests.forEach(l => getPatientGroup(l.patient).labRequests.push(l));
  unbilledPrescriptions.forEach(p => getPatientGroup(p.prescription.patient).prescriptions.push(p));

  const unbilledQueue = Array.from(unbilledByPatient.values());

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Billing & Checkout</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage invoices, apply discounts, and process payments.</p>
        </div>
        
        <div className="flex gap-4 items-center">
          <form action="/billing" method="GET" className="flex">
            <input 
              type="text" 
              name="search" 
              placeholder="Search by name or phone..." 
              defaultValue={search}
              className="px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-950 rounded-l-md text-sm w-64 focus:outline-none focus:ring-1 focus:ring-blue-500" 
            />
            <button type="submit" className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border-y border-r border-slate-300 dark:border-slate-700 rounded-r-md text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
              Search
            </button>
          </form>

          <Link href="/billing/reports" className="px-4 py-2 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700 shadow-sm text-sm">
            Z-Reports
          </Link>
          <a href="/api/export/billing" className="px-4 py-2 bg-slate-800 text-white font-medium rounded hover:bg-slate-700 shadow-sm text-sm flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export CSV</a>
          {userPermissions.includes(PERMISSIONS.INVOICE_CREATE) && (
            <Link href="/billing/new" className="px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 shadow-sm text-sm">
              + Generate Invoice
            </Link>
          )}
        </div>
      </div>

      {unbilledQueue.length > 0 && (
        <div className="bg-white dark:bg-slate-900 shadow rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col mb-8">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border-b border-yellow-200 dark:border-yellow-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-yellow-800 dark:text-yellow-500">Action Required: Unbilled Patient Activity</h2>
              <p className="text-sm text-yellow-700 dark:text-yellow-600">The following patients have pending charges (visits, labs, or prescriptions) that need to be invoiced.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-950">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Pending Items</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                {unbilledQueue.map(group => (
                  <tr key={group.patient.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                      {group.patient.firstName} {group.patient.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                      <div className="flex gap-2 flex-wrap">
                        {group.visits.length > 0 && <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-300">{group.visits.length} Visit(s)</span>}
                        {group.labRequests.length > 0 && <span className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900/30 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:text-purple-300">{group.labRequests.length} Lab Test(s)</span>}
                        {group.prescriptions.length > 0 && <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-300">{group.prescriptions.length} Drug(s)</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end">
                      {userPermissions.includes(PERMISSIONS.INVOICE_CREATE) && (
                        <form action={`/api/billing/generate-auto-invoice?patientId=${group.patient.id}`} method="POST">
                          <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 shadow-sm text-xs">
                            Generate Invoice
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 shadow rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Patient</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Subtotal</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Discount Applied</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Total</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
              {invoices.map(invoice => (
                <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {invoice.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                    {invoice.patient.firstName} {invoice.patient.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 text-right">
                    {formatCurrency(invoice.subtotal)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400 text-right">
                    {invoice.discountPercentApplied}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-slate-100 text-right">
                    {formatCurrency(invoice.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    {invoice.status === "paid" ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-300">
                        Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:text-yellow-300">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end">
                    {invoice.status === "pending" && canTakePayment ? (
                      <PaymentButton invoiceId={invoice.id} amountStr={formatCurrency(invoice.total)} />
                    ) : (
                        <Link href={`/billing/${invoice.id}`} className="text-blue-600 hover:underline">View</Link>
                    )}
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                    No invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalItems > 0 && (
          <Pagination 
            currentPage={page} 
            totalItems={totalItems} 
            pageSize={PAGE_SIZE} 
            baseUrl="/billing" 
          />
        )}
      </div>
    </div>
  );
}
