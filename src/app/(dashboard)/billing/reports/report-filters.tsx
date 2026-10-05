"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const ETH_MONTHS = [
  "Meskerem", "Tikimt", "Hidar", "Tahsas", "Tir", "Yekatit",
  "Megabit", "Miyazya", "Ginbot", "Sene", "Hamle", "Nehase", "Pagume"
];

export function ReportFilters({ defaultYear, defaultMonth, defaultDay }: { defaultYear: number, defaultMonth: number, defaultDay: number | null }) {
  const router = useRouter();
  
  const [reportType, setReportType] = useState<"monthly" | "daily">(defaultDay ? "daily" : "monthly");
  
  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);
  const [day, setDay] = useState(defaultDay || 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("ethYear", year.toString());
    params.set("ethMonth", month.toString());
    if (reportType === "daily") {
      params.set("ethDay", day.toString());
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <form className="flex flex-col sm:flex-row items-end gap-6" onSubmit={handleSubmit}>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Report Type</label>
        <select 
          value={reportType}
          onChange={(e) => setReportType(e.target.value as "monthly" | "daily")}
          className="block rounded border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-sm"
        >
          <option value="monthly">Monthly Report</option>
          <option value="daily">Daily Report</option>
        </select>
      </div>
      
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Ethiopian Year</label>
        <select 
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="block rounded border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-sm"
        >
          {Array.from({ length: 10 }, (_, i) => 2015 + i).map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Ethiopian Month</label>
        <select 
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="block rounded border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-sm"
        >
          {ETH_MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>{m} ({i + 1})</option>
          ))}
        </select>
      </div>

      {reportType === "daily" && (
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Day</label>
          <select 
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
            className="block rounded border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-sm"
          >
            {Array.from({ length: month === 13 ? 6 : 30 }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      )}

      <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors">
        Generate Report
      </button>
    </form>
  );
}
