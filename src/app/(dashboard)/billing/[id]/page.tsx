import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/features/billing/utils";
import { AutoPrint } from "@/components/auto-print";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

export default async function InvoicePrintPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ print?: string }> }) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  
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
      </div>
    );
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: resolvedParams.id },
    include: {
      patient: true,
      items: true,
      payments: true,
    }
  });

  if (!invoice) return <div className="p-8">Invoice not found.</div>;

  const shouldAutoPrint = resolvedSearch.print === "true";

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-8 space-y-6">
      {shouldAutoPrint && <AutoPrint />}

      {/* Non-printable controls */}
      <div className="flex items-center justify-between print:hidden mb-6">
        <Link href="/billing" className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Billing
        </Link>
        <button 
          id="print-btn"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Printer className="w-4 h-4 mr-2" />
          <span>Print Receipt</span>
        </button>
      </div>

      {/* Printable Receipt */}
      <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0 text-slate-900">
        <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wider">Receipt</h1>
            <p className="text-sm text-slate-500 mt-1">Invoice #{invoice.id.slice(-8).toUpperCase()}</p>
            <p className="text-sm text-slate-500">{invoice.createdAt.toLocaleDateString()} {invoice.createdAt.toLocaleTimeString()}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-slate-900">Homicho Clinic</h2>
            <p className="text-sm text-slate-500">Addis Ababa, Ethiopia</p>
            <p className="text-sm text-slate-500">Tel: +251 911 223344</p>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Billed To</h3>
          <p className="text-base font-medium text-slate-900">{invoice.patient.firstName} {invoice.patient.lastName}</p>
          <p className="text-sm text-slate-600">ID: {invoice.patient.id.slice(-6).toUpperCase()}</p>
          {invoice.patient.contactNumber && <p className="text-sm text-slate-600">{invoice.patient.contactNumber}</p>}
        </div>

        <table className="w-full text-left mb-8">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-2 text-sm font-semibold text-slate-700">Description</th>
              <th className="py-2 text-right text-sm font-semibold text-slate-700">Qty</th>
              <th className="py-2 text-right text-sm font-semibold text-slate-700">Unit Price</th>
              <th className="py-2 text-right text-sm font-semibold text-slate-700">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map(item => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="py-3 text-sm text-slate-800">{item.description}</td>
                <td className="py-3 text-sm text-right text-slate-800">{item.quantity}</td>
                <td className="py-3 text-sm text-right text-slate-800">{formatCurrency(item.unitPrice)}</td>
                <td className="py-3 text-sm text-right text-slate-800 font-medium">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-3">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discountPercentApplied > 0 && (
              <div className="flex justify-between text-sm text-blue-600">
                <span>Discount ({invoice.discountPercentApplied}%)</span>
                <span>-{formatCurrency(invoice.subtotal - invoice.total)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-slate-900 border-t border-slate-200 pt-3">
              <span>Total</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {invoice.status === "paid" && invoice.payments.length > 0 && (
          <div className="bg-indigo-50 text-indigo-800 p-4 rounded-md border border-indigo-200 text-sm">
            <div className="font-bold mb-1 flex items-center uppercase tracking-wide">
              Ledger Cleared
            </div>
            <div>Cleared internally on {invoice.payments[0].createdAt.toLocaleDateString()}</div>
          </div>
        )}
        
        {invoice.status === "pending" && (
          <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md border border-yellow-200 text-sm font-bold uppercase tracking-wide">
            Pending Clearance
          </div>
        )}

      </div>
      
      {/* Small inline script to handle print click cleanly */}
      <script dangerouslySetInnerHTML={{__html: `document.getElementById('print-btn').addEventListener('click', function() { window.print(); })`}} />
    </div>
  );
}
