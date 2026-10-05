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
import { ExpandablePatientRow } from "./expandable-row";
import { ReportFilters } from "./report-filters";
import { ExportExcelButton } from "./export-excel-button";

import { EthDateTime } from 'ethiopian-calendar-date-converter';

const ETH_MONTHS = [
  "Meskerem", "Tikimt", "Hidar", "Tahsas", "Tir", "Yekatit",
  "Megabit", "Miyazya", "Ginbot", "Sene", "Hamle", "Nehase", "Pagume"
];

export default async function BillingReportsPage(props: { searchParams: Promise<{ ethYear?: string, ethMonth?: string, ethDay?: string }> }) {
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

  // Determine current Ethiopian date to use as default
  const todayEth = EthDateTime.fromEuropeanDate(new Date());
  
  const ethYear = searchParams.ethYear ? parseInt(searchParams.ethYear) : todayEth.year;
  const ethMonth = searchParams.ethMonth ? parseInt(searchParams.ethMonth) : todayEth.month;
  const ethDay = searchParams.ethDay ? parseInt(searchParams.ethDay) : null;
  
  let startOfRange: Date;
  let endOfRange: Date;
  let reportType = "Daily";
  let displayDate = "";

  if (ethDay) {
    reportType = "Daily";
    // Construct local range for the specific day
    const dateObj = new EthDateTime(ethYear, ethMonth, ethDay).toEuropeanDate();
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    
    startOfRange = new Date(`${y}-${m}-${d}T00:00:00+03:00`);
    endOfRange = new Date(`${y}-${m}-${d}T23:59:59.999+03:00`);
    displayDate = `${ETH_MONTHS[ethMonth - 1]} ${ethDay}, ${ethYear}`;
  } else {
    reportType = "Monthly";
    // Month starts at day 1
    const startDateObj = new EthDateTime(ethYear, ethMonth, 1).toEuropeanDate();
    const sy = startDateObj.getFullYear();
    const sm = String(startDateObj.getMonth() + 1).padStart(2, '0');
    const sd = String(startDateObj.getDate()).padStart(2, '0');
    startOfRange = new Date(`${sy}-${sm}-${sd}T00:00:00+03:00`);
    
    // End of month: Month has 30 days (unless pagume, handled safely by max 6)
    const endDay = ethMonth === 13 ? 6 : 30; // Overshooting pagume gives next month, so limit it
    const endDateObj = new EthDateTime(ethYear, ethMonth, endDay).toEuropeanDate();
    const ey = endDateObj.getFullYear();
    const em = String(endDateObj.getMonth() + 1).padStart(2, '0');
    const ed = String(endDateObj.getDate()).padStart(2, '0');
    endOfRange = new Date(`${ey}-${em}-${ed}T23:59:59.999+03:00`);
    
    displayDate = `${ETH_MONTHS[ethMonth - 1]} ${ethYear}`;
  }

  // Fetch Invoices (Credit Charges) for the period
  const invoices = await prisma.invoice.findMany({
    where: { 
      createdAt: { gte: startOfRange, lte: endOfRange },
      status: { in: ["sent_to_finance", "pending", "paid"] } 
    },
    include: {
      patient: true,
      items: true
    },
    orderBy: { createdAt: "desc" }
  });

  // Aggregate by Patient
  const patientAggregates = new Map<string, {
    patient: any;
    totalAmount: number;
    invoices: any[];
  }>();

  let grandTotal = 0;

  for (const inv of invoices) {
    grandTotal += inv.total;
    if (!patientAggregates.has(inv.patientId)) {
      patientAggregates.set(inv.patientId, {
        patient: inv.patient,
        totalAmount: 0,
        invoices: []
      });
    }
    const agg = patientAggregates.get(inv.patientId)!;
    agg.totalAmount += inv.total;
    agg.invoices.push(inv);
  }

  const sortedPatients = Array.from(patientAggregates.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  
  const reportTitle = `Finance ${reportType} Credit Report`;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 print:p-0 print:max-w-none">
      <PrintHeader title={reportTitle} subtitle={`Period: ${displayDate} EC`} />
      
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Finance & Z-Reports</h1>
          <p className="text-slate-500 dark:text-slate-400">Payroll deduction credit reports per patient.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard" className="text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-md transition-colors">
            &larr; Back to Dashboard
          </Link>
          <ExportExcelButton patients={sortedPatients} reportName={`${reportType} Report - ${displayDate}`} />
          <PrintButton label="Print Report" />
        </div>
      </div>

      {/* Date Picker Form (Hidden in print) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow border border-slate-200 dark:border-slate-800 print:hidden flex items-center justify-between">
        <ReportFilters 
          defaultYear={ethYear}
          defaultMonth={ethMonth}
          defaultDay={ethDay}
        />
      </div>

      {/* Totals Section */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6 print:grid-cols-1 print:gap-4">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-lg shadow border border-indigo-200 dark:border-indigo-800 text-center">
          <h3 className="text-lg font-medium text-indigo-700 dark:text-indigo-400">Total Credit Expenses ({reportType})</h3>
          <p className="mt-2 text-4xl font-bold text-indigo-900 dark:text-indigo-300">{formatCurrency(grandTotal)}</p>
          <p className="text-sm text-indigo-600 mt-2">{sortedPatients.length} Patients</p>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow border border-slate-200 dark:border-slate-800 overflow-hidden print:shadow-none print:border-none print:overflow-visible">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Patient Expense Summary</h2>
          <span className="text-sm text-slate-500">Click a row to expand details</span>
        </div>
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-950">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-8"></th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Patient Name</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Employee ID</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Invoices</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Total Expense</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
              {sortedPatients.map((agg, idx) => (
                <ExpandablePatientRow key={agg.patient.id} agg={agg} index={idx} />
              ))}
              {sortedPatients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No expenses recorded for this period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}