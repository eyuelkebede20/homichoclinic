"use client";

import { Printer } from "lucide-react";

export function PrintReceiptButton({ prescriptionId }: { prescriptionId: string }) {
  const handlePrint = () => {
    window.open(`/pharmacy/receipt/${prescriptionId}`, "_blank", "width=800,height=600");
  };

  return (
    <button
      onClick={handlePrint}
      className="inline-flex items-center px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
    >
      <Printer className="w-3.5 h-3.5 mr-1.5" />
      Print Receipt
    </button>
  );
}
