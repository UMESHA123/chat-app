"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import { authApi } from "../../lib/api";

/**
 * OAuth callback page.
 * The backend redirects here with the JWT in the URL hash fragment:
 *   /auth/callback#token=<jwt>
 * Hash fragments are never sent to the server, so the token stays client-side.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const loginWithToken = useAuthStore((s) => s.loginWithToken);

  useEffect(() => {
    const hash = window.location.hash.slice(1); // strip leading "#"
    const params = new URLSearchParams(hash);
    const token = params.get("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    // Fetch user info to populate the store
    authApi.me(token)
      .then(({ user }) => {
        loginWithToken(token, user);
        router.replace("/inbox");
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [loginWithToken, router]);

  return (
    <div className="h-screen flex items-center justify-center bg-[#111111]">
      <div className="flex flex-col items-center gap-4">
        <svg className="animate-spin w-8 h-8 text-[#ae7aff]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-gray-400 text-sm">Finishing sign-in…</p>
      </div>
    </div>
  );
}
