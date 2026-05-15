import { toast as sonnerToast, Toaster as SonnerToaster } from "sonner";

type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

const Toaster = (props: ToasterProps) => (
  <SonnerToaster
    position="bottom-right"
    toastOptions={{
      style: {
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.3)",
        borderRadius: "12px",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.03)",
        fontSize: "13px",
        fontWeight: 500,
        padding: "12px 16px",
        direction: "rtl",
      },
    }}
    richColors
    closeButton
    {...props}
  />
);

// eslint-disable-next-line react-refresh/only-export-components
export { Toaster, sonnerToast as toast };
