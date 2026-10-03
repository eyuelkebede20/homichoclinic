/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { Loader2, Pill, CheckCircle2 } from "lucide-react";
import { dispensePrescription } from "../actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function PharmacyDashboard({ prescriptions }: { prescriptions: any[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Pharmacy Queue</h2>
        <p className="text-slate-500 dark:text-slate-400">Pending prescriptions awaiting dispensing.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 shadow rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 dark:text-slate-200">Pending Dispensing</h3>
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
            {prescriptions.length} Pending
          </span>
        </div>
        
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {prescriptions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 italic">No pending prescriptions.</div>
          ) : (
            prescriptions.map(p => <PrescriptionRow key={p.id} prescription={p} />)
          )}
        </div>
      </div>
    </div>
  );
}

function PrescriptionRow({ prescription }: { prescription: any }) {
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleDispense() {
    if (!confirm("Have you collected the physical signature on the ledger?")) return;
    
    setSaving(true);
    const res = await dispensePrescription({ prescriptionId: prescription.id });
    setSaving(false);
    
    if (res?.error) toast.error(res.error);
    else { toast.success("Stock deducted & dispensed"); router.refresh(); }
  }

  return (
    <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-lg flex items-center gap-2">
            {prescription.patient.firstName} {prescription.patient.lastName}
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {prescription.status}
            </span>
          </h4>
          <p className="text-xs text-slate-500">
            Prescribed at {new Date(prescription.createdAt).toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={handleDispense}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Dispense & Deduct Stock
        </button>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded p-3">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <th className="pb-2 font-medium">Drug</th>
              <th className="pb-2 font-medium w-24 text-right">Quantity</th>
              <th className="pb-2 font-medium px-4">Instructions</th>
            </tr>
          </thead>
          <tbody>
            {prescription.items.map((item: any) => (
              <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                <td className="py-2 font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Pill className="w-3 h-3 text-slate-400" />
                  {item.drug.name}
                </td>
                <td className="py-2 text-right font-bold">{item.quantity}</td>
                <td className="py-2 px-4 text-slate-600 dark:text-slate-400 italic">{item.instructions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}