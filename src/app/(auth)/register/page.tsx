"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await authClient.signUp.email(
      {
        name,
        email,
        password,
      },
      {
        onSuccess: () => {
          router.push("/dashboard");
        },
        onError: (ctx) => {
          setError(ctx.error.message || "Failed to register");
          setLoading(false);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold leading-6 text-slate-900 dark:text-slate-100">Create an account</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Register to access the clinic system.</p>
      </div>

      <form className="space-y-4" onSubmit={handleRegister}>
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/10 rounded-md border border-red-200 dark:border-red-900/50">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="name">
            Full Name
          </label>
          <div className="mt-1">
            <input
              id="name"
              type="text"
              required
              className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-slate-950 dark:text-slate-100 transition-colors"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="email">
            Email address
          </label>
          <div className="mt-1">
            <input
              id="email"
              type="email"
              required
              className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-slate-950 dark:text-slate-100 transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="password">
            Password
          </label>
          <div className="mt-1">
            <input
              id="password"
              type="password"
              required
              className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-slate-950 dark:text-slate-100 transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
            {loading ? "Registering..." : "Register"}
          </button>
        </div>
      </form>
      
      <div className="text-center text-sm">
        <span className="text-slate-500 dark:text-slate-400">Already have an account?</span>{" "}
        <Link href="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors">
          Sign in
        </Link>
      </div>
    </div>
  );
}
