"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextType {
  toast: (message: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" aria-live="polite">
        {toasts.map((t) => {
          const icons = {
            success: <CheckCircle className="w-5 h-5 text-green-500" />,
            error: <AlertCircle className="w-5 h-5 text-red-500" />,
            info: <Info className="w-5 h-5 text-blue-500" />,
          };
          const bg = {
            success: "bg-green-50 border-green-200",
            error: "bg-red-50 border-red-200",
            info: "bg-blue-50 border-blue-200",
          };
          return (
            <div key={t.id} className={cn("flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg min-w-[300px] animate-slide-in", bg[t.type])}>
              {icons[t.type]}
              <span className="text-sm text-gray-800 flex-1">{t.message}</span>
              <button onClick={() => removeToast(t.id)} className="p-0.5 hover:bg-white/50 rounded" aria-label="閉じる">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
