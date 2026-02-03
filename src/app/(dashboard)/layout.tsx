import { DashboardLayout } from "@/components/layouts/DashboardLayout/DashboardLayout";

/**
 * Layout for dashboard route group (e.g. To-Do's).
 */
export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
