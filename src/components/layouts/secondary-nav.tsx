"use client";

import * as React from "react";
import Link from "next/link";

import { useNavigationStore } from "@/hooks/use-navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/** Map secondary link id to route path (for nav items that have pages) */
export const linkIdToPath: Record<string, string> = {
  dashboard: "/",
  todos: "/todos",
};

/** Child link for a category */
export interface NavLinkItem {
  id: string;
  label: string;
  icon: string;
}

/** Category id matching main nav */
export type SecondaryNavCategoryId =
  | "work"
  | "monitor"
  | "equipment"
  | "reports"
  | "docs";

/** Navigation tree: category id -> child links */
export const navigationTree: Record<SecondaryNavCategoryId, NavLinkItem[]> = {
  work: [
    { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { id: "todos", label: "To Do's", icon: "CheckSquare" },
    { id: "maintenance", label: "Maintenance", icon: "Wrench" },
    { id: "remote-hands", label: "Remote hands", icon: "Hand" },
    { id: "changes", label: "Changes", icon: "GitBranch" },
    { id: "incidents", label: "Incidents", icon: "AlertCircle" },
    { id: "projects", label: "Projects", icon: "Briefcase" },
  ],
  monitor: [],
  equipment: [],
  reports: [
    { id: "passdown-current", label: "Pass down (current)", icon: "FileDown" },
    { id: "passdown-archive", label: "Pass down (archive)", icon: "Archive" },
    { id: "health-safety", label: "Health & Safety", icon: "Heart" },
    { id: "timecards", label: "Time cards", icon: "Clock" },
  ],
  docs: [],
};

/** Props for the secondary navigation panel (all optional when using store) */
export interface SecondaryNavProps {
  /** Currently selected main category (from store if not passed) */
  category?: string | null;
  /** Currently active child link id (from store if not passed) */
  activeLink?: string | null;
  /** Called when user selects a link (uses store if not passed) */
  onLinkSelect?: (linkId: string) => void;
  /** Whether nav is expanded (from store). When false, panel width 0. */
  isNavExpanded?: boolean;
}

/** Inline icons (16x16) by name – Lucide equivalents */
const ICONS: Record<string, React.ReactNode> = {
  LayoutDashboard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  ),
  CheckSquare: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14" />
    </svg>
  ),
  Wrench: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  Hand: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v0" />
      <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2" />
      <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </svg>
  ),
  GitBranch: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="6" x2="6" y1="3" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  ),
  AlertCircle: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  ),
  Briefcase: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  FileDown: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M12 11v6" />
      <path d="m15 18-3 3-3-3" />
    </svg>
  ),
  Archive: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect width="20" height="5" x="2" y="3" rx="1" />
      <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
      <path d="M10 12h4" />
    </svg>
  ),
  Heart: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  ),
  Clock: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
};

const CATEGORY_LABELS: Record<SecondaryNavCategoryId, string> = {
  work: "Work",
  monitor: "Monitor",
  equipment: "Equipment",
  reports: "Reports",
  docs: "Docs",
};

/**
 * Secondary navigation panel: slides in when main category is selected and nav is expanded.
 * Width 240px when visible, 0 when collapsed. Transition 300ms ease-in-out, 50ms delay when expanding.
 */
export function SecondaryNav({
  category: categoryProp,
  activeLink: activeLinkProp,
  onLinkSelect: onLinkSelectProp,
  isNavExpanded: isNavExpandedProp,
}: SecondaryNavProps = {}) {
  const storeIsNavExpanded = useNavigationStore((s) => s.isNavExpanded);
  const storeCategory = useNavigationStore((s) => s.activeCategory);
  const storeActiveLink = useNavigationStore((s) => s.activeLink);
  const setActiveLink = useNavigationStore((s) => s.setActiveLink);

  const isNavExpanded = isNavExpandedProp ?? storeIsNavExpanded;
  const category = categoryProp ?? storeCategory;
  const activeLink = activeLinkProp ?? storeActiveLink;
  const onLinkSelect = onLinkSelectProp ?? setActiveLink;

  const links =
    category && category in navigationTree
      ? navigationTree[category as SecondaryNavCategoryId]
      : [];
  const hasChildren = links.length > 0;

  if (!category || !hasChildren) {
    return <div className="w-0 shrink-0 overflow-hidden" aria-hidden />;
  }

  const categoryTitle = CATEGORY_LABELS[category as SecondaryNavCategoryId] ?? category;

  return (
    <div
      className={cn(
        "shrink-0 overflow-hidden border-r border-gray-200 bg-white transition-[width,opacity,transform] duration-300 ease-in-out",
        isNavExpanded ? "w-60 opacity-100 translate-x-0 delay-75" : "w-0 opacity-0 -translate-x-full"
      )}
      aria-hidden={!isNavExpanded}
      aria-expanded={isNavExpanded}
    >
      <aside
        className={cn(
          "h-full w-60 border-r border-gray-200 bg-white p-4 transition-transform duration-300 ease-in-out",
          isNavExpanded ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label={`${categoryTitle} navigation`}
      >
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {categoryTitle}
        </p>
        <Separator className="mb-3" />
        <nav className="flex flex-col gap-0.5" role="navigation">
          {links.map((link) => {
            const isActive = activeLink === link.id;
            const iconEl = ICONS[link.icon] ?? null;
            const href = linkIdToPath[link.id];
            const buttonClass = cn(
              "h-auto w-full justify-start gap-0 py-2 pl-0 pr-3 text-sm font-normal transition-colors duration-200",
              "hover:bg-slate-100",
              isActive &&
                "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
            );
            if (href !== undefined) {
              return (
                <Link
                  key={link.id}
                  href={href}
                  onClick={() => onLinkSelect?.(link.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex h-auto w-full items-center justify-start gap-0 rounded-md py-2 pl-0 pr-3 text-sm font-normal transition-colors duration-200",
                    "hover:bg-slate-100",
                    isActive &&
                      "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                  )}
                >
                  <span className="mr-3 flex h-4 w-4 shrink-0 items-center justify-center [&_svg]:h-4 [&_svg]:w-4">
                    {iconEl}
                  </span>
                  {link.label}
                </Link>
              );
            }
            return (
              <Button
                key={link.id}
                variant="ghost"
                onClick={() => onLinkSelect?.(link.id)}
                aria-current={isActive ? "page" : undefined}
                className={buttonClass}
              >
                <span className="mr-3 flex h-4 w-4 shrink-0 items-center justify-center [&_svg]:h-4 [&_svg]:w-4">
                  {iconEl}
                </span>
                {link.label}
              </Button>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}
