"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

type EquipmentStatus =
  | "New"
  | "Received"
  | "Awaiting pickup"
  | "Closed"
  | "Cancelled";

interface ChartPoint {
  period: string;
  inbound: number;
  outbound: number;
  loading: number;
}

interface EquipmentItem {
  id: string;
  label: string;
  status: EquipmentStatus;
  when: string;
}

const CHART_DATA: ChartPoint[] = [
  { period: "Mon", inbound: 12, outbound: 8, loading: 5 },
  { period: "Tue", inbound: 15, outbound: 10, loading: 6 },
  { period: "Wed", inbound: 9, outbound: 14, loading: 4 },
  { period: "Thu", inbound: 18, outbound: 9, loading: 8 },
  { period: "Fri", inbound: 11, outbound: 12, loading: 7 },
  { period: "Sat", inbound: 6, outbound: 5, loading: 3 },
  { period: "Sun", inbound: 4, outbound: 6, loading: 2 },
];

const EQUIPMENT_ITEMS: EquipmentItem[] = [
  { id: "1", label: "Rack Unit #A-124", status: "Received", when: "2 hours ago" },
  { id: "2", label: "Server Batch #B-08", status: "Awaiting pickup", when: "Yesterday, 3:00 PM" },
  { id: "3", label: "Switch Unit #C-42", status: "New", when: "Oct 1, 9:15 AM" },
];

const STATUS_STYLES: Record<EquipmentStatus, string> = {
  New: "bg-blue-50 text-blue-700 border-blue-200",
  Received: "bg-green-50 text-green-700 border-green-200",
  "Awaiting pickup": "bg-amber-50 text-amber-700 border-amber-200",
  Closed: "bg-gray-100 text-gray-700 border-gray-200",
  Cancelled: "bg-red-50 text-red-700 border-red-200",
};

/**
 * EquipmentsWidget: Chart of inbound/outbound/loading equipment and recent status items.
 * Placed next to Monitor Health; includes "Track all" link to equipment page.
 */
export function EquipmentsWidget() {
  return (
    <article
      className="flex min-w-0 flex-col rounded-xl bg-white p-6 shadow-md"
      aria-label="Equipment"
    >
      {/* Header */}
      <header className="mb-4 shrink-0">
        <h2 className="text-sm font-semibold uppercase leading-6 tracking-normal text-gray-900">
          Equipment
        </h2>
      </header>

      {/* Chart: Inbound, Outbound, Loading */}
      <div className="mb-6 h-[200px] w-full shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={CHART_DATA}
            margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="period"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 11 }}
              width={24}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
              }}
              formatter={(value: number) => [value, ""]}
              labelFormatter={(label) => `Week: ${label}`}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              iconType="square"
              iconSize={8}
              formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
            />
            <Bar dataKey="inbound" fill="#3B82F6" name="Inbound" radius={[2, 2, 0, 0]} />
            <Bar dataKey="outbound" fill="#14B8A6" name="Outbound" radius={[2, 2, 0, 0]} />
            <Bar dataKey="loading" fill="#F59E0B" name="Loading" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Status list (max 3 items) */}
      <div className="min-h-0 flex-1 space-y-3">
        {EQUIPMENT_ITEMS.slice(0, 3).map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-1 rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2 transition-colors hover:bg-gray-50"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 truncate text-sm font-medium text-gray-900">
                {item.label}
              </p>
              <span
                className={cn(
                  "shrink-0 rounded border px-2 py-0.5 text-xs font-medium",
                  STATUS_STYLES[item.status]
                )}
              >
                {item.status}
              </span>
            </div>
            <span className="text-xs text-gray-500">{item.when}</span>
          </div>
        ))}
      </div>

      {/* Track all */}
      <div className="mt-4 shrink-0 border-t border-gray-100 pt-4">
        <Link
          href="/equipment"
          className="inline-flex items-center text-sm font-medium text-primary hover:underline"
        >
          Track all
          <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
