import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { DispenseButton } from "@/features/pharmacy/components/dispense-button";
import { CancelPrescriptionButton } from "@/features/pharmacy/components/cancel-prescription-button";
import { InventoryManager } from "@/features/pharmacy/components/inventory-manager";
import { PrintReceiptButton } from "@/features/pharmacy/components/print-receipt-button";
import { NotificationPing } from "@/components/notification-ping";
import { PrintButton } from "@/components/print-button";
import { PrintHeader } from "@/components/print-header";
import {
  Search,
  Pill,
  ClipboardList,
  PackageCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default async function PharmacyDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

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

  const drugs = await prisma.drug.findMany({
    include: { batches: { orderBy: { createdAt: "desc" } } },
  });

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const whereClause: import("@prisma/client").Prisma.PrescriptionWhereInput = {
    OR: [
      { status: "dispensed" },
      { status: "pending", createdAt: { gte: oneWeekAgo } },
    ],
  };

  if (query) {
    whereClause.patient = {
      OR: [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
      ],
    };
  }

  const prescriptions = await prisma.prescription.findMany({
    where: whereClause,
    include: { patient: true, items: { include: { drug: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const pendingPrescriptions = prescriptions.filter((rx) => rx.status === "pending");
  const dispensedToday = prescriptions.filter((rx) => {
    if (rx.status !== "dispensed") return false;
    const today = new Date();
    const d = new Date(rx.updatedAt);
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  });

  const outOfStockCount = drugs.filter((d) =>
    d.batches.reduce((s, b) => s + b.quantity, 0) === 0
  ).length;

  const lowStockCount = drugs.filter((d) => {
    const total = d.batches.reduce((s, b) => s + b.quantity, 0);
    return total > 0 && total <= 10;
  }).length;

  const totalDrugs = drugs.length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 print:bg-white">
      <NotificationPing endpoint="/api/polling/pharmacy" />
      <PrintHeader
        title="Pharmacy & Inventory Report"
        subtitle="Current stock levels and prescriptions"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6 print:p-0 print:max-w-none">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg shadow-sm shadow-blue-200 dark:shadow-blue-900/40">
                <Pill className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Pharmacy
                  {pendingPrescriptions.length > 0 && (
                    <span className="ml-2 inline-flex items-center bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                      {pendingPrescriptions.length} Pending
                    </span>
                  )}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Dispense medications, manage batches, and track stock.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <form className="relative flex-1 md:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                name="q"
                defaultValue={query}
                type="text"
                placeholder="Search patient prescriptions…"
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              />
            </form>
            <PrintButton label="Print" />
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
          <StatCard
            icon={<ClipboardList className="w-5 h-5" />}
            label="Pending"
            value={pendingPrescriptions.length}
            color="blue"
            urgent={pendingPrescriptions.length > 0}
          />
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            label="Dispensed Today"
            value={dispensedToday.length}
            color="green"
          />
          <StatCard
            icon={<PackageCheck className="w-5 h-5" />}
            label="Total Drugs"
            value={totalDrugs}
            color="slate"
          />
          <StatCard
            icon={<AlertTriangle className="w-5 h-5" />}
            label="Stock Issues"
            value={outOfStockCount + lowStockCount}
            sublabel={outOfStockCount > 0 ? `${outOfStockCount} out of stock` : `${lowStockCount} low`}
            color="amber"
            urgent={outOfStockCount > 0}
          />
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:block">

          {/* Prescriptions Queue */}
          <div className="flex flex-col gap-4 print:hidden">

            {/* Pending */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wide">
                    Pending Prescriptions
                  </h2>
                </div>
                {pendingPrescriptions.length > 0 && (
                  <span className="text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full">
                    {pendingPrescriptions.length} queued
                  </span>
                )}
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[420px] overflow-y-auto">
                {pendingPrescriptions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-slate-400 gap-2">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                    <p className="text-sm font-medium">Queue is clear</p>
                    {query && (
                      <p className="text-xs">No match for &ldquo;{query}&rdquo;</p>
                    )}
                  </div>
                ) : (
                  pendingPrescriptions.map((rx) => (
                    <PrescriptionCard
                      key={rx.id}
                      rx={rx}
                      canDispense={canDispense}
                      variant="pending"
                    />
                  ))
                )}
              </div>
            </div>

            {/* Recently Dispensed */}
            {dispensedToday.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wide">
                      Dispensed Today
                    </h2>
                  </div>
                  <span className="text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full">
                    {dispensedToday.length} done
                  </span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[260px] overflow-y-auto">
                  {dispensedToday.slice(0, 8).map((rx) => (
                    <PrescriptionCard key={rx.id} rx={rx} canDispense={false} variant="dispensed" />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Inventory */}
          <InventoryManager drugs={drugs} />
        </div>
      </div>
    </div>
  );
}

/* ── Stat Card ── */
function StatCard({
  icon,
  label,
  value,
  sublabel,
  color,
  urgent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sublabel?: string;
  color: "blue" | "green" | "amber" | "slate";
  urgent?: boolean;
}) {
  const palette = {
    blue:  { bg: "bg-blue-50 dark:bg-blue-900/20",  icon: "text-blue-600 dark:text-blue-400",  val: "text-blue-700 dark:text-blue-300"  },
    green: { bg: "bg-green-50 dark:bg-green-900/20", icon: "text-green-600 dark:text-green-400", val: "text-green-700 dark:text-green-300" },
    amber: { bg: "bg-amber-50 dark:bg-amber-900/20", icon: "text-amber-600 dark:text-amber-400", val: "text-amber-700 dark:text-amber-300" },
    slate: { bg: "bg-slate-100 dark:bg-slate-800",   icon: "text-slate-600 dark:text-slate-400", val: "text-slate-700 dark:text-slate-200" },
  }[color];

  return (
    <div className={`rounded-xl p-4 flex flex-col gap-2 ${palette.bg} ${urgent ? "ring-2 ring-red-400 dark:ring-red-600" : ""}`}>
      <div className={`${palette.icon}`}>{icon}</div>
      <div>
        <p className={`text-2xl font-bold tabular-nums ${palette.val}`}>{value}</p>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
        {sublabel && (
          <p className="text-xs text-slate-400 dark:text-slate-500">{sublabel}</p>
        )}
      </div>
    </div>
  );
}

/* ── Prescription Card ── */
function PrescriptionCard({
  rx,
  canDispense,
  variant,
}: {
  rx: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    patient: { firstName: string; lastName: string; salutation?: string | null };
    items: { id: string; quantity: number; instructions: string; drug: { name: string } }[];
  };
  canDispense: boolean;
  variant: "pending" | "dispensed";
}) {
  const time =
    variant === "dispensed"
      ? new Date(rx.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : new Date(rx.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      className={`px-5 py-4 ${
        variant === "dispensed"
          ? "opacity-70 hover:opacity-100 transition-opacity"
          : "hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
      }`}
    >
      <div className="flex justify-between items-start mb-2.5">
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-tight">
            {rx.patient.salutation ? `${rx.patient.salutation} ` : ""}
            {rx.patient.firstName} {rx.patient.lastName}
          </p>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3" />
            {time}
          </p>
        </div>

        {variant === "dispensed" ? (
          <span className="text-[10px] font-bold uppercase tracking-wider bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
            Dispensed
          </span>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full animate-pulse">
            Pending
          </span>
        )}
      </div>

      {/* Drug list */}
      <ul className="space-y-1 mb-3">
        {rx.items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400"
          >
            <Pill className="w-3 h-3 text-blue-400 shrink-0" />
            <span className="font-medium text-slate-700 dark:text-slate-300">{item.drug.name}</span>
            <span className="text-slate-400">×{item.quantity}</span>
            {item.instructions && (
              <span className="italic text-slate-400 truncate max-w-[140px]">
                — {item.instructions}
              </span>
            )}
          </li>
        ))}
      </ul>

      {/* Actions */}
      <div className="flex gap-2">
        {variant === "pending" && canDispense && (
          <>
            <DispenseButton prescriptionId={rx.id} />
            <CancelPrescriptionButton prescriptionId={rx.id} />
          </>
        )}
        <PrintReceiptButton prescriptionId={rx.id} />
      </div>
    </div>
  );
}
