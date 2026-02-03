"use client";

import React, { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";

import { useNavigationStore } from "@/hooks/use-navigation";
import { Header } from "@/components/layouts/header";
import { MainNav } from "@/components/layouts/main-nav";
import { SecondaryNav } from "@/components/layouts/secondary-nav";
import { navigationTree } from "@/components/layouts/secondary-nav";
import { cn } from "@/lib/utils";

/** Default locations for the header location selector */
const DEFAULT_LOCATIONS = [
  { id: "ash1-dc1", name: "ASH1-DC1" },
  { id: "ash2-dc1", name: "ASH2-DC1" },
  { id: "lhr1-dc1", name: "LHR1-DC1" },
];

export interface DashboardLayoutProps {
  children: React.ReactNode;
  userName?: string;
  userInitials?: string;
  currentLocationId?: string;
  notificationCount?: number;
  locations?: Array<{ id: string; name: string }>;
}

/**
 * Dashboard layout: header + MainNav + SecondaryNav (both toggle together via store).
 * Content margin-left 300ms transition. ESC closes nav; mobile backdrop closes nav.
 */
export function DashboardLayout({
  children,
  userName = "John Morgan",
  userInitials = "JM",
  currentLocationId = "ash1-dc1",
  notificationCount = 0,
  locations = DEFAULT_LOCATIONS,
}: DashboardLayoutProps) {
  const [selectedLocationId, setSelectedLocationId] = React.useState(currentLocationId);
  const isNavExpanded = useNavigationStore((s) => s.isNavExpanded);
  const activeCategory = useNavigationStore((s) => s.activeCategory);
  const setActiveCategory = useNavigationStore((s) => s.setActiveCategory);
  const setActiveLink = useNavigationStore((s) => s.setActiveLink);
  const setNavExpanded = useNavigationStore((s) => s.setNavExpanded);

  const currentLocation =
    locations.find((loc) => loc.id === selectedLocationId)?.name ??
    locations[0]?.name ??
    "ASH1-DC1";

  const hasSecondaryLinks =
    activeCategory &&
    activeCategory in navigationTree &&
    navigationTree[activeCategory as keyof typeof navigationTree].length > 0;
  const secondaryWidth = hasSecondaryLinks ? 240 : 0;
  const navWidth = useMemo(() => {
    if (!isNavExpanded) return 0;
    return 80 + secondaryWidth;
  }, [isNavExpanded, secondaryWidth]);

  const pathname = usePathname();

  /** Sync secondary nav selection from URL (e.g. after "View all" → /todos) */
  useEffect(() => {
    if (pathname === "/") {
      setActiveCategory("work");
      setActiveLink("dashboard");
    } else if (pathname === "/todos") {
      setActiveCategory("work");
      setActiveLink("todos");
    }
  }, [pathname, setActiveCategory, setActiveLink]);

  const [isDesktop, setIsDesktop] = React.useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      const desktop = mq.matches;
      setIsDesktop(desktop);
      setNavExpanded(desktop);
    };
    setIsDesktop(mq.matches);
    setNavExpanded(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [setNavExpanded]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isNavExpanded) {
        setNavExpanded(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isNavExpanded, setNavExpanded]);

  const handleCategorySelect = (category: string) => {
    setActiveCategory(category);
    const links = navigationTree[category as keyof typeof navigationTree];
    if (links?.length) {
      setActiveLink(links[0].id);
    } else {
      setActiveLink(null);
    }
  };

  const mainMarginLeft = isDesktop ? navWidth : 0;

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        currentLocation={currentLocation}
        locations={locations}
        onLocationChange={(id) => setSelectedLocationId(id)}
        userName={userName}
        userInitials={userInitials}
        notificationCount={notificationCount}
      />

      <div className="flex flex-1">
        {/* Mobile backdrop: click to close nav */}
        {isNavExpanded && !isDesktop && (
          <div
            className="fixed inset-0 z-40 bg-black/50"
            aria-hidden
            onClick={() => setNavExpanded(false)}
          />
        )}

        {/* Nav strip: MainNav + SecondaryNav (fixed, animate width/transform) */}
        <div
          className={cn(
            "fixed left-0 top-16 z-40 flex h-[calc(100vh-4rem)] overflow-hidden transition-[width,transform] duration-300 ease-in-out",
            isDesktop ? "translate-x-0" : isNavExpanded ? "translate-x-0" : "-translate-x-full"
          )}
          style={{ width: isNavExpanded ? 80 + secondaryWidth : 0 }}
          aria-expanded={isNavExpanded}
        >
          <MainNav onCategorySelect={handleCategorySelect} />
          <SecondaryNav />
        </div>

        {/* Main content */}
        <main
          className="flex min-h-0 min-w-0 flex-1 flex-col p-6 pt-6 transition-[margin-left] duration-300 ease-in-out"
          style={{ marginLeft: mainMarginLeft }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
