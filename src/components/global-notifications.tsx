/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { getNotifications } from "@/features/notifications/actions";
import Link from "next/link";

export function GlobalNotifications() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<{ count: number; items: any[] }>({ count: 0, items: [] });

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
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg rounded-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Notifications</h3>
              <span className="text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                {data.count} New
              </span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {data.items.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  You&apos;re all caught up!
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.items.map((item, i) => (
                    <Link 
                      key={item.id || i}
                      href={item.link}
                      onClick={() => setOpen(false)}
                      className="block px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{item.desc}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{item.time}</p>
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
