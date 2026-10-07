"use client";

import { useState } from "react";
import { updateDiscount } from "../actions";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface DiscountSliderProps {
  patientId: string;
  initialDiscount: number;
}

export function DiscountSlider({ patientId, initialDiscount }: DiscountSliderProps) {
  const [discount, setDiscount] = useState<number>(initialDiscount);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();

  // 5% increments as per claude.md
  const quickPicks = [0, 5, 10, 15, 20, 25, 50, 75, 95, 100];

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const result = await updateDiscount({
      patientId,
      discountPercent: discount,
      reason: "Manual manager update",
    });

    setSaving(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccessMsg("Discount updated successfully!");
      router.refresh();
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-slate-200 dark:border-slate-800">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Patient Discount</h3>
        <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/40 px-3 py-1 text-sm font-medium text-blue-800 dark:text-blue-300">
          {discount}%
        </span>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="discount-slider" className="sr-only">Discount Percentage</label>
          <input
            id="discount-slider"
            type="range"
            min="0"
            max="100"
            step="1"
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
          />
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Quick Picks (5% increments)</p>
          <div className="flex flex-wrap gap-2">
            {quickPicks.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setDiscount(val)}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  discount === val
                    ? "bg-blue-600 text-white border-blue-600 dark:bg-blue-600 dark:border-blue-600"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800"
                }`}
              >
                {val}%
              </button>
            ))}
          </div>
        </div>

        {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}
        {successMsg && <div className="text-sm text-green-600 dark:text-green-400">{successMsg}</div>}

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || discount === initialDiscount}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
