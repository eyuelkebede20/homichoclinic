import { Prisma } from "@prisma/client";
import { Pill, Clock } from "lucide-react";
import { formatToEthiopianDate } from "@/lib/date-utils";
import { RemoveQueuedMedicineButton } from "@/features/pharmacy/components/remove-queued-medicine-button";

type PrescriptionWithItems = Prisma.PrescriptionGetPayload<{
  include: { items: { include: { drug: true } } }
}>;

export function PrescriptionHistoryItem({ prescription }: { prescription: PrescriptionWithItems }) {
  const isPending = prescription.status === "pending";

  return (
    <div className="border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-r-md">
      <div className="flex justify-between items-start mb-3">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
          <Pill className="w-3.5 h-3.5" />
          Medication Ordered
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {formatToEthiopianDate(prescription.createdAt)}
        </span>
      </div>

      <div className="space-y-2 mt-2">
        {prescription.items.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No items found</p>
        ) : (
          <ul className="space-y-1.5">
            {prescription.items.map((item) => (
              <li
                key={item.id}
                className="text-sm text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white/60 dark:bg-slate-900/40"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{item.drug.name}</span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono text-xs">({item.quantity} qty)</span>
                  </div>
                  {item.instructions && (
                    <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5 italic">
                      Sig: {item.instructions}
                    </span>
                  )}
                </div>
                {isPending && (
                  <RemoveQueuedMedicineButton itemId={item.id} drugName={item.drug.name} />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
            prescription.status === "dispensed"
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : isPending
              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
          }`}
        >
          {isPending ? "Queued at Pharmacy (Pending)" : `Status: ${prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}`}
        </span>
        {isPending && (
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-500" />
            Not yet dispensed
          </span>
        )}
      </div>
    </div>
  );
}
