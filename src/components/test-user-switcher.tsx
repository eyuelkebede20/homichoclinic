"use client";

import { useState } from "react";
import { signIn, useSession, signOut } from "@/lib/auth-client";
import { Users, LogOut, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const TEST_ACCOUNTS = [
  { role: "Admin", email: "admin@clinic.com", color: "bg-red-600" },
  { role: "Manager", email: "manager@clinic.com", color: "bg-orange-600" },
  { role: "Doctor", email: "doctor@clinic.com", color: "bg-blue-600" },
  { role: "Reception", email: "reception@clinic.com", color: "bg-green-600" },
  { role: "Cashier", email: "cashier@clinic.com", color: "bg-emerald-600" },
  { role: "Laboratory", email: "laboratory@clinic.com", color: "bg-purple-600" },
  { role: "Pharmacy", email: "pharmacy@clinic.com", color: "bg-pink-600" },
];

export function TestUserSwitcher() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);

  // If we are strictly in production, we could hide this, but since it's requested, we show it.
  // In a real app you'd do: if (process.env.NODE_ENV === "production") return null;

  const handleLogin = async (email: string) => {
    setLoadingEmail(email);
    try {
      if (session?.user) {
        await signOut({ fetchOptions: { silent: true } }).catch(() => {});
      }
      
      await signIn.email(
        { email, password: "password123" },
        {
          onSuccess: () => {
            window.location.href = "/dashboard";
          },
          onError: (ctx) => {
            alert("Error logging in: " + ctx.error.message);
            setLoadingEmail(null);
          }
        }
      );
    } catch (err) {
      console.error("Login failed", err);
      alert("Login failed completely.");
      setLoadingEmail(null);
    }
  };

  const handleLogout = async () => {
    setLoadingEmail("logout");
    try {
      await signOut();
      window.location.href = "/login";
    } catch (err) {
      console.error(err);
      setLoadingEmail(null);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white p-3 rounded-full shadow-lg hover:bg-slate-800 transition-transform flex items-center justify-center gap-2 group border border-slate-700"
        title="Test Accounts"
      >
        <Users className="w-5 h-5" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap text-sm font-medium">
          Switch User
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
      <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-500" />
          <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">Test Accounts</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      <div className="p-2 max-h-80 overflow-y-auto space-y-1">
        {session?.user && (
          <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800/30">
            <p className="text-xs text-blue-800 dark:text-blue-300 font-medium truncate">
              Current: {session.user.role} ({session.user.email})
            </p>
          </div>
        )}

        {TEST_ACCOUNTS.map((account) => {
          const isActive = session?.user?.email === account.email;
          const isLoading = loadingEmail === account.email;

          return (
            <button
              key={account.email}
              onClick={() => !isActive && handleLogin(account.email)}
              disabled={isActive || loadingEmail !== null}
              className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between text-sm transition-colors ${
                isActive 
                  ? "bg-slate-100 dark:bg-slate-800 cursor-default" 
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${account.color}`} />
                <span className={isActive ? "font-semibold" : "font-medium"}>{account.role}</span>
              </div>
              
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
              ) : isActive ? (
                <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">Active</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {session?.user && (
        <div className="p-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={handleLogout}
            disabled={loadingEmail !== null}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
          >
            {loadingEmail === "logout" ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
