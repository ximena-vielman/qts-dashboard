"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TaskItemProps {
  id: string;
  equipment: string;
  title: string;
  time: string;
  location: string;
  company: string;
  type: string;
  priority: "urgent" | "high" | "medium" | "low";
  completed: boolean;
  onToggle: (id: string) => void;
  onClick?: () => void;
}

const PRIORITY_CONFIG: Record<
  "urgent" | "high" | "medium" | "low",
  { label: string; className: string }
> = {
  urgent: {
    label: "Urgent",
    className:
      "border border-red-200 bg-red-50 text-red-700",
  },
  high: {
    label: "High",
    className:
      "border border-orange-200 bg-orange-50 text-orange-700",
  },
  medium: {
    label: "Medium",
    className:
      "border border-yellow-200 bg-yellow-50 text-yellow-700",
  },
  low: {
    label: "Low",
    className:
      "border border-gray-200 bg-gray-50 text-gray-600",
  },
};

function PriorityBadge({
  priority,
}: {
  priority: "urgent" | "high" | "medium" | "low";
}) {
  const config = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.low;
  return (
    <span
      className={cn(
        "inline-block shrink-0 rounded-md px-3 py-1.5 text-center text-xs font-medium min-w-[70px]",
        config.className
      )}
      aria-label={`Priority: ${config.label}`}
    >
      {config.label}
    </span>
  );
}

export function TaskItem({
  id,
  equipment,
  title,
  time,
  location,
  company,
  type,
  priority,
  completed,
  onToggle,
  onClick,
}: TaskItemProps) {
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(id);
  };

  const handleCheckboxKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onToggle(id);
    }
  };

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        "flex items-start gap-2 py-3 transition-colors duration-150 ease-out md:gap-3",
        "border-b border-gray-100 last:border-b-0",
        "hover:bg-gray-50",
        onClick && "cursor-pointer"
      )}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={handleCheckboxClick}
        onKeyDown={handleCheckboxKeyDown}
        aria-label="Mark task as complete"
        role="checkbox"
        aria-checked={completed}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-150 ease-out",
          "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          completed
            ? "border-0 bg-gray-900"
            : "border-2 border-dashed border-gray-300 bg-transparent hover:border-gray-400"
        )}
      >
        {completed && <Check className="h-3 w-3 text-white" aria-hidden />}
      </button>

      {/* Equipment Badge */}
      <span
        className={cn(
          "shrink-0 rounded px-2 py-1 text-xs font-medium text-gray-700",
          "bg-gray-100 font-mono"
        )}
      >
        {equipment ?? "—"}
      </span>

      {/* Task Details */}
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "text-sm font-medium leading-snug text-gray-900 md:text-base",
            completed && "line-through opacity-50"
          )}
        >
          {title ?? "—"}
        </div>
        <div
          className={cn(
            "mt-1 flex flex-wrap items-center gap-x-2 text-sm text-gray-500",
            completed && "opacity-50"
          )}
        >
          <span>{time ?? "—"}</span>
          <span className="select-none" aria-hidden>•</span>
          <span>{location ?? "—"}</span>
          <span className="select-none" aria-hidden>•</span>
          <span>{company ?? "—"}</span>
          <span className="select-none" aria-hidden>•</span>
          <span>{type ?? "—"}</span>
        </div>
      </div>

      {/* Priority Badge */}
      <PriorityBadge priority={priority} />
    </div>
  );
}

TaskItem.displayName = "TaskItem";
