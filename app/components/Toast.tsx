"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ToastVariant = "error" | "success";

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

// Lightweight toast state. Lives wherever it's needed (here: StudyApp), so no global
// provider/context is required — every error site is already in one component.
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const pushToast = useCallback(
    (t: { message: string; variant?: ToastVariant }) => {
      const id = `t${counter.current++}`;
      setToasts((prev) => [
        ...prev,
        { id, message: t.message, variant: t.variant ?? "error" },
      ]);
    },
    [],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return { toasts, pushToast, dismissToast };
}

export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  // Auto-dismiss after 5s; also dismissable by click.
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const isError = toast.variant === "error";

  return (
    <div
      role="status"
      onClick={() => onDismiss(toast.id)}
      className="animate-fade-up pointer-events-auto flex w-full max-w-sm cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-lg"
    >
      <span
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
          isError ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
        }`}
      >
        {isError ? (
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8v5M12 16.5v.5" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </span>
      <p className="flex-1 text-sm leading-snug text-ink">{toast.message}</p>
      <span aria-hidden className="shrink-0 text-muted">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </span>
    </div>
  );
}
