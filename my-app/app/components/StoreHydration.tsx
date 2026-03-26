"use client";

/**
 * StoreHydration
 * ──────────────────────────────────────────────────────────────────────────────
 * Rehydrates the persisted auth store from localStorage on the first client
 * render.  Must be rendered inside the root layout so it runs on every page.
 *
 * We use skipHydration: true in the auth store so that Zustand never tries to
 * read localStorage on the server (which would throw or produce a mismatch).
 */

import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";

export default function StoreHydration() {
  useEffect(() => {
    useAuthStore.persist.rehydrate();
  }, []);

  return null;
}
