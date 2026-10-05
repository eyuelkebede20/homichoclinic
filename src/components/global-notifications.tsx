"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { getNotifications } from "@/features/notifications/actions";
import Link from "next/link";

export function GlobalNotifications() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<{ count: number; items: { id?: string; link: string; title: string; desc: string; time: string }[] }>({ count: 0, items: [] });

  useEffect(() => {
    async function fetchNotifs() {
      try {
        const result = await getNotifications();
        setData(result);
      } catch (e) {
        console.error("Failed to fetch notifications", e);
      }
    }

    fetchNotifs();
    // Poll every 15 seconds
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="relative p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {data.count > 0 && (
          <>
            <span className="absolute top-1 right-1.5 flex h-4 w-4 rounded-full bg-red-600 opacity-75 animate-ping"></span>
            <span className="absolute top-1 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
              {data.count > 9 ? "9+" : data.count}
            </span>
          </>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 shadow-xl rounded-xl z-50 overflow-hidden ring-1 ring-slate-900/5 dark:ring-white/10">
            <div className="px-4 py-3 border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Notifications</h3>
              <span className="text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">
                {data.count} New
              </span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {data.items.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  You&apos;re all caught up!
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {data.items.map((item, i) => (
                    <Link 
                      key={item.id || i}
                      href={item.link}
                      onClick={() => setOpen(false)}
                      className="block px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.title}</p>
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap ml-2 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{item.time}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
