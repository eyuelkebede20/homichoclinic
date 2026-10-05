"use client";

import { useState } from "react";
import { recordPayment } from "../actions";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function PaymentButton({ invoiceId, amountStr }: { invoiceId: string; amountStr: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handlePayment(method: "cash" | "card" | "transfer") {
    if (!confirm(`Confirm internal ledger clearance of ${amountStr}?`)) {
      return;
    }

    setLoading(true);
    const result = await recordPayment({ invoiceId, method });
    setLoading(false);

    if (result.error) {
      toast.error(`Error: ${result.error}`);
    } else {
      router.push(`/billing/${invoiceId}?print=true`);
    }
  }

  return (
    <div className="flex space-x-2">
      <button
        onClick={() => handlePayment("transfer")}
        disabled={loading}
        className="text-xs bg-indigo-100 text-indigo-800 hover:bg-indigo-200 px-3 py-1 rounded font-bold disabled:opacity-50 transition-colors"
      >
        {loading ? "Processing..." : "Clear Ledger"}
      </button>
      {/* 
      <button onClick={() => handlePayment("cash")} className="...">Cash</button>
      <button onClick={() => handlePayment("card")} className="...">Card</button> 
      */}
    </div>
  );
}
