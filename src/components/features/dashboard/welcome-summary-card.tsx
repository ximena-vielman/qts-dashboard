"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Info } from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

/** Sample data for the welcome summary card */
const mockData = {
  userName: "John Morgan",
  criticalIncidents: 2,
  rounds: 3,
  freeTime: "4pm",
  showScheduleAlert: true,
  metrics: {
    preventive: { value: 12, trend: "up" as const },
    incidents: { value: 7, trend: "down" as const },
    rounds: { value: 2, trend: "up" as const },
    escorts: { value: 3, trend: "up" as const },
  },
  activityData: [20, 35, 70, 50, 40, 80, 55, 25],
};

/** Returns greeting based on hour: 5–11:59 Morning, 12–17:59 Afternoon, 18–4:59 Evening */
function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 18) return "Good Afternoon";
  return "Good Evening";
}

/** Build chart data from activity percentages; labels represent time of day */
function buildChartData(activityValues: number[]) {
  const labels = ["5am", "8am", "10am", "12pm", "2pm", "4pm", "6pm", "8pm"];
  return activityValues.slice(0, 8).map((value, i) => ({
    time: labels[i] ?? `Point ${i + 1}`,
    activity: value,
  }));
}

export function WelcomeSummaryCard() {
  const [showBanner] = useState(mockData.showScheduleAlert);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const metrics = mockData.metrics;
  const chartData = useMemo(
    () => buildChartData(mockData.activityData),
    []
  );

  const dateHeader = useMemo(
    () => format(currentTime, "EEEE, MMMM d").toUpperCase(),
    [currentTime]
  );
  const greeting = useMemo(
    () => getGreeting(currentTime.getHours()),
    [currentTime]
  );

  const alertSummary =
    mockData.criticalIncidents === 0
      ? "You have no critical incidents"
      : `You have ${mockData.criticalIncidents} critical incidents and ${mockData.rounds} maintenance`;
  const scheduleInsight = `You're mostly free at ${mockData.freeTime}`;

  return (
    <article
      className="w-full min-w-0 max-w-full rounded-xl bg-white p-6 shadow-md md:p-8"
      aria-label="Daily summary"
    >
      {/* Section 1: Date header */}
      <p className="mb-2 text-sm font-normal uppercase text-gray-500">
        {dateHeader}
      </p>

      {/* Section 2: Greeting */}
      <h1 className="mb-4 break-words text-2xl font-bold leading-tight text-gray-900 sm:text-3xl md:text-4xl">
        {greeting}, {mockData.userName}
      </h1>

      {/* Section 3: Summary statements */}
      <p className="break-words text-lg font-normal text-gray-700">
        {mockData.criticalIncidents === 0 ? (
          alertSummary
        ) : (
          <>
            You have{" "}
            <span className="font-medium text-primary">{mockData.criticalIncidents}</span>{" "}
            critical incidents and{" "}
            <span className="font-medium text-primary">{mockData.rounds}</span>{" "}
            maintenance
          </>
        )}
      </p>
      <p className="mb-6 break-words text-lg font-normal text-gray-600">{scheduleInsight}</p>

      {/* Section 4: Smart notification banner */}
      {showBanner && (
        <div
          className="mb-6 overflow-hidden rounded-lg border border-primary/20 bg-primary/5 p-4 transition-all duration-200 ease-out"
          role="alert"
          aria-live="polite"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
              <Info
                className="h-5 w-5 shrink-0 text-primary"
                aria-hidden
              />
              <p className="min-w-0 text-sm text-gray-800">
                Your schedule has you bouncing between buildings today
              </p>
            </div>
            <div className="flex shrink-0 sm:ml-0">
              <Link
                href="/todos"
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Optimize
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Section 5: Metrics row */}
      <div className="mb-8 grid min-w-0 grid-cols-2 gap-6 md:grid-cols-4">
        <div>
          <p className="text-xs font-medium uppercase text-gray-500">
            Preventive
          </p>
          <span className="text-3xl font-bold text-gray-900">
            {metrics.preventive.value}
          </span>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-gray-500">
            Incidents
          </p>
          <span className="text-3xl font-bold text-gray-900">
            {metrics.incidents.value}
          </span>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-gray-500">
            Maintenance
          </p>
          <span className="text-3xl font-bold text-gray-900">
            {metrics.rounds.value}
          </span>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-gray-500">
            Changes
          </p>
          <span className="text-3xl font-bold text-gray-900">
            {metrics.escorts.value}
          </span>
        </div>
      </div>

      {/* Section 6: Activity sparkline chart */}
      <div className="h-[120px] min-w-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
          >
            <defs>
              <linearGradient
                id="activityGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#99f6e4" stopOpacity={1} />
                <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.[0] ? (
                  <div className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-md">
                    <span className="text-muted-foreground">
                      {payload[0].payload?.time}:{" "}
                    </span>
                    <span className="font-medium">
                      {payload[0].value}% activity
                    </span>
                  </div>
                ) : null
              }
              cursor={false}
            />
            <Area
              type="monotone"
              dataKey="activity"
              stroke="#14b8a6"
              strokeWidth={2}
              fill="url(#activityGradient)"
              isAnimationActive
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
