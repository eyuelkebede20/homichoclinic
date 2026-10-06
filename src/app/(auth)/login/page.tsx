"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, User } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await signIn.email(
      {
        email,
        password,
      },
      {
        onSuccess: () => {
          router.push("/dashboard");
          router.refresh();
        },
        onError: (ctx) => {
          setError(ctx.error.message || "Invalid credentials");
          setLoading(false);
        },
      }
    );
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    toast.success("Please contact the system administrator to reset your password.");
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2 tracking-tight">Welcome Back</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Sign in to your account</p>
      </div>

      <form className="space-y-5" onSubmit={handleLogin}>
        {error && (
          <div className="p-3.5 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 rounded-lg border-l-4 border-red-600 dark:border-red-500">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2" htmlFor="email">
            Username / Email
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              placeholder="Enter your username or email"
              className="block w-full py-3.5 px-4 pr-11 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all duration-300 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <User className="w-5 h-5 opacity-70" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              className="block w-full py-3.5 px-4 pr-11 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all duration-300 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-5 h-5 opacity-70" /> : <Eye className="w-5 h-5 opacity-70" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 pb-3 text-sm">
          <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
            <input type="checkbox" className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-900" />
            <span>Remember me</span>
          </label>
          <button 
            type="button" 
            onClick={handleForgotPassword}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Forgot Password?
          </button>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3.5 px-4 rounded-xl text-base font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all duration-300 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
          </button>
        </div>
      </form>
    </div>
  );
}
