import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PaymentButton } from "@/features/billing/components/payment-button";
import { formatCurrency } from "@/features/billing/utils";
import { Pagination } from "@/components/pagination";
import { Download } from "lucide-react";

export default async function BillingDashboardPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || "1", 10);
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

  const [invoices, totalItems] = await Promise.all([
    prisma.invoice.findMany({
      include: {
        patient: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.invoice.count()
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Billing & Checkout</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage invoices, apply discounts, and process payments.</p>
        </div>
        
        <div className="flex gap-4">
          <a href="/api/export/billing" className="px-4 py-2 bg-slate-800 text-white font-medium rounded hover:bg-slate-700 shadow-sm text-sm flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </a>
          
          {userPermissions.includes(PERMISSIONS.INVOICE_CREATE) && (
            <a href="/billing/new" className="px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 shadow-sm text-sm">
              + Generate Invoice
            </a>
          )}
        </div>
      </div>

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
                      <span className="text-slate-400">View</span>
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
