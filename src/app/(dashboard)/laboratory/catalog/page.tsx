import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { CatalogForm } from "@/features/catalogs/components/catalog-form";
import { LabTestToggle } from "@/features/catalogs/components/lab-test-toggle";
import { RemoveLabTestButton } from "@/features/catalogs/components/remove-labtest-button";
import { CatalogImporter } from "@/features/catalogs/components/catalog-importer";
import { PrintButton } from "@/components/print-button";
import { PrintHeader } from "@/components/print-header";

export default async function LaboratoryCatalogPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";

  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) redirect("/login");

  const role = session.user.role || "User";
  const userPermissions = ROLE_PERMISSIONS[role] || [];
  
  const canApprove = userPermissions.includes(PERMISSIONS.CATALOG_APPROVE) || ["Admin", "Manager"].includes(role);
  const isLab = role === "Laboratory";

  if (!canApprove && !isLab) {
    return (
      <div className="p-8 text-center text-red-600 dark:text-red-400">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p>You do not have permission to view or manage the Lab Catalog.</p>
      </div>
    );
  }

  const labTests = await prisma.labTest.findMany({ 
    where: query ? { name: { contains: query, mode: "insensitive" } } : {},
    orderBy: { name: "asc" } 
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 print:p-0 print:max-w-none print:space-y-4">
      <PrintHeader title="Laboratory Catalog" subtitle="Registry of lab tests with pricing." />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center print:hidden gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Laboratory Catalog</h1>
          <p className="text-slate-500 dark:text-slate-400">Request or manage new lab tests and prices.</p>
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
          <form className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              name="q"
              defaultValue={query}
              type="text"
              placeholder="Search tests by name..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </form>
        </div>

        <div className="print:hidden space-y-4">
          <CatalogImporter type="LAB_TEST" />
          <CatalogForm type="labTest" />
        </div>
        
        <div className="bg-white dark:bg-slate-900/50 shadow-sm rounded-xl border border-slate-200 dark:border-slate-800/60 overflow-hidden print:shadow-none print:border-none">
          <ul className="divide-y divide-slate-200 dark:divide-slate-800 max-h-screen overflow-y-auto print:max-h-none print:overflow-visible">
            {labTests.map(t => (
              <li key={t.id} className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 print:p-2 group ${!t.isOperational ? "opacity-70 bg-slate-50 dark:bg-slate-800/20" : ""}`}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="print:hidden flex items-center">
                      <LabTestToggle id={t.id} initialStatus={t.isOperational} />
                    </div>
                    <div>
                      <span className={`font-medium text-sm mr-3 ${!t.isOperational ? "line-through text-slate-500 dark:text-slate-400" : "text-slate-900 dark:text-slate-100"}`}>{t.name}</span>
                      {!t.isOperational && <span className="hidden print:inline-block text-red-500 text-xs ml-2">(Out of Service)</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-mono text-slate-500 w-20 text-right">{(t.price / 100).toFixed(2)} ETB</span>
                    <RemoveLabTestButton id={t.id} />
                  </div>
                </div>
                {t.description && <p className="text-xs text-slate-500 mt-2 ml-11">{t.description}</p>}
              </li>
            ))}
            {labTests.length === 0 && <li className="p-4 text-sm text-slate-500">No tests found.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
