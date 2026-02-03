"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useNavigationStore } from "@/hooks/use-navigation";
import { cn } from "@/lib/utils";

/** Nav category id (matches Lucide icon names) */
export type NavCategoryId = "work" | "monitor" | "equipment" | "reports" | "docs";

/** Single category config: id, label, icon component */
export interface NavCategory {
  id: NavCategoryId;
  label: string;
  icon: React.ReactNode;
}

/** Props for the main navigation sidebar */
export interface MainNavProps {
  /** Currently selected category id, or null (from store if not passed) */
  activeCategory?: string | null;
  /** Called when user selects a category (uses store if not passed) */
  onCategorySelect?: (category: string) => void;
}

/** Inline icons (16x16) – Lucide equivalents without dependency */
const IconCircleCheckBig = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </svg>
);
const IconBarChart3 = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
  </svg>
);
const IconServer = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
    <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
    <path d="M6 6h.01" />
    <path d="M6 18h.01" />
    <path d="M6 10h.01" />
    <path d="M6 14h.01" />
  </svg>
);
const IconFileText = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M10 9H8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </svg>
);
const IconFileStack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M16 2v6h6" />
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M21 15h-7v7h7" />
    <path d="M15 15H5a2 2 0 0 0-2 2v4" />
  </svg>
);

const CATEGORIES: NavCategory[] = [
  { id: "work", label: "Work", icon: <IconCircleCheckBig /> },
  { id: "monitor", label: "Monitor", icon: <IconBarChart3 /> },
  { id: "equipment", label: "Equipment", icon: <IconServer /> },
  { id: "reports", label: "Reports", icon: <IconFileText /> },
  { id: "docs", label: "Docs", icon: <IconFileStack /> },
];

/**
 * Main navigation sidebar for QTS COT Dashboard.
 * Width 80px when expanded, 0 when collapsed. Animates with 300ms ease-in-out.
 * Active: primary #20719A at 10% opacity background, icon and text in primary color.
 * Design ref: [QTS Ideation (Figma)](https://www.figma.com/design/GS4jtoCM9RCvSvgzBkvHcm/QTS---Ideation-Effort?node-id=52-99862)
 */
export function MainNav({
  activeCategory: activeCategoryProp,
  onCategorySelect: onCategorySelectProp,
}: MainNavProps = {}) {
  const isNavExpanded = useNavigationStore((s) => s.isNavExpanded);
  const storeCategory = useNavigationStore((s) => s.activeCategory);
  const setActiveCategory = useNavigationStore((s) => s.setActiveCategory);
  const activeCategory = activeCategoryProp ?? storeCategory;
  const onCategorySelect = onCategorySelectProp ?? setActiveCategory;

  return (
    <aside
      role="navigation"
      className={cn(
        "flex shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-slate-50 py-4 transition-[width,opacity,transform] duration-300 ease-in-out",
        isNavExpanded ? "w-20 opacity-100 translate-x-0" : "w-0 opacity-0 -translate-x-full"
      )}
      aria-label="Main navigation"
    >
      <nav className="flex flex-col items-center space-y-2 px-2" role="navigation">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <Tooltip key={cat.id} delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => onCategorySelect?.(cat.id)}
                  aria-label={cat.label}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "flex h-auto w-full flex-col items-center justify-center gap-1.5 rounded-lg px-2 py-3 text-xs font-medium transition-colors duration-200",
                    "hover:bg-slate-200/80",
                    isActive &&
                      "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary [&_svg]:text-primary"
                  )}
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center text-current [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-current">
                    {cat.icon}
                  </span>
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap text-inherit">
                    {cat.label}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {cat.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </aside>
  );
}
