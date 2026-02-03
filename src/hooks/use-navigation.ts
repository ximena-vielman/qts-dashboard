"use client";

import { create } from "zustand";

export interface NavigationState {
  /** Whether both main and secondary nav are visible (true) or hidden (false) */
  isNavExpanded: boolean;
  /** Active main category (e.g. 'work', 'monitor', 'reports') */
  activeCategory: string | null;
  /** Active secondary link (e.g. 'dashboard', 'todos') */
  activeLink: string | null;
  /** Toggle expanded/collapsed. State (activeCategory, activeLink) is preserved. */
  toggleNav: () => void;
  setActiveCategory: (category: string) => void;
  setActiveLink: (link: string | null) => void;
  /** Set expanded state directly (e.g. for mobile init) */
  setNavExpanded: (expanded: boolean) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  isNavExpanded: false,
  activeCategory: "work",
  activeLink: "dashboard",
  toggleNav: () => set((s) => ({ isNavExpanded: !s.isNavExpanded })),
  setActiveCategory: (category) => set({ activeCategory: category }),
  setActiveLink: (link) => set({ activeLink: link ?? null }),
  setNavExpanded: (expanded) => set({ isNavExpanded: expanded }),
}));
