import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { CatalogForm } from "@/features/catalogs/components/catalog-form";
import { EditableDrugRow } from "@/features/catalogs/components/editable-drug-row";
import { CatalogImporter } from "@/features/catalogs/components/catalog-importer";
import { PrintButton } from "@/components/print-button";
import { PrintHeader } from "@/components/print-header";
import { CatalogSearch } from "@/features/catalogs/components/catalog-search";

export default async function PharmacyCatalogPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";

  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) redirect("/login");

  const role = session.user.role || "User";
  const userPermissions = ROLE_PERMISSIONS[role] || [];
  
  const canApprove = userPermissions.includes(PERMISSIONS.CATALOG_APPROVE) || ["Admin", "Manager"].includes(role);
  const isPharmacy = role === "Pharmacy";

  if (!canApprove && !isPharmacy) {
    return (
      <div className="p-8 text-center text-red-600 dark:text-red-400">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p>You do not have permission to view or manage the Pharmacy Catalog.</p>
      </div>
    );
  }

  const drugs = await prisma.drug.findMany({ 
    where: query ? { name: { contains: query, mode: "insensitive" } } : {},
    orderBy: { name: "asc" },
    include: {
      batches: {
        orderBy: { dateAddedToStock: 'desc' }
      }
    }
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 print:p-0 print:max-w-none print:space-y-4">
      <PrintHeader title="Pharmacy Catalog" subtitle="Registry of drugs with pricing." />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center print:hidden gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Pharmacy Catalog</h1>
          <p className="text-slate-500 dark:text-slate-400">Request or manage new drugs and prices.</p>
        </div>
        <div className="flex gap-3">

          <PrintButton label="Print Catalog" />
        </div>
      </div>

      <div className="max-w-6xl w-full mx-auto space-y-4 print:w-full print:break-inside-avoid">
        <div className="print:hidden">
          <CatalogSearch defaultValue={query} />
        </div>

        <div className="print:hidden space-y-4">
          <CatalogImporter type="DRUG" />
          <CatalogForm type="drug" />
        </div>
        
        <div className="bg-white dark:bg-slate-900/50 shadow-sm rounded-xl border border-slate-200 dark:border-slate-800/60 overflow-x-auto print:shadow-none print:border-none">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Batch No</th>
                <th className="px-4 py-3 font-medium">Expiry</th>
                <th className="px-4 py-3 font-medium">Date Added</th>
                <th className="px-4 py-3 font-medium">Doc No</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium text-right print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {drugs.map(d => (
                <EditableDrugRow key={d.id} drug={d} />
              ))}
              {drugs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500">
                    No drugs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
