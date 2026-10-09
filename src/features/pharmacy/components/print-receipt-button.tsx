"use client";

import { Eye } from "lucide-react";
import Link from "next/link";

export function PrintReceiptButton({ prescriptionId }: { prescriptionId: string }) {
  return (
    <Link
      href={`/pharmacy/receipt/${prescriptionId}`}
      target="_blank"
      className="inline-flex items-center px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
    >
      <Eye className="w-3.5 h-3.5 mr-1.5" />
      View Medicines
    </Link>
  );
}
