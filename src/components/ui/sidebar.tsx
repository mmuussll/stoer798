import * as React from "react";
import { cn } from "@/lib/utils";
import { useBodyScrollLock } from "@/lib/scroll-lock";
import { ChevronRight, ChevronLeft, Menu, X, PanelRightClose, PanelRightOpen } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const SIDEBAR_WIDTH = "17rem";
const SIDEBAR_WIDTH_MOBILE = "19rem";
const SIDEBAR_COOKIE = "sidebar:state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

type SidebarContextType = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextType | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
>(({ defaultOpen = true, open: openProp, onOpenChange: setOpenProp, className, style, children, ...props }, ref) => {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);

  const [_open, _setOpen] = React.useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }

      try {
        document.cookie = `${SIDEBAR_COOKIE}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
      } catch (_error) {
        /* cookie write is non-critical */
      }
    },
    [setOpenProp, open]
  );

  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open);
  }, [isMobile, setOpen, setOpenMobile]);

  const state = open ? ("expanded" as const) : ("collapsed" as const);

  const contextValue = React.useMemo<SidebarContextType>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        style={
          {
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-mobile": SIDEBAR_WIDTH_MOBILE,
            ...style,
          } as React.CSSProperties
        }
        className={cn(
          "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
});
SidebarProvider.displayName = "SidebarProvider";

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right";
    variant?: "sidebar" | "floating" | "inset";
    collapsible?: "offcanvas" | "icon" | "none";
  }
>(({ side = "right", variant = "sidebar", collapsible = "offcanvas", className, children, ...props }, ref) => {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  useBodyScrollLock(isMobile && openMobile);

  if (collapsible === "none") {
    return (
      <div
        className={cn(
          "flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <>
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-all duration-400 ease-out",
            openMobile ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
          onClick={() => setOpenMobile(false)}
          aria-hidden="true"
        />
        <div
          data-state={openMobile ? "open" : "closed"}
          className={cn(
            "fixed inset-y-0 z-50 w-[--sidebar-width-mobile] max-w-[85vw] bg-sidebar text-sidebar-foreground",
            "transition-transform duration-400 ease-premium",
            "shadow-2xl shadow-black/30",
            side === "right"
              ? "right-0 rounded-l-2xl border-l border-sidebar-border"
              : "left-0 rounded-r-2xl border-r border-sidebar-border",
            side === "right"
              ? (openMobile ? "translate-x-0" : "translate-x-full")
              : (openMobile ? "translate-x-0" : "-translate-x-full"),
            className
          )}
          ref={ref}
          {...props}
        >
          <div className="relative flex h-full flex-col pb-[env(safe-area-inset-bottom,0px)]">
            <button
              onClick={() => setOpenMobile(false)}
              aria-label="إغلاق القائمة"
              className={cn(
                "absolute top-3 z-10 flex h-8 w-8 items-center justify-center rounded-xl",
                "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
                "transition-all duration-200",
                side === "right" ? "left-3" : "right-3"
              )}
            >
              <X className="w-[18px] h-[18px]" />
            </button>
            {children}
          </div>
        </div>
      </>
    );
  }

  return (
    <div
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      className={cn(
        "hidden lg:flex relative h-svh transition-[width] duration-400 ease-premium",
        "group peer",
        state === "expanded" ? "w-[--sidebar-width]" : "w-[4.5rem]",
        variant === "inset" && "p-3",
        className
      )}
      ref={ref}
      {...props}
    >
      <div
        data-sidebar="sidebar"
        className={cn(
          "flex h-full w-full flex-col bg-sidebar text-sidebar-foreground rounded-xl overflow-hidden",
          "border border-sidebar-border/60",
          "shadow-xl shadow-black/15",
          variant === "floating" && "my-3",
          "transition-all duration-400 ease-premium"
        )}
      >
        {children}
      </div>
    </div>
  );
});
Sidebar.displayName = "Sidebar";

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof HTMLButtonElement>,
  React.ComponentPropsWithoutRef<typeof HTMLButtonElement>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar, open, isMobile } = useSidebar();

  return (
    <button
      ref={ref}
      data-sidebar="trigger"
      className={cn(
        "inline-flex items-center justify-center rounded-xl text-sm font-medium",
        "h-9 w-9",
        "text-muted-foreground/70 hover:text-foreground",
        "hover:bg-muted/60 active:bg-muted",
        "transition-all duration-200",
        className
      )}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      {isMobile ? (
        <Menu className="w-[18px] h-[18px]" />
      ) : open ? (
        <PanelRightClose className="w-[18px] h-[18px]" />
      ) : (
        <PanelRightOpen className="w-[18px] h-[18px]" />
      )}
    </button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger";

const SidebarRail = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
  ({ className, ...props }, ref) => {
    const { toggleSidebar } = useSidebar();

    return (
      <button
        ref={ref}
        data-sidebar="rail"
        aria-label="Toggle Sidebar"
        tabIndex={-1}
        onClick={toggleSidebar}
        title="Toggle Sidebar"
        className={cn(
          "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:-left-4 sm:flex",
          "[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize",
          "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
          "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar",
          "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
          "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
          className
        )}
        {...props}
      />
    );
  }
);
SidebarRail.displayName = "SidebarRail";

const SidebarInset = React.forwardRef<HTMLDivElement, React.ComponentProps<"main">>(
  ({ className, ...props }, ref) => {
    return (
      <main
        ref={ref}
        className={cn(
          "relative flex min-h-svh flex-1 flex-col bg-background",
          "peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow",
          className
        )}
        {...props}
      />
    );
  }
);
SidebarInset.displayName = "SidebarInset";

const SidebarHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="header"
        className={cn("flex flex-col gap-2 p-3 border-b border-sidebar-border/50", className)}
        {...props}
      />
    );
  }
);
SidebarHeader.displayName = "SidebarHeader";

const SidebarFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="footer"
        className={cn("flex flex-col gap-1 p-2.5 border-t border-sidebar-border/50", className)}
        {...props}
      />
    );
  }
);
SidebarFooter.displayName = "SidebarFooter";

const SidebarContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="content"
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-1 overflow-auto",
          "scrollbar-thin",
          className
        )}
        {...props}
      />
    );
  }
);
SidebarContent.displayName = "SidebarContent";

const SidebarSeparator = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="separator"
        className={cn("mx-3 my-1.5 h-px bg-sidebar-border/40", className)}
        {...props}
      />
    );
  }
);
SidebarSeparator.displayName = "SidebarSeparator";

const SidebarGroup = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="group"
        className={cn("relative flex w-full min-w-0 flex-col px-2.5 py-1", className)}
        {...props}
      />
    );
  }
);
SidebarGroup.displayName = "SidebarGroup";

const SidebarGroupLabel = React.forwardRef<HTMLDivElement, React.ComponentProps<"div"> & { asChild?: boolean }>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? "div" : "div";
    return (
      <Comp
        ref={ref as never}
        data-sidebar="group-label"
        className={cn(
          "flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/35 outline-none transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
          "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
          className
        )}
        {...props}
      />
    );
  }
);
SidebarGroupLabel.displayName = "SidebarGroupLabel";

const SidebarGroupContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  )
);
SidebarGroupContent.displayName = "SidebarGroupContent";

const SidebarMenu = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 flex-col gap-0.5", className)}
      {...props}
    />
  )
);
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
  ({ className, ...props }, ref) => (
    <li
      ref={ref}
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  )
);
SidebarMenuItem.displayName = "SidebarMenuItem";

const sidebarMenuButtonVariants = {
  base: "peer/menu-button flex w-full items-center gap-2.5 overflow-hidden rounded-xl p-2.5 text-start outline-none ring-sidebar-ring transition-all duration-200 focus-visible:ring-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-[18px] [&>svg]:shrink-0",
  sm: "text-xs",
  default: "text-sm",
  lg: "text-sm font-medium",
};

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean;
    isActive?: boolean;
    tooltip?: string | React.ComponentProps<"div">;
    size?: "sm" | "default" | "lg";
  }
>(({ asChild = false, isActive = false, size = "default", tooltip, className, children, ...props }, ref) => {
  const { state, isMobile } = useSidebar();

  const button = (
    <button
      ref={ref}
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        sidebarMenuButtonVariants.base,
        sidebarMenuButtonVariants[size],
        isActive
          ? "bg-sidebar-accent text-sidebar-foreground font-semibold shadow-sm"
          : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
        state === "collapsed" && !isMobile && "justify-center px-2 [&>*:not(:first-child)]:hidden",
        className
      )}
      {...props}
    >
      {children}
      {isActive && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-sidebar-primary to-sidebar-primary/40 rounded-full" />
      )}
    </button>
  );

  if (!tooltip) {
    return button;
  }

  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    };
  }

  return button;
});
SidebarMenuButton.displayName = "SidebarMenuButton";

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean;
    showOnHover?: boolean;
  }
>(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? React.Fragment : "button";
  return (
    <Comp
      ref={ref as never}
      data-sidebar="menu-action"
      className={cn(
        "absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0",
        "after:absolute after:-inset-2 after:md:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover &&
          "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0",
        className
      )}
      {...props}
    />
  );
});
SidebarMenuAction.displayName = "SidebarMenuAction";

const SidebarMenuBadge = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="menu-badge"
      className={cn(
        "absolute left-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold tabular-nums text-sidebar-foreground",
        "peer-hover/menu-button:text-sidebar-foreground",
        className
      )}
      {...props}
    />
  )
);
SidebarMenuBadge.displayName = "SidebarMenuBadge";

const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    showIcon?: boolean;
  }
>(({ className, showIcon = false, ...props }, ref) => {
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  }, []);

  return (
    <div
      ref={ref}
      data-sidebar="menu-skeleton"
      className={cn("rounded-xl h-8 flex gap-2 px-2 items-center", className)}
      {...props}
    >
      {showIcon && (
        <div className="size-4 rounded-md bg-sidebar-accent animate-pulse" />
      )}
      <div
        className="h-3.5 flex-1 max-w-[--skeleton-width] rounded-md bg-sidebar-accent animate-pulse"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  );
});
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton";

const SidebarMenuSub = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      data-sidebar="menu-sub"
      className={cn(
        "mx-3.5 flex min-w-0 translate-x-px flex-col gap-0.5 border-r border-sidebar-border px-1.5 py-0.5",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
);
SidebarMenuSub.displayName = "SidebarMenuSub";

const SidebarMenuSubButton = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<"a"> & {
    asChild?: boolean;
    size?: "sm" | "md";
    isActive?: boolean;
  }
>(({ asChild = false, size = "md", className, isActive, ...props }, ref) => {
  const Comp = asChild ? React.Fragment : "a";
  return (
    <Comp
      ref={ref as never}
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  );
});
SidebarMenuSubButton.displayName = "SidebarMenuSubButton";

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
};
