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
        <h2 className="text-[30px] font-bold text-[#112233] mb-2 tracking-tight">Welcome Back</h2>
        <p className="text-[#777] text-[15px]">Sign in to your account</p>
      </div>

      <form className="space-y-5" onSubmit={handleLogin}>
        {error && (
          <div className="p-3.5 text-sm text-[#c62828] bg-[#ffebee] rounded-lg border-l-4 border-[#c62828]">
            {error}
          </div>
        )}

        <div>
          <label className="block text-[15px] font-bold text-[#444] mb-2" htmlFor="email">
            Username / Email
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              placeholder="Enter your username or email"
              className="block w-full py-3.5 pl-3.75 pr-11.25 border border-[#ddd] rounded-xl text-[15px] text-[#333] transition-all duration-300 outline-none focus:border-[#1565c0] focus:ring-[3px] focus:ring-[#1565c0]/10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="absolute right-3.75 top-1/2 -translate-y-1/2 text-[#777] pointer-events-none">
              <User className="w-5 h-5 opacity-70" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[15px] font-bold text-[#444] mb-2" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              className="block w-full py-3.5 pl-3.75 pr-11.25 border border-[#ddd] rounded-xl text-[15px] text-[#333] transition-all duration-300 outline-none focus:border-[#1565c0] focus:ring-[3px] focus:ring-[#1565c0]/10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.75 top-1/2 -translate-y-1/2 text-[#777] hover:text-[#444] transition-colors focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-5 h-5 opacity-70" /> : <Eye className="w-5 h-5 opacity-70" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 pb-3 text-[14px]">
          <label className="flex items-center gap-2 cursor-pointer text-[#555]">
            <input type="checkbox" className="rounded border-[#ddd] text-[#1565c0] focus:ring-[#1565c0]" />
            <span>Remember me</span>
          </label>
          <button 
            type="button" 
            onClick={handleForgotPassword}
            className="text-[#1565c0] hover:underline font-medium"
          >
            Forgot Password?
          </button>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3.75 px-4 rounded-xl text-[16px] font-bold text-white bg-linear-to-br from-[#1565c0] to-[#0d47a1] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(13,71,161,0.3)] transition-all duration-300 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "LOGIN"}
          </button>
        </div>
      </form>
    </div>
  );
}
