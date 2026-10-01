import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { CatalogForm } from "@/features/catalogs/components/catalog-form";
import { LabTestToggle } from "@/features/catalogs/components/lab-test-toggle";
import { EditableDrugRow } from "@/features/catalogs/components/editable-drug-row";
import { RemoveLabTestButton } from "@/features/catalogs/components/remove-labtest-button";
import { PrintButton } from "@/components/print-button";
import { PrintHeader } from "@/components/print-header";

export default async function CatalogsPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) redirect("/login");

  const role = session.user.role || "User";
  const userPermissions = ROLE_PERMISSIONS[role] || [];
  
  // Checking CATALOG_REQUEST or CATALOG_APPROVE
  const canRequest = userPermissions.includes(PERMISSIONS.CATALOG_REQUEST);
  const canApprove = userPermissions.includes(PERMISSIONS.CATALOG_APPROVE);

  if (!canRequest && !canApprove) {
    return (
      <div className="p-8 text-center text-red-600 dark:text-red-400">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p>You do not have permission to manage catalogs.</p>
      </div>
    );
  }

  const [drugs, labTests] = await Promise.all([
    prisma.drug.findMany({ orderBy: { name: "asc" } }),
    prisma.labTest.findMany({ orderBy: { name: "asc" } })
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 print:p-0 print:max-w-none print:space-y-4">
      <PrintHeader title="Master Pricing & Inventory Catalog" subtitle="Complete registry of drugs and lab tests with pricing." />

      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Catalog Management</h1>
          <p className="text-slate-500 dark:text-slate-400">Request or manage new drugs and lab tests.</p>
        </div>
        <div className="flex gap-3">
          {canApprove && (
            <a href="/catalogs/approvals" className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg shadow-sm font-medium transition-colors">
              Review Approvals
            </a>
          )}
          <PrintButton label="Print Catalogs" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:block print:space-y-10">
        
        {/* Drugs Section */}
        <div className="space-y-4 print:w-full print:break-inside-avoid">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Pharmacy Catalog (Drugs)</h2>
          <div className="print:hidden">
            <CatalogForm type="drug" />
          </div>
          
          <div className="bg-white dark:bg-slate-900 shadow rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden print:shadow-none print:border-none">
            <ul className="divide-y divide-slate-200 dark:divide-slate-800 max-h-96 overflow-y-auto print:max-h-none print:overflow-visible">
              {drugs.map(d => (
                <EditableDrugRow key={d.id} drug={d} />
              ))}
              {drugs.length === 0 && <li className="p-4 text-sm text-slate-500">No drugs found.</li>}
            </ul>
          </div>
        </div>

        {/* Lab Tests Section */}
        <div className="space-y-4 print:w-full print:break-inside-avoid print:mt-12">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Laboratory Catalog (Tests)</h2>
          <div className="print:hidden">
            <CatalogForm type="labTest" />
          </div>
          
          <div className="bg-white dark:bg-slate-900 shadow rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden print:shadow-none print:border-none">
            <ul className="divide-y divide-slate-200 dark:divide-slate-800 max-h-96 overflow-y-auto print:max-h-none print:overflow-visible">
              {labTests.map(t => (
                <li key={t.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 print:p-2 group">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium text-sm text-slate-900 dark:text-slate-100 mr-3">{t.name}</span>
                      <div className="print:hidden inline-block">
                        <LabTestToggle id={t.id} initialStatus={t.isOperational} />
                      </div>
                      {!t.isOperational && <span className="hidden print:inline-block text-red-500 text-xs ml-2">(Out of Service)</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-slate-500">{(t.price / 100).toFixed(2)} ETB</span>
                      <RemoveLabTestButton id={t.id} />
                    </div>
                  </div>
                  {t.description && <p className="text-xs text-slate-500 mt-2">{t.description}</p>}
                </li>
              ))}
              {labTests.length === 0 && <li className="p-4 text-sm text-slate-500">No tests found.</li>}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
