import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { CatalogForm } from "@/features/catalogs/components/catalog-form";
import { EditableDrugRow } from "@/features/catalogs/components/editable-drug-row";
import { PrintButton } from "@/components/print-button";
import { PrintHeader } from "@/components/print-header";

export default async function PharmacyCatalogPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) redirect("/login");

  const role = session.user.role || "User";
  const userPermissions = ROLE_PERMISSIONS[role] || [];
  
  // Checking CATALOG_REQUEST or CATALOG_APPROVE
  const canRequest = userPermissions.includes(PERMISSIONS.CATALOG_REQUEST);
  const canApprove = userPermissions.includes(PERMISSIONS.CATALOG_APPROVE);

  if (!canRequest && !canApprove && role !== "Pharmacy" && role !== "Admin" && role !== "Manager") {
    return (
      <div className="p-8 text-center text-red-600 dark:text-red-400">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p>You do not have permission to manage catalogs.</p>
      </div>
    );
  }

  const drugs = await prisma.drug.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 print:p-0 print:max-w-none print:space-y-4">
      <PrintHeader title="Pharmacy Catalog" subtitle="Registry of drugs with pricing." />

      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Pharmacy Catalog</h1>
          <p className="text-slate-500 dark:text-slate-400">Request or manage new drugs and prices.</p>
        </div>
        <div className="flex gap-3">
          {canApprove && (
            <a href="/catalogs/approvals" className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg shadow-sm font-medium transition-colors">
              Review Approvals
            </a>
          )}
          <PrintButton label="Print Catalog" />
        </div>
      </div>

      <div className="max-w-3xl space-y-4 print:w-full print:break-inside-avoid">
        <div className="print:hidden">
          <CatalogForm type="drug" />
        </div>
        
        <div className="bg-white dark:bg-slate-900 shadow rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden print:shadow-none print:border-none">
          <ul className="divide-y divide-slate-200 dark:divide-slate-800 max-h-screen overflow-y-auto print:max-h-none print:overflow-visible">
            {drugs.map(d => (
              <EditableDrugRow key={d.id} drug={d} />
            ))}
            {drugs.length === 0 && <li className="p-4 text-sm text-slate-500">No drugs found.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
