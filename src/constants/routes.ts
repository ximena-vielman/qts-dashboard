/**
 * Route constants for navigation and API paths.
 */
export const APP_ROUTES = {
  home: "/",
  routes: "/routes",
  tasks: "/tasks",
  alerts: "/alerts",
  analytics: "/analytics",
} as const;

export const SIDEBAR_NAV = [
  { label: "Dashboard", href: APP_ROUTES.home },
  { label: "Routes", href: APP_ROUTES.routes },
  { label: "Tasks", href: APP_ROUTES.tasks },
  { label: "Alerts", href: APP_ROUTES.alerts },
  { label: "Analytics", href: APP_ROUTES.analytics },
] as const;
