"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "../store/authStore";
import { useUIStore } from "../store/uiStore";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError, token } = useAuthStore();
  const pushToast = useUIStore((s) => s.pushToast);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (token) router.replace("/inbox");
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(identifier, password);
      pushToast("success", "Welcome back!");
      router.push("/inbox");
    } catch { /* error shown from store */ }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-[#111111]">
      {/* Left gradient panel */}
      <div className="hidden md:block w-[38%] shrink-0 bg-gradient-to-br from-[#6B21A8] via-[#9333EA] to-[#ae7aff]" />

      {/* Right panel */}
      <div className="flex-1 flex flex-col overflow-y-auto border-l-2 border-[#4f4e4e]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-4 shrink-0 border-b-2 border-[#4f4e4e]">
          <span className="text-white text-lg font-bold">Login</span>
          <Link
            href="/register"
            className="px-4 py-2 border-2 border-[#4f4e4e] text-white text-sm font-bold shadow-[3px_3px_0px_0px_#4f4e4e] hover:bg-white/5 transition-all active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
          >
            Register
          </Link>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-start px-8 md:px-16 lg:px-20">
          <div className="w-full max-w-[520px]">
            <h2 className="text-4xl font-bold text-white mb-2">Login</h2>
            <p className="text-gray-400 text-sm mb-8">Login to access your account</p>

            {error && (
              <div className="mb-5 px-4 py-3 border-2 border-[#ff4d4d] text-[#ff4d4d] text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Username or email</label>
                <input
                  type="text"
                  placeholder="Enter a username or email..."
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="neo-input"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Password</label>
                <input
                  type="password"
                  placeholder="Enter a password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="neo-input"
                  required
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3.5 text-sm"
              >
                {isLoading ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : null}
                {isLoading ? "Logging in…" : "Log in"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-[2px] bg-[#4f4e4e]" />
              <span className="text-gray-500 text-sm font-bold">OR</span>
              <div className="flex-1 h-[2px] bg-[#4f4e4e]" />
            </div>

            {/* OAuth */}
            <div className="space-y-3">
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-[#0f0f0f] border-2 border-[#4f4e4e] text-white text-sm font-bold shadow-[3px_3px_0px_0px_#4f4e4e] hover:bg-[#1a1a1a] transition-all active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Login with Google
              </a>

              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}/api/auth/github`}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-[#0f0f0f] border-2 border-[#4f4e4e] text-white text-sm font-bold shadow-[3px_3px_0px_0px_#4f4e4e] hover:bg-[#1a1a1a] transition-all active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                Login with GitHub
              </a>
            </div>

            <p className="text-sm text-gray-500 text-center mt-6">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-[#ae7aff] font-bold hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
