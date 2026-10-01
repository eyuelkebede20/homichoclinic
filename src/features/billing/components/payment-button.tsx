"use client";

import { useState } from "react";
import { recordPayment } from "../actions";

import { useRouter } from "next/navigation";

export function PaymentButton({ invoiceId, amountStr }: { invoiceId: string; amountStr: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handlePayment(method: "cash" | "card" | "transfer") {
    if (!confirm(`Confirm payment of ${amountStr} via ${method.toUpperCase()}?`)) {
      return;
    }

    setLoading(true);
    const result = await recordPayment({ invoiceId, method });
    setLoading(false);

    if (result.error) {
      alert(`Error: ${result.error}`);
    } else {
      router.push(`/billing/${invoiceId}?print=true`);
    }
  }

  return (
    <div className="flex space-x-2">
      <button
        onClick={() => handlePayment("cash")}
        disabled={loading}
        className="text-xs bg-green-100 text-green-800 hover:bg-green-200 px-3 py-1 rounded disabled:opacity-50"
      >
        Cash
      </button>
      <button
        onClick={() => handlePayment("card")}
        disabled={loading}
        className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 px-3 py-1 rounded disabled:opacity-50"
      >
        Card
      </button>
    </div>
  );
}
