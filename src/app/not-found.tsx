"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Pill, 
  FileQuestion,
  Search,
  Activity
} from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  const quickLinks = [
    {
      title: "Dashboard",
      description: "Overview, active queues, and summary metrics",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Patients",
      description: "Search employee records, dependents, and files",
      href: "/patients",
      icon: Users,
    },
    {
      title: "Appointments & Visits",
      description: "Active OPD queue, triage, and consultations",
      href: "/visits",
      icon: Calendar,
    },
    {
      title: "Pharmacy",
      description: "Prescription dispensing and medication inventory",
      href: "/pharmacy",
      icon: Pill,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* Top Bar */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold text-slate-900 dark:text-white tracking-tight">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <Activity className="h-5 w-5" />
            </div>
            <span>Bure Card</span>
          </Link>
          <div className="text-xs font-mono font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Clinic Management System
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full text-center">
          {/* Status Indicator */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/40 px-3.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 mb-6">
            <FileQuestion className="h-3.5 w-3.5" />
            <span>Status 404 &bull; Resource Not Found</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
            This page could not be found
          </h1>
          
          <p className="text-base text-slate-600 dark:text-slate-400 max-w-lg mx-auto mb-8 leading-relaxed">
            The requested URL or record doesn&apos;t exist, may have moved, or is temporarily inaccessible. Use the options below to navigate back to your workspace.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  router.back();
                } else {
                  router.push("/dashboard");
                }
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Go Back</span>
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Return to Dashboard</span>
            </Link>
          </div>

          {/* Quick Navigation Cards */}
          <div className="text-left border-t border-slate-200 dark:border-slate-800 pt-8">
            <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 text-center sm:text-left">
              Quick Shortcuts
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900/60 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all shadow-sm hover:shadow"
                  >
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
        If you suspect this is a system malfunction, please contact the clinic IT administrator.
      </footer>
    </div>
  );
}
