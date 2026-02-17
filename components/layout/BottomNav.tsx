"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CalendarRange,
  Layers,
  Menu,
  Archive,
  BookOpen,
  LayoutTemplate,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useContexts } from "@/lib/hooks/use-contexts";
import { SyncIndicator } from "./SyncIndicator";

interface BottomNavProps {
  className?: string;
}

const bottomItems = [
  { label: "Today", icon: CalendarDays, href: "/today" },
  { label: "Upcoming", icon: CalendarRange, href: "/upcoming" },
  { label: "Contexts", icon: Layers, href: "/contexts" },
];

const menuNavItems = [
  { label: "Today", icon: CalendarDays, href: "/today" },
  { label: "Upcoming", icon: CalendarRange, href: "/upcoming" },
  { label: "Backlog", icon: Archive, href: "/backlog" },
  { label: "Archive", icon: BookOpen, href: "/archive" },
];

export function BottomNav({ className }: BottomNavProps) {
  const pathname = usePathname();
  const { data: contexts = [] } = useContexts();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/today") return pathname === "/" || pathname === "/today";
    return pathname.startsWith(href);
  };

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t bg-background",
        className
      )}
    >
      <nav className="flex h-16 items-center justify-around px-2">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-1.5 text-muted-foreground transition-colors",
                active && "text-primary"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Menu button opens Sheet */}
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-1.5 text-muted-foreground transition-colors",
                menuOpen && "text-primary"
              )}
            >
              <Menu className="h-5 w-5" />
              <span className="text-[10px] font-medium">Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-left text-lg font-bold tracking-tight">
                BuJo+GTD
              </SheetTitle>
            </SheetHeader>

            <nav className="mt-4">
              <ul className="space-y-1">
                {menuNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                          active && "bg-accent text-accent-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <Separator className="my-3" />

              {/* Contexts Section */}
              <div>
                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Contexts
                </p>
                <ul className="mt-1 space-y-0.5">
                  {contexts.map((ctx) => {
                    const ctxActive = pathname === `/contexts/${ctx.id}`;
                    return (
                      <li key={ctx.id}>
                        <Link
                          href={`/contexts/${ctx.id}`}
                          onClick={() => setMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
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
              </div>

              <Separator className="my-3" />

              <Link
                href="/templates"
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  pathname.startsWith("/templates") &&
                    "bg-accent text-accent-foreground"
                )}
              >
                <LayoutTemplate className="h-5 w-5 shrink-0" />
                <span>Templates</span>
              </Link>

              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  pathname.startsWith("/settings") &&
                    "bg-accent text-accent-foreground"
                )}
              >
                <Settings className="h-5 w-5 shrink-0" />
                <span>Settings</span>
              </Link>

              <Separator className="my-3" />

              <div className="px-3">
                <SyncIndicator collapsed={false} />
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}
