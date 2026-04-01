import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeSelector } from "./theme-selector";
import { ModeSwitcher } from "./mode-switcher";

export function SiteHeader() {
  return (
    <header
      style={{ borderTopLeftRadius: "inherit", borderTopRightRadius: "inherit" }}
      className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center gap-2 border-b border-border/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) shadow-sm"
    >
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground transition-colors" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4 bg-border/60"
        />
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
          <h1 className="text-sm font-semibold tracking-wide text-foreground">
            <span className="md:hidden">GTI — ISO</span>
            <span className="hidden md:block">Internal Audit System</span>
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeSelector />
          <ModeSwitcher />
        </div>
      </div>
    </header>
  );
}
