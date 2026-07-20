"use client";

// Lightweight, accessible toast system. Single global container
// fixed to the bottom-right; components dispatch via the `toast`
// helper. Auto-dismiss is configurable; an `important` flag pins
// the toast (used for live price alerts).

import { useEffect, useState, useCallback, createContext, useContext } from "react";

export type ToastVariant = "default" | "success" | "danger" | "warning";
export type Toast = {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type Ctx = {
  toast: (t: Omit<Toast, "id"> & { id?: string }) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<Ctx | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((curr) => curr.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((t: Omit<Toast, "id"> & { id?: string }) => {
    const id = t.id ?? crypto.randomUUID();
    const item: Toast = { durationMs: 4500, variant: "default", ...t, id };
    setToasts((curr) => [...curr, item]);
    if (item.durationMs && item.durationMs > 0) {
      setTimeout(() => dismiss(id), item.durationMs);
    }
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function variantClass(v: ToastVariant): string {
  switch (v) {
    case "success": return "border-success/40 bg-success/10";
    case "danger":  return "border-danger/40 bg-danger/10";
    case "warning": return "border-warning/40 bg-warning/10";
    default:        return "border-border bg-bg-elevated";
  }
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  return (
    <div
      role="status"
      className={`panel-elevated border shadow-lg p-3 pr-8 relative animate-fade-in ${variantClass(toast.variant ?? "default")}`}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-fg">{toast.title}</p>
          {toast.description && <p className="text-xs text-fg-secondary mt-0.5">{toast.description}</p>}
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="absolute top-2 right-2 text-fg-muted hover:text-fg text-sm"
        >
          ×
        </button>
      </div>
    </div>
  );
}
