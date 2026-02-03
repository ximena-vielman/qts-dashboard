"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layouts/DashboardLayout/DashboardLayout";
import { WelcomeSummaryCard } from "@/components/features/dashboard/welcome-summary-card";
import { MonitorLiveWidget } from "@/components/features/dashboard/monitor-live-widget";
import { RoundsWidget } from "@/components/features/dashboard/rounds-widget";
import { EscortsStaysWidget } from "@/components/features/dashboard/escorts-stays-widget";
import { MonitorHealthWidget } from "@/components/features/dashboard/monitor-health-widget";
import { EquipmentsWidget } from "@/components/features/dashboard/equipments-widget";
import { TaskList, type FilterTab } from "@/components/features/TaskList/TaskList";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Welcome dashboard: WelcomeSummaryCard, MonitorLiveWidget, and To-Do's widget.
 */
export default function HomePage() {
  const [todoFilter, setTodoFilter] = useState<FilterTab>("urgent");

  return (
    <DashboardLayout>
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Row 1: Welcome card (1/3) + Monitor card (2/3) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-1">
              <WelcomeSummaryCard />
            </div>
            <div className="lg:col-span-2">
              <MonitorLiveWidget />
            </div>
          </div>

          {/* Row 2: To-Do's, Rounds, Escorts & Stays - equal height, flex to avoid overlap */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch">
            <div className="flex min-h-0 min-w-0 flex-col lg:h-full">
              <Card className="flex h-full min-w-0 flex-col overflow-hidden">
                <CardHeader className="shrink-0 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold uppercase leading-6 tracking-normal">To-Do&apos;s</CardTitle>
                <div
                  role="tablist"
                  aria-label="Filter to-do's by urgency"
                  className="inline-flex w-fit rounded-lg bg-gray-50 p-0.5"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={todoFilter === "urgent"}
                    onClick={() => setTodoFilter("urgent")}
                    className={cn(
                      "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                      todoFilter === "urgent"
                        ? "bg-[#18181B] text-white"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    Urgent
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={todoFilter === "upcoming"}
                    onClick={() => setTodoFilter("upcoming")}
                    className={cn(
                      "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                      todoFilter === "upcoming"
                        ? "bg-[#18181B] text-white"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    Upcoming
                  </button>
                </div>
              </CardHeader>
                <CardContent className="flex min-h-0 flex-1 flex-col pt-0">
                  <div className="min-h-0 flex-1">
                    <TaskList filter={todoFilter} />
                  </div>
                  <div className="mt-4 shrink-0 border-t border-gray-100 pt-3">
                    <Link
                      href="/todos"
                      className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                    >
                      View all
                      <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex min-h-0 min-w-0 flex-col lg:h-full">
              <RoundsWidget />
            </div>
            <div className="flex min-h-0 min-w-0 flex-col lg:h-full">
              <EscortsStaysWidget />
            </div>
          </div>

          {/* Row 3: Monitor Health (2/3) + Equipments (1/3) */}
          <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="min-w-0 overflow-x-hidden lg:col-span-2">
              <MonitorHealthWidget />
            </div>
            <div className="flex min-h-0 min-w-0 flex-col lg:col-span-1">
              <EquipmentsWidget />
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
