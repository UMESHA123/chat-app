"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "../store/authStore";
import { useUIStore } from "../store/uiStore";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError, token } = useAuthStore();
  const pushToast = useUIStore((s) => s.pushToast);

  const [form, setForm] = useState({ username: "", email: "", password: "" });

  useEffect(() => {
    if (token) router.replace("/inbox");
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await register(form.username, form.email, form.password);
      pushToast("success", "Account created! Welcome.");
      router.push("/inbox");
    } catch { /* error shown from store */ }
  };

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="h-screen flex overflow-hidden bg-[#111111]">
      <div className="hidden md:block w-[38%] shrink-0 bg-gradient-to-br from-[#6B21A8] via-[#9333EA] to-[#ae7aff]" />

      <div className="flex-1 flex flex-col overflow-y-auto border-l-2 border-[#4f4e4e]">
        <div className="flex items-center justify-between px-8 py-4 shrink-0 border-b-2 border-[#4f4e4e]">
          <span className="text-white text-lg font-bold">Register</span>
          <Link
            href="/login"
            className="px-4 py-2 border-2 border-[#4f4e4e] text-white text-sm font-bold shadow-[3px_3px_0px_0px_#4f4e4e] hover:bg-white/5 transition-all active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
          >
            Login
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-start px-8 md:px-16 lg:px-20">
          <div className="w-full max-w-[520px]">
            <h2 className="text-4xl font-bold text-white mb-2">Create account</h2>
            <p className="text-gray-400 text-sm mb-8">Sign up to get started</p>

            {error && (
              <div className="mb-5 px-4 py-3 border-2 border-[#ff4d4d] text-[#ff4d4d] text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {(["username", "email", "password"] as const).map((field) => (
                <div key={field}>
                  <label className="block text-sm font-bold text-gray-300 mb-2 capitalize">{field}</label>
                  <input
                    type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                    placeholder={`Enter a ${field}…`}
                    value={form[field]}
                    onChange={update(field)}
                    className="neo-input"
                    required
                    disabled={isLoading}
                  />
                </div>
              ))}

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
                {isLoading ? "Creating account…" : "Create account"}
              </button>
            </form>

            <p className="text-sm text-gray-500 text-center mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-[#ae7aff] font-bold hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
