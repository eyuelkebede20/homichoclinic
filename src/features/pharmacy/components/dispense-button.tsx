"use client";

import { useState } from "react";
import { dispensePrescription } from "../actions";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function DispenseButton({ prescriptionId }: { prescriptionId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDispense() {
    if (!confirm("Are you sure you want to dispense this prescription? This will deduct stock using FEFO.")) {
      return;
    }

    setLoading(true);
    const result = await dispensePrescription({ prescriptionId });
    setLoading(false);

    if (result.error) {
      toast.error(`Error: ${result.error}`);
    } else {
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleDispense}
      disabled={loading}
      className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      Dispense & Deduct Stock
    </button>
  );
}
