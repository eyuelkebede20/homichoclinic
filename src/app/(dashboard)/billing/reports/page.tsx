import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/features/billing/utils";
import { PrintButton } from "@/components/print-button";
import { PrintHeader } from "@/components/print-header";
import Link from "next/link";
import { getStartOfDayLocal, getEndOfDayLocal } from "@/lib/date-utils";

export default async function BillingReportsPage(props: { searchParams: Promise<{ date?: string, sort?: string }> }) {
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

  // Determine target date using safe local timezone utils
  let startOfDay = getStartOfDayLocal();
  let endOfDay = getEndOfDayLocal();
  
  if (searchParams.date) {
    const parts = searchParams.date.split("-");
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];
      // Construct explicitly with clinic timezone (+03:00)
      startOfDay = new Date("${year}--T00:00:00+03:00");
      endOfDay = new Date("${year}--T23:59:59.999+03:00");
    }
  }

  // Determine current month range
  const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);
  const endOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth() + 1, 0, 23, 59, 59, 999);

  // Determine current year range
  const startOfYear = new Date(startOfDay.getFullYear(), 0, 1);
  const endOfYear = new Date(startOfDay.getFullYear(), 11, 31, 23, 59, 59, 999);

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
  
  // Sort logic based on search params
  const isSortByDiscount = searchParams.sort === "discount";
  if (isSortByDiscount) {
    dailyPayments.sort((a, b) => b.invoice.discountPercentApplied - a.invoice.discountPercentApplied);
  }

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
      <PrintHeader title="Cashier Shift Reconciliation (Z-Report)" subtitle={"Date: "} />
      
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
      <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow border border-slate-200 dark:border-slate-800 print:hidden flex items-center justify-between">
        <form className="flex items-end gap-4" method="GET">
          <input type="hidden" name="sort" value={searchParams.sort || ""} />
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Select Date</label>
            <input 
              type="date" 
              name="date" 
              defaultValue={startOfDay.toISOString().split("T")[0]}
              className="block rounded border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-sm" 
            />
          </div>
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors">
            Load Report
          </button>
        </form>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Sort by:</span>
          <Link 
            href={"?date=&sort=time"} 
            className={"text-sm px-3 py-1 rounded-md "}
          >
            Time
          </Link>
          <Link 
            href={"?date=&sort=discount"} 
            className={"text-sm px-3 py-1 rounded-md "}
          >
            Discount %
          </Link>
        </div>
      </div>

      {/* Totals Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 print:grid-cols-4 print:gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Daily Cash</h3>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(methodTotals.cash || 0)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Daily Card</h3>
          <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(methodTotals.card || 0)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Daily Transfer</h3>
          <p className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(methodTotals.transfer || 0)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10">
          <h3 className="text-sm font-medium text-indigo-700 dark:text-indigo-400">Total Daily Revenue</h3>
          <p className="mt-2 text-2xl font-bold text-indigo-900 dark:text-indigo-300">{formatCurrency(dailyTotal)}</p>
        </div>
      </div>

      <div className="flex gap-6 print:hidden">
        <div className="text-sm text-slate-500">
          MTD Revenue: <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(monthlyAgg._sum.amount || 0)}</span>
        </div>
        <div className="text-sm text-slate-500">
          YTD Revenue: <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(yearlyAgg._sum.amount || 0)}</span>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Shift Activity Ledger</h2>
          <span className="text-sm text-slate-500">{dailyPayments.length} transactions</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
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