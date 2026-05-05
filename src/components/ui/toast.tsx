import * as React from "react";

const ToastContext = React.createContext<{
  toast: (props: { title?: string; description?: string; variant?: "default" | "destructive" }) => void;
}>({
  toast: () => {},
});

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = React.useState<Array<{ id: number; title?: string; description?: string; variant?: string }>>([]);

  const toast = React.useCallback(
    ({ title, description, variant = "default" }: { title?: string; description?: string; variant?: "default" | "destructive" }) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, title, description, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 left-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-md border px-4 py-3 shadow-lg max-w-sm ${
              t.variant === "destructive"
                ? "bg-red-50 border-red-200 text-red-900"
                : "bg-white border-gray-200 text-gray-900"
            }`}
          >
            {t.title && <div className="font-semibold text-sm">{t.title}</div>}
            {t.description && <div className="text-sm opacity-90">{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => React.useContext(ToastContext);
