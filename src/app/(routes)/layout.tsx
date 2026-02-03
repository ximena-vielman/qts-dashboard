import { DashboardLayout } from "@/components/layouts/DashboardLayout/DashboardLayout";

/**
 * Layout for route group: wraps Routes, Tasks, Alerts, Analytics with DashboardLayout.
 */
export default function RoutesGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
