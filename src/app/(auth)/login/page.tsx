"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
          router.push("/dashboard"); // We will create this later
        },
        onError: (ctx) => {
          setError(ctx.error.message || "Invalid credentials");
          setLoading(false);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium leading-6 text-slate-900">Sign in to your account</h3>
        <p className="mt-1 text-sm text-slate-500">Welcome back to the clinic system.</p>
      </div>

      <form className="space-y-4" onSubmit={handleLogin}>
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="email">
            Email address
          </label>
          <div className="mt-1">
            <input
              id="email"
              type="email"
              required
              className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="password">
            Password
          </label>
          <div className="mt-1">
            <input
              id="password"
              type="password"
              required
              className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign in"}
          </button>
        </div>
      </form>
      
      <div className="text-center text-sm">
        <span className="text-slate-500">Don't have an account?</span>{" "}
        <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
          Register here
        </Link>
      </div>
    </div>
  );
}
