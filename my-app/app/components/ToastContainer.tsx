"use client";

import { useEffect } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import { useUIStore } from "../store/uiStore";

const ICONS = {
  success: <CheckCircle size={16} className="text-green-400 shrink-0" />,
  error: <XCircle size={16} className="text-red-400 shrink-0" />,
  info: <Info size={16} className="text-blue-400 shrink-0" />,
};

function ToastItem({ id, type, message }: { id: string; type: "success" | "error" | "info"; message: string }) {
  const dismiss = useUIStore((s) => s.dismissToast);

  useEffect(() => {
    const t = setTimeout(() => dismiss(id), 4000);
    return () => clearTimeout(t);
  }, [id, dismiss]);

  return (
    <div className="flex items-center gap-3 bg-[#1e1e1e] border-2 border-[#4f4e4e] px-4 py-3 min-w-[260px] max-w-[360px]">
      {ICONS[type]}
      <span className="text-sm text-white flex-1">{message}</span>
      <button onClick={() => dismiss(id)} className="text-gray-500 hover:text-white transition-colors shrink-0">
        <X size={14} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end">
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} />
      ))}
    </div>
  );
}
