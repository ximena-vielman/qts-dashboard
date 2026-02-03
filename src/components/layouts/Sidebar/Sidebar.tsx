"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SIDEBAR_NAV } from "@/constants/routes";
import { cn } from "@/lib/utils";

/**
 * Left sidebar navigation for the dashboard.
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-64 space-y-1 p-4">
      {SIDEBAR_NAV.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <span className="text-base" aria-hidden>
              {item.label === "Dashboard" && "◉"}
              {item.label === "Routes" && "◇"}
              {item.label === "Tasks" && "▣"}
              {item.label === "Alerts" && "⚠"}
              {item.label === "Analytics" && "▤"}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
