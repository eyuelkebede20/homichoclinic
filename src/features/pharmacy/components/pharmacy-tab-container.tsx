"use client";

import React, { useState, useEffect } from "react";
import { ClipboardList, Layers, Package, Pill, Clock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface PharmacyTabContainerProps {
  prescriptionsContent: React.ReactNode;
  trackingContent: React.ReactNode;
  inventoryContent: React.ReactNode;
  defaultTab?: string;
  pendingCount: number;
  uncountedCount: number;
  totalDrugsCount: number;
}

export function PharmacyTabContainer({
  prescriptionsContent,
  trackingContent,
  inventoryContent,
  defaultTab = "prescriptions",
  pendingCount,
  uncountedCount,
  totalDrugsCount,
}: PharmacyTabContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<string>(
    urlTab || defaultTab
  );

  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  function switchTab(tabId: string) {
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    router.replace(`/pharmacy?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-6">
      {/* ── Navigation Tabs ── */}
      <div className="border-b border-slate-200 dark:border-slate-800 print:hidden">
        <div className="flex gap-2 -mb-px overflow-x-auto">
          {/* Tab 1: Prescriptions Queue */}
          <button
            onClick={() => switchTab("prescriptions")}
            className={`pb-3.5 pt-1 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === "prescriptions"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Prescriptions & Dispensing</span>
            {pendingCount > 0 && (
              <span className="text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>

          {/* Tab 2: Temporary Tracking */}
          <button
            onClick={() => switchTab("tracking")}
            className={`pb-3.5 pt-1 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === "tracking"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Temporary Tracking (Hamle Stock)</span>
            {uncountedCount > 0 ? (
              <span className="text-[11px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                {uncountedCount} uncounted
              </span>
            ) : (
              <span className="text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                {totalDrugsCount}
              </span>
            )}
          </button>

          {/* Tab 3: Batch Inventory */}
          <button
            onClick={() => switchTab("inventory")}
            className={`pb-3.5 pt-1 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === "inventory"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Batch Inventory</span>
          </button>
        </div>
      </div>

      {/* ── Tab Panels ── */}
      <div>
        {activeTab === "prescriptions" && <div>{prescriptionsContent}</div>}
        {activeTab === "tracking" && <div>{trackingContent}</div>}
        {activeTab === "inventory" && <div>{inventoryContent}</div>}
      </div>
    </div>
  );
}
