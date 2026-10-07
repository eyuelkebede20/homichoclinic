"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Pill, 
  HeartPulse,
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
      color: "text-blue-500 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      title: "Patients",
      description: "Search employee records, dependents, and files",
      href: "/patients",
      icon: Users,
      color: "text-indigo-500 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-900/20"
    },
    {
      title: "Visits",
      description: "Active OPD queue, triage, and consultations",
      href: "/visits",
      icon: Calendar,
      color: "text-emerald-500 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/20"
    },
    {
      title: "Pharmacy",
      description: "Prescription dispensing and medication inventory",
      href: "/pharmacy",
      icon: Pill,
      color: "text-orange-500 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-900/20"
    },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-500 selection:text-white overflow-hidden relative">
      
      {/* Background Decor */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-950/20 pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400/5 dark:bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Top Bar */}
      <header className="relative z-10 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold text-slate-900 dark:text-white tracking-tight hover:opacity-80 transition-opacity">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm ring-1 ring-blue-600/20">
              <Activity className="h-5 w-5" />
            </div>
            <span>Bure Card</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full text-center space-y-8">
          
          {/* Animated Icon */}
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 bg-red-100 dark:bg-red-900/20 rounded-full animate-ping opacity-75 duration-1000" />
            <div className="relative flex items-center justify-center w-24 h-24 bg-white dark:bg-slate-900 rounded-full shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
              <HeartPulse className="w-10 h-10 text-red-500 dark:text-red-400" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Record Not Found
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
              We couldn&apos;t find the patient record, visit, or page you were looking for. It may have been removed or the URL might be incorrect.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => {
                if (window.history.length > 1) router.back();
                else router.push("/dashboard");
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Go Back</span>
            </button>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 hover:shadow transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Return to Dashboard</span>
            </Link>
          </div>

          {/* Quick Navigation Cards */}
          <div className="pt-12 text-left">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-4">
              <span>Quick Shortcuts</span>
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-start gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <div className={`p-2.5 rounded-xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1">
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pr-2">
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
      <footer className="relative z-10 py-6 text-center text-xs text-slate-500 dark:text-slate-500 font-medium">
        Bure Clinic Management System &bull; <button onClick={() => router.push('/support')} className="hover:text-slate-800 dark:hover:text-slate-300 transition-colors">Contact IT Support</button>
      </footer>
    </div>
  );
}
