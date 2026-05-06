import * as React from "react";
import { cn } from "@/lib/utils";
import { X, Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const SidebarContext = React.createContext<{ open: boolean; setOpen: (v: boolean) => void; isMobile: boolean }>({
  open: true,
  setOpen: () => {},
  isMobile: false,
});

function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}

function SidebarProvider({ children, defaultOpen = true }: { children: React.ReactNode; defaultOpen?: boolean }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(!isMobile && defaultOpen);

  React.useEffect(() => {
    if (isMobile) {
      setOpen(false);
    }
  }, [isMobile]);

  React.useEffect(() => {
    if (isMobile && open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobile, open]);

  return <SidebarContext.Provider value={{ open, setOpen, isMobile }}>{children}</SidebarContext.Provider>;
}

function Sidebar({ className, children, side = "right", ...props }: React.HTMLAttributes<HTMLDivElement> & { side?: "left" | "right"; collapsible?: "icon" }) {
  const { open, setOpen, isMobile } = useSidebar();

  return (
    <>
      {isMobile && open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setOpen(false)}
        />
      )}
      <div
        className={cn(
          "fixed inset-y-0 z-[60] flex w-60 flex-col border bg-background transition-transform duration-300",
          side === "right" ? "right-0 border-l" : "left-0 border-r",
          !open && side === "right" ? "translate-x-full" : !open && side === "left" ? "-translate-x-full" : "",
          isMobile && "shadow-2xl",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </>
  );
}

function SidebarHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex h-16 items-center border-b px-4 pt-safe", className)} {...props} />;
}

function SidebarContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 overflow-auto py-2 pb-safe", className)} {...props} />;
}

function SidebarFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-t p-4 pb-safe", className)} {...props} />;
}

function SidebarMenu({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn("flex w-full min-w-0 flex-col gap-1 px-2", className)} {...props} />;
}

function SidebarMenuItem({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) {
  return <li className={cn("group/menu-item relative", className)} {...props} />;
}

function SidebarMenuButton({
  className,
  isActive,
  tooltip,
  size = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { isActive?: boolean; tooltip?: string; size?: "sm" | "default" | "lg" }) {
  return (
    <button
      data-active={isActive}
      className={cn(
        "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-start outline-none ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
        size === "sm" && "text-xs",
        size === "lg" && "text-sm",
        isActive && "bg-blue-100 text-blue-900",
        className
      )}
      {...props}
    />
  );
}

function SidebarTrigger({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen } = useSidebar();
  return (
    <button
      onClick={() => setOpen(!open)}
      className={cn("inline-flex items-center justify-center rounded-md text-sm font-medium h-10 w-10", className)}
      {...props}
    >
      {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
    </button>
  );
}

function SidebarInset({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { open, isMobile } = useSidebar();
  return (
    <div
      className={cn(
        "flex min-h-svh flex-1 flex-col transition-[margin] duration-300",
        !isMobile && open ? "mr-60" : "mr-0",
        className
      )}
      {...props}
    />
  );
}

function SidebarSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-2 w-auto bg-sidebar-border", className)} {...props} />;
}

export {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarSeparator,
  useSidebar,
};
