"use client";

import { Users } from "lucide-react";

export function DoctorAwaitingReviewCard({ count }: { count: number }) {
  const handleClick = () => {
    // Scroll to the active patient queue section
    const queueElement = document.getElementById("patient-queue-section");
    if (queueElement) {
      queueElement.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  };

  return (
    <button 
      onClick={handleClick}
      className="w-full text-left bg-white dark:bg-slate-900/50 p-6 rounded-xl shadow-sm border border-orange-200 dark:border-orange-900/30 relative overflow-hidden hover:border-orange-400 hover:shadow-md transition-all group"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-amber-400" />
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Users className="w-24 h-24 text-orange-600" />
      </div>
      <h3 className="text-sm font-medium text-orange-600 dark:text-orange-500 group-hover:text-orange-700 transition-colors">Patients Awaiting Review</h3>
      <p className="mt-2 text-4xl font-semibold text-slate-900 dark:text-slate-100">{count}</p>
      <p className="mt-2 text-xs text-orange-500 font-medium">Click to view queue &rarr;</p>
    </button>
  );
}
