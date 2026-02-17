"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CalendarRange,
  Archive,
  BookOpen,
  LayoutTemplate,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUIStore } from "@/lib/stores/ui-store";
import { useContexts } from "@/lib/hooks/use-contexts";
import { SyncIndicator } from "./SyncIndicator";

interface SidebarProps {
  className?: string;
}

const navItems = [
  { label: "Today", icon: CalendarDays, href: "/today" },
  { label: "Upcoming", icon: CalendarRange, href: "/upcoming" },
  { label: "Backlog", icon: Archive, href: "/backlog" },
  { label: "Archive", icon: BookOpen, href: "/archive" },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const sidebarCollapsed = !sidebarOpen;
  const { data: contexts = [] } = useContexts();
  const [contextsExpanded, setContextsExpanded] = useState(true);

  const isActive = (href: string) => {
    if (href === "/today") return pathname === "/" || pathname === "/today";
    return pathname.startsWith(href);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-background transition-all duration-200",
          sidebarCollapsed ? "w-16" : "w-64",
          className
        )}
      >
        {/* Logo / Title */}
        <div className="flex h-14 items-center border-b px-4">
          {sidebarCollapsed ? (
            <span className="mx-auto text-lg font-bold">B+</span>
          ) : (
            <span className="text-lg font-bold tracking-tight">BuJo+GTD</span>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-2">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              const linkContent = (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    active && "bg-accent text-accent-foreground",
                    sidebarCollapsed && "justify-center px-2"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              );

              return (
                <li key={item.href}>
                  {sidebarCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    linkContent
                  )}
                </li>
              );
            })}
          </ul>

          <Separator className="my-3" />

          {/* Contexts Section */}
          {!sidebarCollapsed ? (
            <div>
              <button
                onClick={() => setContextsExpanded(!contextsExpanded)}
                className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                <span>Contexts</span>
                {contextsExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
              {contextsExpanded && (
                <ul className="mt-1 space-y-0.5">
                  {contexts.map((ctx) => {
                    const ctxActive = pathname === `/contexts/${ctx.id}`;
                    return (
                      <li key={ctx.id}>
                        <Link
                          href={`/contexts/${ctx.id}`}
                          className={cn(
                            "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                            ctxActive && "bg-accent text-accent-foreground"
                          )}
                        >
                          <span className="shrink-0 text-base">
                            {ctx.icon || "📁"}
                          </span>
                          <span className="flex-1 truncate">{ctx.name}</span>
                          {ctx.name === "Inbox" && ctx._count?.tasks != null && ctx._count.tasks > 0 && (
                            <Badge
                              variant="secondary"
                              className="ml-auto h-5 min-w-[20px] justify-center px-1.5 text-xs"
                            >
                              {ctx._count.tasks}
                            </Badge>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/contexts"
                  className={cn(
                    "flex items-center justify-center rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    pathname.startsWith("/contexts") &&
                      "bg-accent text-accent-foreground"
                  )}
                >
                  <Inbox className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Contexts</TooltipContent>
            </Tooltip>
          )}

          <div className="mt-1">
            {sidebarCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/templates"
                    className={cn(
                      "flex items-center justify-center rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                      pathname.startsWith("/templates") &&
                        "bg-accent text-accent-foreground"
                    )}
                  >
                    <LayoutTemplate className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Templates</TooltipContent>
              </Tooltip>
            ) : (
              <Link
                href="/templates"
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  pathname.startsWith("/templates") &&
                    "bg-accent text-accent-foreground"
                )}
              >
                <LayoutTemplate className="h-5 w-5 shrink-0" />
                <span>Templates</span>
              </Link>
            )}
          </div>

          <Separator className="my-3" />

          {/* Settings */}
          {sidebarCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/settings"
                  className={cn(
                    "flex items-center justify-center rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    pathname.startsWith("/settings") &&
                      "bg-accent text-accent-foreground"
                  )}
                >
                  <Settings className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
          ) : (
            <Link
              href="/settings"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                pathname.startsWith("/settings") &&
                  "bg-accent text-accent-foreground"
              )}
            >
              <Settings className="h-5 w-5 shrink-0" />
              <span>Settings</span>
            </Link>
          )}
        </nav>

        {/* Bottom Controls */}
        <div className="border-t px-2 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={cn(
              "w-full",
              sidebarCollapsed ? "justify-center" : "justify-start"
            )}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="mr-2 h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </Button>
          <div className="mt-2">
            <SyncIndicator collapsed={sidebarCollapsed} />
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
