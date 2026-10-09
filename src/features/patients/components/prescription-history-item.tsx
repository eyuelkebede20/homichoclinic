import { Prisma } from "@prisma/client";
import { Pill } from "lucide-react";

type PrescriptionWithItems = Prisma.PrescriptionGetPayload<{
  include: { items: { include: { drug: true } } }
}>;

export function PrescriptionHistoryItem({ prescription }: { prescription: PrescriptionWithItems }) {
  return (
    <div className="border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-r-md">
      <div className="flex justify-between items-start mb-3">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
          <Pill className="w-3.5 h-3.5" />
          Medication Ordered
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {prescription.createdAt.toLocaleDateString()}
        </span>
      </div>

      <div className="space-y-2 mt-2">
        {prescription.items.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No items found</p>
        ) : (
          <ul className="list-disc list-inside space-y-1">
            {prescription.items.map((item) => (
              <li key={item.id} className="text-sm text-slate-700 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-slate-100">{item.drug.name}</span>
                <span className="text-slate-500 dark:text-slate-400 ml-2">({item.quantity} qty)</span>
                {item.instructions && (
                  <span className="block pl-5 text-xs text-slate-600 dark:text-slate-400">Sig: {item.instructions}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-3">
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          prescription.status === 'dispensed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
        }`}>
          Status: {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
        </span>
      </div>
    </div>
  );
}
