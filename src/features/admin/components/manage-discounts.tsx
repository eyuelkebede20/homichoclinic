"use client";

import { useState } from "react";
import { updateDiscountRules } from "../actions";
import { Loader2, Save, Percent } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ManageDiscounts({ initialRules }: { initialRules: Record<string, string> }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Parse defaults
  const [rules, setRules] = useState({
    "discount:Soldier": initialRules["discount:Soldier"] ?? "100",
    "discount:Soldier Family": initialRules["discount:Soldier Family"] ?? "100",
    "discount:Civilian Family": initialRules["discount:Civilian Family"] ?? "95", // Note: 95 means patient pays 5% or patient pays 95%? By user logic, 5 means company covers 5%.
    "discount:Civilian Staff:20": initialRules["discount:Civilian Staff:20"] ?? "100",
    "discount:Civilian Staff:15": initialRules["discount:Civilian Staff:15"] ?? "75",
    "discount:Civilian Staff:10": initialRules["discount:Civilian Staff:10"] ?? "65",
    "discount:Civilian Staff:6": initialRules["discount:Civilian Staff:6"] ?? "55",
    "discount:Civilian Staff:0": initialRules["discount:Civilian Staff:0"] ?? "50",
    "discount:Guest": initialRules["discount:Guest"] ?? "0",
  });

  const handleSave = async () => {
    setLoading(true);
    const rulesToUpdate = Object.entries(rules).map(([key, value]) => ({ key, value }));
    const res = await updateDiscountRules({ rules: rulesToUpdate });
    setLoading(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Discount tiers updated successfully!");
      router.refresh();
    }
  };

  const handleChange = (key: string, val: string) => {
    setRules(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center">
          <Percent className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Discount & Coverage Tiers</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Define the percentage the <strong>company covers</strong> (the discount). E.g., if you enter 5%, the patient pays 95%.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Core Types */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">Core Patient Types</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded border border-slate-200 dark:border-slate-700">
              <label className="text-sm font-medium">Soldier</label>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="100" value={rules["discount:Soldier"]} onChange={e => handleChange("discount:Soldier", e.target.value)} className="w-20 rounded border border-slate-300 dark:border-slate-600 px-2 py-1 text-sm bg-white dark:bg-slate-900" />
                <span className="text-sm text-slate-500">%</span>
              </div>
            </div>
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded border border-slate-200 dark:border-slate-700">
              <label className="text-sm font-medium">Soldier Family</label>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="100" value={rules["discount:Soldier Family"]} onChange={e => handleChange("discount:Soldier Family", e.target.value)} className="w-20 rounded border border-slate-300 dark:border-slate-600 px-2 py-1 text-sm bg-white dark:bg-slate-900" />
                <span className="text-sm text-slate-500">%</span>
              </div>
            </div>
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded border border-slate-200 dark:border-slate-700">
              <div className="flex flex-col">
                <label className="text-sm font-medium">Civilian Family (Unlinked)</label>
                <span className="text-[10px] text-slate-500">Fallback if not inheriting staff discount</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="100" value={rules["discount:Civilian Family"]} onChange={e => handleChange("discount:Civilian Family", e.target.value)} className="w-20 rounded border border-slate-300 dark:border-slate-600 px-2 py-1 text-sm bg-white dark:bg-slate-900" />
                <span className="text-sm text-slate-500">%</span>
              </div>
            </div>
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded border border-slate-200 dark:border-slate-700">
              <label className="text-sm font-medium">Guest Attendee</label>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="100" value={rules["discount:Guest"]} onChange={e => handleChange("discount:Guest", e.target.value)} className="w-20 rounded border border-slate-300 dark:border-slate-600 px-2 py-1 text-sm bg-white dark:bg-slate-900" />
                <span className="text-sm text-slate-500">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Civilian Staff Tiers */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">Civilian Staff (Years of Service)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/10 p-3 rounded border border-blue-100 dark:border-blue-900/30">
              <label className="text-sm font-medium text-blue-900 dark:text-blue-300">20+ Years</label>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="100" value={rules["discount:Civilian Staff:20"]} onChange={e => handleChange("discount:Civilian Staff:20", e.target.value)} className="w-20 rounded border border-blue-300 dark:border-blue-700 px-2 py-1 text-sm bg-white dark:bg-slate-900" />
                <span className="text-sm text-slate-500">%</span>
              </div>
            </div>
            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/10 p-3 rounded border border-blue-100 dark:border-blue-900/30">
              <label className="text-sm font-medium text-blue-900 dark:text-blue-300">15 to 19 Years</label>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="100" value={rules["discount:Civilian Staff:15"]} onChange={e => handleChange("discount:Civilian Staff:15", e.target.value)} className="w-20 rounded border border-blue-300 dark:border-blue-700 px-2 py-1 text-sm bg-white dark:bg-slate-900" />
                <span className="text-sm text-slate-500">%</span>
              </div>
            </div>
            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/10 p-3 rounded border border-blue-100 dark:border-blue-900/30">
              <label className="text-sm font-medium text-blue-900 dark:text-blue-300">10 to 14 Years</label>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="100" value={rules["discount:Civilian Staff:10"]} onChange={e => handleChange("discount:Civilian Staff:10", e.target.value)} className="w-20 rounded border border-blue-300 dark:border-blue-700 px-2 py-1 text-sm bg-white dark:bg-slate-900" />
                <span className="text-sm text-slate-500">%</span>
              </div>
            </div>
            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/10 p-3 rounded border border-blue-100 dark:border-blue-900/30">
              <label className="text-sm font-medium text-blue-900 dark:text-blue-300">6 to 9 Years</label>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="100" value={rules["discount:Civilian Staff:6"]} onChange={e => handleChange("discount:Civilian Staff:6", e.target.value)} className="w-20 rounded border border-blue-300 dark:border-blue-700 px-2 py-1 text-sm bg-white dark:bg-slate-900" />
                <span className="text-sm text-slate-500">%</span>
              </div>
            </div>
            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/10 p-3 rounded border border-blue-100 dark:border-blue-900/30 md:col-span-2">
              <label className="text-sm font-medium text-blue-900 dark:text-blue-300">0 to 5 Years</label>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="100" value={rules["discount:Civilian Staff:0"]} onChange={e => handleChange("discount:Civilian Staff:0", e.target.value)} className="w-20 rounded border border-blue-300 dark:border-blue-700 px-2 py-1 text-sm bg-white dark:bg-slate-900" />
                <span className="text-sm text-slate-500">%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Tiers
        </button>
      </div>
    </div>
  );
}
