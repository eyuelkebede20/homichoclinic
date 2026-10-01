import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { DispenseButton } from "@/features/pharmacy/components/dispense-button";
import { InventoryManager } from "@/features/pharmacy/components/inventory-manager";
import { PrintReceiptButton } from "@/features/pharmacy/components/print-receipt-button";
import { Search } from "lucide-react";
import { NotificationPing } from "@/components/notification-ping";

export default async function PharmacyDashboardPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";

  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role || "User";
  const userPermissions = ROLE_PERMISSIONS[role] || [];
  
  if (!userPermissions.includes(PERMISSIONS.INVENTORY_READ)) {
    return (
      <div className="p-8 text-center text-red-600">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p>You do not have permission to access the pharmacy module.</p>
      </div>
    );
  }

  const canDispense = userPermissions.includes(PERMISSIONS.PRESCRIPTION_DISPENSE);

  // Fetch all drugs and aggregate their stock
  const drugs = await prisma.drug.findMany({
    include: {
      batches: {
        where: { quantity: { gt: 0 } }
      }
    }
  });

  // Auto-remove pings after a week (7 days) for pending items
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const whereClause: any = {
    OR: [
      { status: "dispensed" },
      { status: "pending", createdAt: { gte: oneWeekAgo } }
    ]
  };

  if (query) {
    whereClause.patient = {
      OR: [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
      ]
    };
  }

  // Fetch prescriptions
  const prescriptions = await prisma.prescription.findMany({
    where: whereClause,
    include: {
      patient: true,
      items: {
        include: { drug: true }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  const pendingPrescriptions = prescriptions.filter(rx => rx.status === "pending");
  const dispensedPrescriptions = prescriptions.filter(rx => rx.status === "dispensed");

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <NotificationPing endpoint="/api/polling/pharmacy" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Pharmacy & Inventory
            {pendingPrescriptions.length > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                {pendingPrescriptions.length} New
              </span>
            )}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Manage stock batches, dispense medications, and print receipts.</p>
        </div>

        <form className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input 
            name="q"
            defaultValue={query}
            type="text" 
            placeholder="Search patient prescriptions..." 
            className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-blue-500 focus:border-blue-500"
          />
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Prescriptions Queue */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 shadow rounded-lg border border-slate-200 dark:border-slate-800 p-6 flex flex-col h-[600px]">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Pending Prescriptions</h2>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {pendingPrescriptions.length === 0 ? (
                <p className="text-sm text-slate-500">No pending prescriptions.</p>
              ) : (
                pendingPrescriptions.map((rx) => (
                  <div key={rx.id} className="border border-slate-200 dark:border-slate-700 rounded-md p-4 bg-slate-50 dark:bg-slate-950">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {rx.patient.firstName} {rx.patient.lastName}
                      </span>
                      <span className="text-xs text-slate-500">{rx.createdAt.toLocaleDateString()}</span>
                    </div>
                    <ul className="text-sm text-slate-600 dark:text-slate-400 mb-4 list-disc pl-5">
                      {rx.items.map(item => (
                        <li key={item.id}>
                          {item.drug.name} - Qty: {item.quantity} ({item.instructions})
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-3">
                      {canDispense && <DispenseButton prescriptionId={rx.id} />}
                      <PrintReceiptButton prescriptionId={rx.id} />
                    </div>
                  </div>
                ))
              )}
              
              {/* Recently Dispensed */}
              {dispensedPrescriptions.length > 0 && (
                <>
                  <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">Recently Dispensed</h3>
                  {dispensedPrescriptions.slice(0, 5).map((rx) => (
                    <div key={rx.id} className="border border-green-200 dark:border-green-900/30 rounded-md p-4 bg-green-50 dark:bg-green-900/10 opacity-75">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-slate-800 dark:text-slate-300">
                          {rx.patient.firstName} {rx.patient.lastName} <span className="text-green-600 text-xs font-bold ml-2">(Dispensed)</span>
                        </span>
                        <span className="text-xs text-slate-500">{rx.updatedAt.toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-end mt-2">
                        <PrintReceiptButton prescriptionId={rx.id} />
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Inventory Overview / Search */}
        <InventoryManager drugs={drugs} />

      </div>
    </div>
  );
}
