"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

type Toast = {
  id: number;
  message: string;
  action?: { label: string; onClick: () => void };
};

type ToastInput = Omit<Toast, "id">;

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null);

const DISMISS_AFTER_MS = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (input: ToastInput) => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { ...input, id }]);
      setTimeout(() => dismiss(id), DISMISS_AFTER_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="border-border bg-surface pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-2.5 shadow-lg"
          >
            <span className="text-foreground">{toast.message}</span>
            {toast.action ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  toast.action?.onClick();
                  dismiss(toast.id);
                }}
              >
                {toast.action.label}
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const push = useContext(ToastContext);
  if (!push) {
    throw new Error("useToast 必须在 ToastProvider 内使用");
  }
  return push;
}
