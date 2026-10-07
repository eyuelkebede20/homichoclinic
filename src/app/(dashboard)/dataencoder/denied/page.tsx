import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DeniedDashboard } from "@/features/clinical/components/denied-dashboard";

export default async function DeniedRecordsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) {
    redirect("/login");
  }

  const role = session.user.role || "User";
  if (role !== "Dataencoder" && !["Admin", "Manager"].includes(role)) {
    redirect("/dashboard");
  }

  const deniedVisits = await prisma.visit.findMany({
    where: { status: "denied" },
    include: { patient: true },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Denied Records</h1>
        <p className="text-slate-500 mt-2">Manage records that were denied during the billing review.</p>
      </div>
      <DeniedDashboard visits={deniedVisits} />
    </div>
  );
}
