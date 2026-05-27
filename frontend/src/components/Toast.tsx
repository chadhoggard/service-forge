"use client";

import { useEffect } from "react";

export interface ToastData {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface Props extends Omit<ToastData, "id"> {
  onDismiss: () => void;
  duration?: number;
}

const STYLES = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

const ICONS = {
  success: "✓",
  error: "✕",
  info: "ℹ",
};

export default function Toast({
  message,
  type = "info",
  onDismiss,
  duration = 4000,
}: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [onDismiss, duration]);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm w-full text-sm font-medium ${STYLES[type]}`}
    >
      <span className="text-base leading-none mt-px shrink-0">
        {ICONS[type]}
      </span>
      <span className="flex-1">{message}</span>
      <button
        onClick={onDismiss}
        className="shrink-0 opacity-60 hover:opacity-100 leading-none ml-1"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

/** Drop this in your layout or page to render toasts. */
export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}
