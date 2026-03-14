"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  dismissing?: boolean;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const styleMap = {
  success: "bg-steadii-in-range/10 border-steadii-in-range/30 text-steadii-in-range",
  error: "bg-steadii-low/10 border-steadii-low/30 text-steadii-low",
  info: "bg-steadii-secondary/10 border-steadii-secondary/30 text-steadii-secondary",
};

const textStyleMap = {
  success: "text-steadii-text",
  error: "text-steadii-text",
  info: "text-steadii-text",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, dismissing: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), 3000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col items-center gap-2 pt-4 px-4 pointer-events-none">
        {toasts.map((t) => {
          const Icon = iconMap[t.type];
          return (
            <div
              key={t.id}
              className={`
                max-w-[440px] w-full flex items-center gap-3 px-4 py-3
                rounded-steadii-md border shadow-steadii-md
                pointer-events-auto
                ${styleMap[t.type]}
                ${t.dismissing ? "animate-fade-out" : "animate-slide-down-in"}
              `}
              role="alert"
            >
              <Icon size={18} className="flex-shrink-0" />
              <p className={`text-sm font-medium flex-1 ${textStyleMap[t.type]}`}>
                {t.message}
              </p>
              <button
                onClick={() => removeToast(t.id)}
                className="flex-shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors"
                aria-label="Dismiss"
              >
                <X size={14} className="text-steadii-text-tertiary" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
