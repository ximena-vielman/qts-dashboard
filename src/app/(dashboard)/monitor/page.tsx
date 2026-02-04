"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  BarChart3,
  Map,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Info,
} from "lucide-react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types & mock data
// ---------------------------------------------------------------------------

type TimeRange = "1H" | "24H" | "7D" | "30D";
type MonitorView = "analytics" | "visual";
type MetricStatus = "healthy" | "warning" | "critical";

interface MetricCardData {
  title: string;
  value: string;
  trend: number;
  trendLabel: string;
  status: MetricStatus;
}

interface IncidentStat {
  label: string;
  count: number;
  dotColor: string;
}

interface RecentAlert {
  title: string;
  time: string;
}

interface HealthCardData {
  title: string;
  percentage: number;
  detail: string;
  status: MetricStatus;
}

interface RackUtilData {
  facility: string;
  used: number;
  available: number;
}

interface ResourceMeter {
  label: string;
  used: number;
  total: number;
  unit: string;
}

interface StorageTierData {
  tier: string;
  used: number;
  total: number;
}

interface LimitRow {
  facility: string;
  resource: string;
  current: number;
  capacity: string;
  days: number;
  isWarning: boolean;
}

interface ForecastPoint {
  date: string;
  compute: number;
  memory: number;
  storage: number;
  power: number;
}

const FACILITIES = [
  "All Facilities",
  "ASH1-DC1",
  "ASH1-DC2",
  "ASH1-DC3",
  "PHX1-DC1",
  "DAL1-DC1",
];

const MOCK_METRICS: MetricCardData[] = [
  {
    title: "CPU Utilization",
    value: "68.5%",
    trend: 2.3,
    trendLabel: "vs 24h ago",
    status: "healthy",
  },
  {
    title: "Memory Usage",
    value: "73.2%",
    trend: 1.8,
    trendLabel: "vs 24h ago",
    status: "warning",
  },
  {
    title: "Storage Capacity",
    value: "61.4%",
    trend: -0.5,
    trendLabel: "vs 24h ago",
    status: "healthy",
  },
  {
    title: "Network Traffic",
    value: "2.8 TB/s",
    trend: 5.2,
    trendLabel: "vs 24h ago",
    status: "healthy",
  },
  {
    title: "Power & PUE",
    value: "1.42",
    trend: -0.02,
    trendLabel: "vs 24h ago",
    status: "healthy",
  },
];

const MOCK_INCIDENT_STATS: IncidentStat[] = [
  { label: "Critical", count: 3, dotColor: "bg-red-500" },
  { label: "High", count: 12, dotColor: "bg-orange-500" },
  { label: "Medium", count: 28, dotColor: "bg-yellow-500" },
  { label: "Low", count: 45, dotColor: "bg-gray-400" },
];

const MOCK_RECENT_ALERTS: RecentAlert[] = [
  { title: "Power Spike - ASH1-DC1 - Rack 42", time: "2 minutes ago" },
  { title: "Temperature Threshold - ASH1-DC3 - Zone A", time: "15 minutes ago" },
  { title: "Network Latency - PHX1-DC1", time: "32 minutes ago" },
  { title: "CPU Overload - ASH1-DC2 - Server 127", time: "1h ago" },
];

const MOCK_HEALTH: HealthCardData[] = [
  { title: "Compute Health", percentage: 94, detail: "127 of 135 servers ok", status: "healthy" },
  { title: "Storage Health", percentage: 87, detail: "23 of 28 arrays ok", status: "warning" },
  { title: "Network Health", percentage: 96, detail: "All links operational", status: "healthy" },
];

const MOCK_RACK_UTIL: RackUtilData[] = [
  { facility: "ASH1-DC1", used: 73, available: 27 },
  { facility: "ASH1-DC2", used: 68, available: 32 },
  { facility: "ASH1-DC3", used: 82, available: 18 },
  { facility: "PHX1-DC1", used: 59, available: 41 },
  { facility: "DAL1-DC1", used: 71, available: 29 },
];

const MOCK_RESOURCES: ResourceMeter[] = [
  { label: "Cores", used: 2450, total: 3360, unit: "" },
  { label: "Memory", used: 1250, total: 1840, unit: " GB" },
  { label: "Storage", used: 850, total: 1400, unit: " TB" },
  { label: "Power", used: 8.2, total: 11.0, unit: " MW" },
];

const MOCK_STORAGE_TIERS: StorageTierData[] = [
  { tier: "Tier 1 (Performance)", used: 450, total: 600 },
  { tier: "Tier 2 (Standard)", used: 680, total: 900 },
  { tier: "Tier 3 (Capacity)", used: 920, total: 1200 },
  { tier: "Archive", used: 340, total: 800 },
];

const MOCK_LIMITS: LimitRow[] = [
  { facility: "ASH1-DC3", resource: "Storage", current: 82, capacity: "1,200 TB", days: 23, isWarning: true },
  { facility: "PHX1-DC1", resource: "Power", current: 87, capacity: "9.5 MW", days: 34, isWarning: true },
  { facility: "ASH1-DC1", resource: "Rack Space", current: 78, capacity: "450 racks", days: 67, isWarning: false },
  { facility: "DAL1-DC1", resource: "Memory", current: 71, capacity: "1,600 GB", days: 89, isWarning: false },
  { facility: "ASH1-DC2", resource: "Compute", current: 73, capacity: "3,200 cores", days: 102, isWarning: false },
];

const MOCK_FORECAST: ForecastPoint[] = [
  { date: "Feb 5", compute: 68, memory: 73, storage: 61, power: 74 },
  { date: "Feb 20", compute: 71, memory: 76, storage: 68, power: 77 },
  { date: "Mar 7", compute: 74, memory: 79, storage: 75, power: 79 },
  { date: "Mar 22", compute: 77, memory: 82, storage: 82, power: 81 },
  { date: "Apr 6", compute: 80, memory: 84, storage: 88, power: 83 },
  { date: "Apr 21", compute: 82, memory: 86, storage: 92, power: 85 },
  { date: "May 6", compute: 84, memory: 88, storage: 95, power: 86 },
];

// ---------------------------------------------------------------------------
// Metric card
// ---------------------------------------------------------------------------

function MetricCard({ data }: { data: MetricCardData }) {
  const statusColor =
    data.status === "healthy"
      ? "bg-green-500"
      : data.status === "warning"
        ? "bg-yellow-500"
        : "bg-red-500";
  const trendUp = data.trend >= 0;
  const trendColor = trendUp ? "text-green-600" : "text-red-600";

  return (
    <Card className="h-[140px] border-gray-200 transition-all duration-200 hover:scale-[1.01] hover:shadow-md">
      <CardContent className="relative p-5">
        <div className={`absolute right-5 top-5 h-2 w-2 rounded-full ${statusColor}`} />
        <p className="mb-3 text-sm font-medium text-gray-600">{data.title}</p>
        <p className="mb-2 text-4xl font-bold leading-none text-gray-900">{data.value}</p>
        <div className={cn("flex items-center gap-1 text-xs font-medium", trendColor)}>
          {trendUp ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          <span>
            {trendUp ? "+" : ""}
            {typeof data.trend === "number" && data.trend % 1 !== 0
              ? data.trend.toFixed(2)
              : data.trend}
            % {data.trendLabel}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Gauge (semi-circle SVG)
// ---------------------------------------------------------------------------

function GaugeChart({
  value,
  status,
  size = 120,
}: {
  value: number;
  status: MetricStatus;
  size?: number;
}) {
  const strokeColor =
    status === "healthy"
      ? "#22c55e"
      : status === "warning"
        ? "#eab308"
        : "#ef4444";
  const radius = size / 2 - 8;
  const circumference = Math.PI * radius;
  const offset = circumference * (1 - value / 100);

  return (
    <div className="flex justify-center">
      <svg width={size} height={size / 2 + 16} className="overflow-visible">
        <path
          d={`M ${8} ${size / 2 + 4} A ${radius} ${radius} 0 0 0 ${size - 8} ${size / 2 + 4}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d={`M ${8} ${size / 2 + 4} A ${radius} ${radius} 0 0 0 ${size - 8} ${size / 2 + 4}`}
          fill="none"
          stroke={strokeColor}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
        <text
          x={size / 2}
          y={size / 2 - 4}
          textAnchor="middle"
          className="text-2xl font-bold fill-gray-900"
        >
          {value}%
        </text>
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Health card
// ---------------------------------------------------------------------------

function HealthCard({ data }: { data: HealthCardData }) {
  const statusColor =
    data.status === "healthy"
      ? "text-green-600"
      : data.status === "warning"
        ? "text-yellow-600"
        : "text-red-600";
  const dotColor =
    data.status === "healthy"
      ? "bg-green-500"
      : data.status === "warning"
        ? "bg-yellow-500"
        : "bg-red-500";

  return (
    <Card className="h-[320px] border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-gray-900">{data.title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <GaugeChart value={data.percentage} status={data.status} size={160} />
        <div className={cn("mt-4 flex items-center gap-2 text-sm font-medium", statusColor)}>
          <div className={cn("h-2 w-2 rounded-full", dotColor)} />
          {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
        </div>
        <p className="mt-2 text-sm text-gray-600">{data.detail}</p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function MonitorPage() {
  const [activeView, setActiveView] = useState<MonitorView>("analytics");
  const [selectedFacility, setSelectedFacility] = useState("All Facilities");
  const [timeRange, setTimeRange] = useState<TimeRange>("24H");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  }, []);

  useEffect(() => {
    const interval = setInterval(refreshData, 30_000);
    return () => clearInterval(interval);
  }, [refreshData]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-50">
      {/* Page header */}
      <header className="sticky top-0 z-10 flex h-20 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-8 py-6">
        <div>
          <nav className="text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-900">
              Dashboard
            </Link>
            <span className="mx-1.5">/</span>
            <span>Monitor</span>
          </nav>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Monitor</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Facility selector */}
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="h-9 w-[180px] appearance-none rounded-md border border-gray-300 bg-white pl-9 pr-8 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {FACILITIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          {/* Time range */}
          <div className="inline-flex rounded-md bg-gray-100 p-0.5">
            {(["1H", "24H", "7D", "30D"] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={cn(
                  "rounded px-2.5 py-1.5 text-sm font-medium transition-all duration-150",
                  timeRange === range
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                {range}
              </button>
            ))}
          </div>
          {/* View toggle */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveView("analytics")}
              aria-label="Analytics view"
              aria-pressed={activeView === "analytics"}
              title="Analytics view"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-md transition-all duration-150",
                activeView === "analytics"
                  ? "bg-gray-900 text-white border border-gray-900"
                  : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
              )}
            >
              <BarChart3 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveView("visual")}
              aria-label="Visual view"
              aria-pressed={activeView === "visual"}
              title="Visual view"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-md transition-all duration-150",
                activeView === "visual"
                  ? "bg-gray-900 text-white border border-gray-900"
                  : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
              )}
            >
              <Map className="h-4 w-4" />
            </button>
          </div>
          {/* Refresh */}
          <button
            type="button"
            onClick={refreshData}
            disabled={isRefreshing}
            aria-label="Refresh"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 transition-all hover:bg-gray-50",
              isRefreshing && "animate-spin"
            )}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Content */}
      {activeView === "analytics" && (
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1600px] space-y-6 p-8">
            {/* Section 1: Key metrics */}
            <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {MOCK_METRICS.map((m) => (
                <MetricCard key={m.title} data={m} />
              ))}
            </section>

            {/* Section 2: Incidents & Alerts */}
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base font-semibold text-gray-900">
                      Incidents & Alerts
                    </CardTitle>
                    <p className="mt-0.5 text-xs text-gray-500">Last 24 hours</p>
                  </div>
                  <Link
                    href="/alerts"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View All
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {MOCK_INCIDENT_STATS.map((s) => (
                      <div
                        key={s.label}
                        className="rounded-lg border border-gray-100 bg-gray-50/50 p-4"
                      >
                        <p className="text-xs font-medium uppercase text-gray-500">
                          {s.label}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <div
                            className={cn("h-2.5 w-2.5 rounded-full", s.dotColor)}
                          />
                          <span className="text-3xl font-bold text-gray-900">
                            {s.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Recent Critical Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="divide-y divide-gray-100">
                    {MOCK_RECENT_ALERTS.map((a, i) => (
                      <li
                        key={i}
                        className="py-3 transition-colors first:pt-0 hover:bg-gray-50"
                      >
                        <div className="flex gap-2">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {a.title}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">{a.time}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* Section 3: System health */}
            <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {MOCK_HEALTH.map((h) => (
                <HealthCard key={h.title} data={h} />
              ))}
            </section>

            {/* Section 4: Capacity & utilization */}
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              <Card className="border-gray-200 lg:col-span-3">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-gray-900">
                    Rack Space Utilization
                  </CardTitle>
                  <p className="text-xs text-gray-500">By Facility</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <RechartsBarChart
                      data={MOCK_RACK_UTIL}
                      layout="vertical"
                      margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
                    >
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <YAxis
                        type="category"
                        dataKey="facility"
                        width={80}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip formatter={(v: number) => [`${v}%`, "Used"]} />
                      <Bar dataKey="used" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      <Bar
                        dataKey="available"
                        fill="#e5e7eb"
                        radius={[0, 4, 4, 0]}
                        stackId="a"
                      />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="border-gray-200 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-gray-900">
                    Compute Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {MOCK_RESOURCES.map((r) => {
                    const pct = Math.round((r.used / r.total) * 100);
                    return (
                      <div key={r.label}>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700">{r.label}</span>
                          <span className="font-semibold text-gray-900">{pct}%</span>
                        </div>
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {r.used.toLocaleString()}
                          {r.unit} / {r.total.toLocaleString()}
                          {r.unit}
                        </p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </section>

            {/* Section 5: Storage & power */}
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-gray-900">
                    Storage Capacity by Tier
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <RechartsBarChart
                      data={MOCK_STORAGE_TIERS.map((t) => ({
                        ...t,
                        used: t.used,
                        available: t.total - t.used,
                      }))}
                      margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                    >
                      <XAxis dataKey="tier" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="used" stackId="a" fill="hsl(var(--primary))" name="Used" />
                      <Bar
                        dataKey="available"
                        stackId="a"
                        fill="#e5e7eb"
                        name="Available"
                      />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-semibold text-gray-900">
                    Power Draw & Capacity
                  </CardTitle>
                  <span className="text-xs text-gray-500">Current load</span>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-primary">8.2 MW</p>
                  <p className="text-sm text-gray-600">Current draw</p>
                  <div className="mt-4 h-6 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: "74%" }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-gray-500">
                    <span>0 MW</span>
                    <span>11.0 MW</span>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-2 text-sm">
                    <p className="text-gray-600">
                      <span className="font-medium text-gray-900">Peak today:</span> 9.1 MW at
                      2:00 PM
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium text-gray-900">Average:</span> 7.8 MW
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium text-gray-900">Capacity remaining:</span> 2.8
                      MW (26%)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 6: Capacity forecast */}
            <Card className="border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-gray-900">
                    Capacity Growth Forecast
                  </CardTitle>
                  <p className="mt-0.5 text-xs text-gray-500">Next 90 days</p>
                </div>
                <span
                  className="flex items-center gap-1 text-xs text-gray-500"
                  title="Projected based on current trends"
                >
                  <Info className="h-3.5 w-3.5" />
                  Projected
                </span>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={MOCK_FORECAST} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(v: number) => [`${v}%`, ""]} />
                    <ReferenceLine
                      y={90}
                      stroke="#fca5a5"
                      strokeDasharray="4 4"
                      label={{ value: "Capacity limit", position: "right", fontSize: 10 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="compute"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      name="Compute"
                    />
                    <Line
                      type="monotone"
                      dataKey="memory"
                      stroke="#a855f7"
                      strokeWidth={2}
                      dot={false}
                      name="Memory"
                    />
                    <Line
                      type="monotone"
                      dataKey="storage"
                      stroke="#14b8a6"
                      strokeWidth={2}
                      dot={false}
                      name="Storage"
                    />
                    <Line
                      type="monotone"
                      dataKey="power"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={false}
                      name="Power"
                    />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Section 7: Facilities approaching limits */}
            <Card className="border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900">
                  Facilities Approaching Limits
                </CardTitle>
                <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                  3 warnings
                </span>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto rounded-b-lg border border-t-0 border-gray-200">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-600">
                        <th className="px-4 py-3">Facility</th>
                        <th className="px-4 py-3">Resource</th>
                        <th className="px-4 py-3">Current</th>
                        <th className="px-4 py-3">Capacity</th>
                        <th className="px-4 py-3">Days to Limit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_LIMITS.map((row, i) => (
                        <tr
                          key={i}
                          className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50"
                        >
                          <td className="px-4 py-4 font-medium text-gray-900">
                            {row.facility}
                          </td>
                          <td className="px-4 py-4 text-gray-700">{row.resource}</td>
                          <td className="px-4 py-4">
                            <span
                              className={cn(
                                "font-semibold",
                                row.current > 85
                                  ? "text-orange-600"
                                  : row.current >= 70
                                    ? "text-yellow-600"
                                    : "text-gray-900"
                              )}
                            >
                              {row.current}%
                            </span>
                          </td>
                          <td className="px-4 py-4 text-gray-600">{row.capacity}</td>
                          <td className="px-4 py-4">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1",
                                row.isWarning ? "text-orange-600 font-medium" : "text-gray-600"
                              )}
                            >
                              {row.isWarning && (
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                              )}
                              {row.days} days
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Visual view placeholder */}
      {activeView === "visual" && (
        <div
          className="flex flex-1 items-center justify-center bg-gray-100"
          style={{ minHeight: "calc(100vh - 80px)" }}
        >
          <div className="flex flex-col items-center text-center">
            <Map className="mb-4 h-16 w-16 text-gray-400" />
            <h2 className="text-2xl font-semibold text-gray-900">
              Visual Monitor View
            </h2>
            <p className="mt-3 max-w-sm text-base text-gray-600">
              Live facility map with equipment visualization
            </p>
            <span className="mt-5 rounded-2xl bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700">
              Coming Soon
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
