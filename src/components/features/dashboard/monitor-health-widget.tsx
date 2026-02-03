"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

type MetricTabId = "energy" | "network" | "storage" | "utilization";
type TimeRange = "1d" | "7d" | "1m";

interface ChartPoint {
  time: string;
  series1: number;
  series2: number;
}

interface BreakdownRow {
  resource: string;
  percentage: number;
  provisioned: number;
  quota: number;
  capacity: number;
}

interface TabData {
  value: string;
  chartData: ChartPoint[];
  breakdown: BreakdownRow[];
}

const MOCK_DATA: Record<MetricTabId, TabData> = {
  utilization: {
    value: "97%",
    chartData: [
      { time: "09/29 00:00", series1: 45, series2: 30 },
      { time: "09/29 03:00", series1: 52, series2: 35 },
      { time: "09/29 06:00", series1: 78, series2: 55 },
      { time: "09/29 09:00", series1: 85, series2: 70 },
      { time: "09/29 12:00", series1: 90, series2: 75 },
      { time: "09/29 15:00", series1: 95, series2: 80 },
      { time: "09/29 18:00", series1: 88, series2: 72 },
      { time: "09/29 21:00", series1: 75, series2: 60 },
    ],
    breakdown: [
      { resource: "CPU (NCPUS)", percentage: 69.5, provisioned: 1254, quota: 2000, capacity: 3500 },
      { resource: "Disk (GIB)", percentage: 17.8, provisioned: 1254, quota: 2000, capacity: 3500 },
      { resource: "Memory (GIB)", percentage: 48.6, provisioned: 1254, quota: 2000, capacity: 3500 },
    ],
  },
  energy: {
    value: "48%",
    chartData: [
      { time: "09/29 00:00", series1: 40, series2: 25 },
      { time: "09/29 03:00", series1: 42, series2: 28 },
      { time: "09/29 06:00", series1: 55, series2: 38 },
      { time: "09/29 09:00", series1: 60, series2: 45 },
      { time: "09/29 12:00", series1: 58, series2: 42 },
      { time: "09/29 15:00", series1: 52, series2: 40 },
      { time: "09/29 18:00", series1: 48, series2: 35 },
      { time: "09/29 21:00", series1: 45, series2: 32 },
    ],
    breakdown: [
      { resource: "Power (kW)", percentage: 48, provisioned: 1200, quota: 2500, capacity: 5000 },
      { resource: "Cooling", percentage: 35, provisioned: 800, quota: 2200, capacity: 4000 },
    ],
  },
  network: {
    value: "87%",
    chartData: [
      { time: "09/29 00:00", series1: 70, series2: 50 },
      { time: "09/29 03:00", series1: 72, series2: 52 },
      { time: "09/29 06:00", series1: 80, series2: 60 },
      { time: "09/29 09:00", series1: 88, series2: 68 },
      { time: "09/29 12:00", series1: 90, series2: 72 },
      { time: "09/29 15:00", series1: 85, series2: 65 },
      { time: "09/29 18:00", series1: 82, series2: 62 },
      { time: "09/29 21:00", series1: 78, series2: 58 },
    ],
    breakdown: [
      { resource: "Inbound (Gbps)", percentage: 87, provisioned: 1740, quota: 2000, capacity: 2500 },
      { resource: "Outbound (Gbps)", percentage: 72, provisioned: 1440, quota: 2000, capacity: 2500 },
    ],
  },
  storage: {
    value: "48%",
    chartData: [
      { time: "09/29 00:00", series1: 42, series2: 28 },
      { time: "09/29 03:00", series1: 44, series2: 30 },
      { time: "09/29 06:00", series1: 48, series2: 35 },
      { time: "09/29 09:00", series1: 50, series2: 38 },
      { time: "09/29 12:00", series1: 49, series2: 36 },
      { time: "09/29 15:00", series1: 47, series2: 34 },
      { time: "09/29 18:00", series1: 46, series2: 33 },
      { time: "09/29 21:00", series1: 45, series2: 32 },
    ],
    breakdown: [
      { resource: "SSD (TB)", percentage: 48, provisioned: 960, quota: 2000, capacity: 4000 },
      { resource: "HDD (TB)", percentage: 35, provisioned: 700, quota: 2000, capacity: 3500 },
    ],
  },
};

const TABS: { id: MetricTabId; label: string }[] = [
  { id: "energy", label: "Energy consumption" },
  { id: "network", label: "Network" },
  { id: "storage", label: "Storage" },
  { id: "utilization", label: "Utilization" },
];

function formatNumber(n: number): string {
  if (n >= 1000) return n.toLocaleString();
  return String(n);
}

function getPercentageColor(p: number): string {
  if (p >= 91) return "text-red-600";
  if (p >= 76) return "text-orange-700";
  if (p >= 51) return "text-orange-600";
  return "text-gray-900";
}

function MetricTab({
  label,
  value,
  isActive,
  onClick,
}: {
  label: string;
  value: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={cn(
        "flex flex-1 flex-col border-b-4 px-4 py-4 text-left transition-all duration-200 ease-out",
        "border-r border-gray-100 last:border-r-0",
        isActive
          ? "border-b-primary bg-gray-50/50"
          : "border-b-transparent hover:border-b-gray-200 hover:bg-gray-50"
      )}
    >
      <span
        className={cn(
          "mb-2 text-sm font-normal leading-snug",
          isActive ? "text-gray-900" : "text-gray-600"
        )}
      >
        {label}
      </span>
      <span className="text-3xl font-bold leading-none text-gray-900">
        {value}
      </span>
    </button>
  );
}

function BreakdownTable({ rows }: { rows: BreakdownRow[] }) {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full table-fixed border-collapse text-sm">
        <thead>
          <tr className="h-11 border-b border-gray-200 bg-gray-50">
            <th className="text-left text-xs font-medium text-gray-600 px-4 py-3">
              Resource
            </th>
            <th className="text-right text-xs font-medium text-gray-600 px-4 py-3 w-[15%]">
              Usage
            </th>
            <th className="text-right text-xs font-medium text-gray-600 px-4 py-3 w-[18%]">
              Provisioned
            </th>
            <th className="text-right text-xs font-medium text-gray-600 px-4 py-3 w-[18%]">
              Quota
            </th>
            <th className="text-right text-xs font-medium text-gray-600 px-4 py-3 w-[18%]">
              Capacity
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.resource}
              className={cn(
                "h-14 border-b border-gray-100 last:border-b-0 transition-colors hover:bg-gray-50",
                i % 2 === 0 ? "bg-white" : "bg-white"
              )}
            >
              <td className="px-4 py-4 font-normal text-gray-900">
                {row.resource}
              </td>
              <td className={cn("px-4 py-4 text-right font-normal", getPercentageColor(row.percentage))}>
                {row.percentage.toFixed(1)}%
              </td>
              <td className="px-4 py-4 text-right font-normal text-gray-900">
                {formatNumber(row.provisioned)}
              </td>
              <td className="px-4 py-4 text-right font-normal text-gray-900">
                {formatNumber(row.quota)}
              </td>
              <td className="px-4 py-4 text-right font-normal text-gray-900">
                {formatNumber(row.capacity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * MonitorHealthWidget: Data center performance metrics with metric tabs,
 * time-series chart, and breakdown table. Full width of dashboard.
 */
export function MonitorHealthWidget() {
  const [activeTab, setActiveTab] = useState<MetricTabId>("utilization");
  const [timeRange, setTimeRange] = useState<TimeRange>("1d");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const tabData = useMemo(() => MOCK_DATA[activeTab], [activeTab]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  return (
    <article
      className="min-w-0 w-full max-w-full rounded-xl bg-white p-6 shadow-md md:p-8"
      aria-label="Monitor health"
    >
      {/* Header: 60px, title + time range + refresh */}
      <header className="mb-6 flex h-[60px] flex-wrap items-center justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">
          Monitor Health
        </h2>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md bg-gray-50 p-0.5">
            {(["1d", "7d", "1m"] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={cn(
                  "min-w-[44px] rounded px-3.5 py-1 text-center text-xs font-medium transition-colors",
                  timeRange === range
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                {range === "1d" ? "1D" : range === "7d" ? "7D" : "1M"}
              </button>
            ))}
          </div>
          <span
            className="h-6 w-px bg-gray-200 mx-1"
            aria-hidden
          />
          <button
            type="button"
            onClick={handleRefresh}
            aria-label="Refresh data"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 transition-colors hover:bg-gray-100",
              isRefreshing && "animate-spin"
            )}
          >
            <RefreshCw className="h-[18px] w-[18px] text-gray-600" aria-hidden />
          </button>
        </div>
      </header>

      {/* Metric tabs */}
      <div
        role="tablist"
        aria-label="Metric category"
        className="mb-8 flex h-20 border-b border-gray-100"
      >
        {TABS.map((tab) => (
          <MetricTab
            key={tab.id}
            label={tab.label}
            value={MOCK_DATA[tab.id].value}
            isActive={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </div>

      {/* Chart */}
      <div className="mb-8 h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={tabData.chartData}
            margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
          >
            <defs>
              <linearGradient id="colorSeries1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FDE68A" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#FDE68A" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSeries2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#99F6E4" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#99F6E4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="0"
              stroke="#f3f4f6"
              horizontal
              vertical={false}
            />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 11 }}
            />
            <Area
              type="monotone"
              dataKey="series1"
              stroke="#F59E0B"
              strokeWidth={2}
              fill="url(#colorSeries1)"
              isAnimationActive
              animationDuration={300}
            />
            <Area
              type="monotone"
              dataKey="series2"
              stroke="#14B8A6"
              strokeWidth={2}
              fill="url(#colorSeries2)"
              isAnimationActive
              animationDuration={300}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Breakdown */}
      <p className="mb-4 text-sm font-normal text-gray-500">Breakdown</p>
      <div className="mb-8">
        <BreakdownTable rows={tabData.breakdown} />
      </div>

      {/* Footer */}
      <div className="pt-2">
        <Link
          href="/monitor"
          className="text-sm font-medium text-primary hover:underline hover:text-primary/90"
        >
          View full monitoring
        </Link>
      </div>
    </article>
  );
}
