import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/features/billing/utils";
import { PrintButton } from "@/components/print-button";
import { PrintHeader } from "@/components/print-header";
import Link from "next/link";
import { getStartOfDayLocal } from "@/lib/date-utils";

export default async function BillingReportsPage(props: { searchParams: Promise<{ date?: string }> }) {
  const searchParams = await props.searchParams;
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) redirect("/login");

  const role = session.user.role || "User";
  const userPermissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
  
  if (!userPermissions.includes(PERMISSIONS.INVOICE_READ)) {
    return (
      <div className="p-8 text-center text-red-600">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p>You do not have permission to view billing reports.</p>
      </div>
    );
  }

  // Determine target date
  let targetDate = getStartOfDayLocal();
  if (searchParams.date) {
    const parsed = new Date(searchParams.date);
    if (!isNaN(parsed.getTime())) {
      targetDate = parsed;
    }
  }

  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Determine current month range
  const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
  const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);

  // Determine current year range
  const startOfYear = new Date(targetDate.getFullYear(), 0, 1);
  const endOfYear = new Date(targetDate.getFullYear(), 11, 31, 23, 59, 59, 999);

  // Fetch daily payments
  const dailyPayments = await prisma.payment.findMany({
    where: { createdAt: { gte: startOfDay, lte: endOfDay } },
    include: {
      invoice: {
        include: { patient: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  // Calculate daily totals
  let dailyTotal = 0;
  const methodTotals: Record<string, number> = { cash: 0, card: 0, transfer: 0 };
  
  // Sort payments based on patient discount as requested (highest discount first)
  dailyPayments.sort((a, b) => b.invoice.discountPercentApplied - a.invoice.discountPercentApplied);

  for (const p of dailyPayments) {
    dailyTotal += p.amount;
    methodTotals[p.method] = (methodTotals[p.method] || 0) + p.amount;
  }

  // Fetch Monthly aggregates
  const monthlyAgg = await prisma.payment.aggregate({
    where: { createdAt: { gte: startOfMonth, lte: endOfMonth } },
    _sum: { amount: true }
  });

  // Fetch Yearly aggregates
  const yearlyAgg = await prisma.payment.aggregate({
    where: { createdAt: { gte: startOfYear, lte: endOfYear } },
    _sum: { amount: true }
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 print:p-0 print:max-w-none">
      <PrintHeader title="Cashier Shift Reconciliation (Z-Report)" subtitle={`Date: ${startOfDay.toLocaleDateString()}`} />
      
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Billing Reports & Reconciliation</h1>
          <p className="text-slate-500 dark:text-slate-400">Z-Reports, Shift Summaries, and Audits</p>
        </div>
        <div className="flex gap-3">
          <Link href="/billing" className="text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-md transition-colors">
            &larr; Back to Billing
          </Link>
          <PrintButton label="Print Z-Report" />
        </div>
      </div>

      {/* Date Picker Form (Hidden in print) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow border border-slate-200 dark:border-slate-800 print:hidden flex items-center gap-4">
        <form className="flex items-end gap-4" method="GET">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Select Date</label>
            <input 
              type="date" 
              name="date" 
              defaultValue={targetDate.toISOString().split("T")[0]}
              className="block rounded border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-sm" 
            />
          </div>
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors">
            Load Report
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-blue-200 dark:border-blue-800 text-center">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Today&apos;s Total (Z-Report)</h3>
          <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(dailyTotal)}</p>
          <div className="mt-4 flex justify-between text-xs text-slate-600 dark:text-slate-400 px-4">
            <span>Cash: {formatCurrency(methodTotals.cash)}</span>
            <span>Card: {formatCurrency(methodTotals.card)}</span>
            <span>Bank: {formatCurrency(methodTotals.transfer)}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-slate-200 dark:border-slate-800 text-center">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Month to Date</h3>
          <p className="text-4xl font-bold text-slate-700 dark:text-slate-300">{formatCurrency(monthlyAgg._sum.amount || 0)}</p>
          <p className="text-xs text-slate-500 mt-2">{startOfMonth.toLocaleDateString()} - {endOfMonth.toLocaleDateString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-slate-200 dark:border-slate-800 text-center">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Year to Date</h3>
          <p className="text-4xl font-bold text-slate-700 dark:text-slate-300">{formatCurrency(yearlyAgg._sum.amount || 0)}</p>
          <p className="text-xs text-slate-500 mt-2">Fiscal Year {startOfYear.getFullYear()}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 shadow rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Daily Patient Signatures (Reconciliation)</h2>
          <p className="text-xs text-slate-500 mt-1">Verify physical signatures against the system collected amounts. Sorted by discount tier.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Patient Name</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Discount</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Amount Paid</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-48">Hardcopy Signature</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
              {dailyPayments.map(payment => (
                <tr key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                    {payment.invoice.patient.firstName} {payment.invoice.patient.lastName}
                    <div className="text-xs text-slate-500 font-normal">{payment.createdAt.toLocaleTimeString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-500">
                    {payment.invoice.discountPercentApplied > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        {payment.invoice.discountPercentApplied}% OFF
                      </span>
                    ) : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500 capitalize">
                    {payment.method}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="h-8 border-b-2 border-dotted border-slate-400 dark:border-slate-600 w-32 mx-auto"></div>
                  </td>
                </tr>
              ))}
              {dailyPayments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No payments recorded for this date.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end print:flex hidden">
        <div className="text-center w-64">
          <div className="h-10 border-b border-black dark:border-white mb-2"></div>
          <p className="text-sm font-bold">Cashier Signature</p>
        </div>
        <div className="text-center w-64">
          <div className="h-10 border-b border-black dark:border-white mb-2"></div>
          <p className="text-sm font-bold">Manager/Auditor Signature</p>
        </div>
      </div>
    </div>
  );
}
