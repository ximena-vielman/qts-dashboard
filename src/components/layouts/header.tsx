"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { useNavigationStore } from "@/hooks/use-navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/** Inline icons (no lucide dependency) */
const IconMenu = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
const IconSearch = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const IconBell = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);
const IconChevronDown = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

/** Location option for the location selector dropdown */
export interface HeaderLocation {
  id: string;
  name: string;
}

/** Props for the QTS COT Dashboard header */
export interface HeaderProps {
  /** Currently selected data center / location display name (e.g. "ASH1-DC1") */
  currentLocation: string;
  /** List of available locations for the dropdown */
  locations: HeaderLocation[];
  /** Called when user selects a different location */
  onLocationChange: (locationId: string) => void;
  /** Display name for the current user */
  userName: string;
  /** Initials to show in the avatar (e.g. "SM") */
  userInitials: string;
  /** Number of unread notifications for the badge */
  notificationCount: number;
}

/**
 * Top header bar for the QTS COT Dashboard.
 * Layout (L→R): Menu toggle, QTS logo, location selector, search bar, notifications, user avatar.
 * Sticky, 64px height, white background, responsive (search collapses to icon on mobile).
 */
export function Header({
  currentLocation,
  locations,
  onLocationChange,
  userName: _userName, // eslint-disable-line @typescript-eslint/no-unused-vars -- reserved for avatar tooltip
  userInitials,
  notificationCount,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const isNavExpanded = useNavigationStore((s) => s.isNavExpanded);
  const toggleNav = useNavigationStore((s) => s.toggleNav);

  const handleMenuClick = () => {
    const wasExpanded = useNavigationStore.getState().isNavExpanded;
    toggleNav();
    if (wasExpanded) {
      setTimeout(() => menuButtonRef.current?.focus(), 0);
    }
  };

  const currentLocationId =
    locations.find((loc) => loc.name === currentLocation)?.id ??
    locations[0]?.id;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-white px-4"
      )}
    >
      {/* 1. Menu toggle: X when expanded, hamburger when collapsed */}
      <Button
        ref={menuButtonRef}
        variant="ghost"
        size="icon"
        aria-label="Toggle navigation menu"
        aria-expanded={isNavExpanded}
        onClick={handleMenuClick}
        className="h-10 w-10 shrink-0 rounded-md hover:bg-gray-100"
      >
        <IconMenu className="h-5 w-5" aria-hidden />
      </Button>

      {/* 2. QTS Logo */}
      <Link href="/" className="relative flex h-8 shrink-0 items-center">
        <Image
          src="/qts-logo.png"
          alt="QTS"
          width={80}
          height={32}
          className="h-8 w-auto object-contain"
          priority
        />
      </Link>

      {/* 3. Location selector dropdown - min-width 180px */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="min-w-[180px] justify-between gap-2 border-border bg-background px-3 hover:bg-muted/50"
          >
            <span className="truncate text-sm font-medium">
              {currentLocation}
            </span>
            <IconChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[180px]">
          {locations.map((loc) => (
            <DropdownMenuItem
              key={loc.id}
              onClick={() => onLocationChange(loc.id)}
              className={cn(
                "cursor-pointer",
                currentLocationId === loc.id && "bg-accent font-medium"
              )}
            >
              {loc.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 4. Search bar - right-aligned section; hidden on mobile, search icon instead */}
      <div className="ml-auto flex flex-1 items-center justify-end gap-4">
        {/* Desktop: full search bar, max-width 400px, gray background */}
        <div className="hidden w-full max-w-[400px] md:block">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 rounded-md border-0 bg-muted/60 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:ring-2"
            />
          </div>
        </div>

        {/* Mobile: search icon button */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open search"
          className="h-9 w-9 shrink-0 md:hidden"
        >
          <IconSearch className="h-5 w-5" />
        </Button>

        {/* 5. Notifications button with badge */}
        <Button
          variant="ghost"
          size="icon"
          aria-label={
            notificationCount > 0
              ? `${notificationCount} notifications`
              : "Notifications"
          }
          className="relative h-9 w-9 shrink-0 rounded-md hover:bg-muted"
        >
          <IconBell className="h-5 w-5" />
          {notificationCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs"
            >
              {notificationCount > 99 ? "99+" : notificationCount}
            </Badge>
          )}
        </Button>

        {/* 6. User avatar with initials */}
        <Avatar className="h-9 w-9 w-9 shrink-0 border-2 border-border">
          <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
            {userInitials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
