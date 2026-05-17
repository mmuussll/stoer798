import * as React from "react";
import { X, AlertCircle, CheckCircle2, Info } from "lucide-react";

const ToastContext = React.createContext<{
  toast: (props: { title?: string; description?: string; variant?: "default" | "destructive" | "success" | "info" }) => void;
}>({
  toast: () => {},
});

const variantConfig = {
  default: {
    icon: Info,
    bg: "bg-white/95 border-slate-200/60",
    iconColor: "text-primary",
    accent: "border-r-primary",
  },
  destructive: {
    icon: AlertCircle,
    bg: "bg-red-50/95 border-red-200/60",
    iconColor: "text-red-500",
    accent: "border-r-red-500",
  },
  success: {
    icon: CheckCircle2,
    bg: "bg-emerald-50/95 border-emerald-200/60",
    iconColor: "text-emerald-500",
    accent: "border-r-emerald-500",
  },
  info: {
    icon: Info,
    bg: "bg-primary/5 border-primary/20",
    iconColor: "text-primary",
    accent: "border-r-blue-500",
  },
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = React.useState<
    Array<{ id: number; title?: string; description?: string; variant: keyof typeof variantConfig; leaving: boolean }>
  >([]);

  const removeToast = React.useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 250);
  }, []);

  const toast = React.useCallback(
    ({ title, description, variant = "default" }: { title?: string; description?: string; variant?: keyof typeof variantConfig }) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, title, description, variant, leaving: false }]);
      setTimeout(() => removeToast(id), 5000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const config = variantConfig[t.variant];
          const IconComponent = config.icon;
          return (
            <div
              key={t.id}
              className={`
                pointer-events-auto
                backdrop-blur-2xl rounded-xl border-2 shadow-2xl shadow-black/5
                px-4 py-3.5 flex items-start gap-3
                transition-all duration-300
                ${config.bg}
                ${t.leaving ? "opacity-0 translate-x-4 scale-95" : "opacity-100 translate-x-0 scale-100 animate-toast-enter"}
              `}
            >
              <div className={`shrink-0 mt-0.5 ${config.iconColor}`}>
                <IconComponent className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                {t.title && <div className="font-bold text-sm text-slate-800 leading-tight">{t.title}</div>}
                {t.description && <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{t.description}</div>}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => React.useContext(ToastContext);
