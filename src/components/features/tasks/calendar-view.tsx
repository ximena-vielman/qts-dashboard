"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  isToday,
  isSameDay,
  startOfDay,
  parseISO,
  isWithinInterval,
} from "date-fns";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types (Task shape matches todos page; optional date for calendar)
// ---------------------------------------------------------------------------

export interface CalendarTask {
  id: string;
  equipment: string;
  title: string;
  location: string;
  company: string;
  type: string;
  priority: "urgent" | "high" | "medium" | "low";
  category: string;
  startTime: string;
  endTime: string;
  duration: number;
  completed: boolean;
  conflictsWith: string[];
  date?: string; // ISO date "YYYY-MM-DD" when task is scheduled
}

export interface CalendarViewProps {
  tasks: CalendarTask[];
  mode: "day" | "week";
  onModeChange: (mode: "day" | "week") => void;
  onTaskClick?: (taskId: string) => void;
  selectedTaskId?: string | null;
}

const HOUR_HEIGHT = 60;
const TIME_COLUMN_WIDTH_WEEK = 60;
const TIME_COLUMN_WIDTH_DAY = 80;
const CALENDAR_HEADER_HEIGHT = 60;

/** Parse "9:00 AM" to decimal hours (9), "2:30 PM" to 14.5 */
function parseTimeToHours(timeStr: string): number {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours + minutes / 60;
}

function formatTime(timeStr: string): string {
  return timeStr; // already "9:00 AM"
}

const PRIORITY_BORDER: Record<CalendarTask["priority"], string> = {
  urgent: "border-l-red-500",
  high: "border-l-orange-500",
  medium: "border-l-yellow-500",
  low: "border-l-gray-400",
};

const PRIORITY_BG: Record<CalendarTask["priority"], string> = {
  urgent: "bg-red-50",
  high: "bg-orange-50",
  medium: "bg-yellow-50",
  low: "bg-gray-100",
};

const PRIORITY_LABEL: Record<CalendarTask["priority"], string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

// ---------------------------------------------------------------------------
// CalendarTaskBlock
// ---------------------------------------------------------------------------

interface CalendarTaskBlockProps {
  task: CalendarTask;
  mode: "day" | "week";
  onClick: (taskId: string) => void;
  isSelected?: boolean;
}

function CalendarTaskBlock({
  task,
  mode,
  onClick,
  isSelected,
}: CalendarTaskBlockProps) {
  const priorityBorder = PRIORITY_BORDER[task.priority];
  const priorityBg = PRIORITY_BG[task.priority];

  return (
    <button
      type="button"
      onClick={() => onClick(task.id)}
      className={cn(
        "absolute left-0.5 right-0.5 z-10 cursor-pointer rounded border border-[#C3C3C3] text-left transition-all duration-150",
        "border-l-4",
        priorityBorder,
        !task.completed && priorityBg,
        task.completed && "bg-gray-50 opacity-60",
        "hover:shadow-sm hover:bg-gray-200/80",
        isSelected && "ring-2 ring-primary-500 ring-offset-1 shadow-md"
      )}
      style={{
        padding: mode === "week" ? 8 : 12,
      }}
    >
      {mode === "week" ? (
        <div className="calendar-task-block-week flex flex-col gap-0.5 overflow-hidden">
          <div className="truncate text-xs font-semibold text-gray-900">
            {task.equipment}
          </div>
          <div className="truncate text-xs text-gray-600">{task.title}</div>
          <div className="text-xs text-gray-500">
            {formatTime(task.startTime)}
          </div>
        </div>
      ) : (
        <div className="calendar-task-block-day flex flex-col">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">
              {task.equipment}
            </span>
            <span
              className={cn(
                "rounded px-2 py-0.5 text-xs font-medium",
                priorityBg,
                "text-gray-700"
              )}
            >
              {PRIORITY_LABEL[task.priority]}
            </span>
          </div>
          <div className="mb-2 text-sm text-gray-700">{task.title}</div>
          <div className="text-xs text-gray-500">
            {task.location} • {task.company}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {formatTime(task.startTime)} - {formatTime(task.endTime)}
          </div>
        </div>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// CalendarView
// ---------------------------------------------------------------------------

export function CalendarView({
  tasks,
  mode,
  onModeChange,
  onTaskClick,
  selectedTaskId = null,
}: CalendarViewProps) {
  const [viewStart, setViewStart] = useState(() => {
    const now = new Date();
    return mode === "week" ? startOfWeek(now, { weekStartsOn: 1 }) : startOfDay(now);
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [nowTick, setNowTick] = useState(0);
  const now = useMemo(() => new Date(), [nowTick]);

  useEffect(() => {
    const interval = setInterval(() => setNowTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  const displayStart = useMemo(() => {
    return mode === "week"
      ? startOfWeek(viewStart, { weekStartsOn: 1 })
      : startOfDay(viewStart);
  }, [viewStart, mode]);

  const displayEnd = useMemo(() => {
    return mode === "week"
      ? endOfWeek(displayStart, { weekStartsOn: 1 })
      : addDays(displayStart, 1);
  }, [displayStart, mode]);

  const dateLabel = useMemo(() => {
    if (mode === "week") {
      const endDay = addDays(displayStart, 6);
      return `${format(displayStart, "MMMM d")}–${format(endDay, "d, yyyy")}`;
    }
    return format(displayStart, "EEEE, MMMM d, yyyy");
  }, [displayStart, mode]);

  const days = useMemo(() => {
    if (mode === "week") {
      return Array.from({ length: 7 }, (_, i) => addDays(displayStart, i));
    }
    return [displayStart];
  }, [displayStart, mode]);

  const goPrev = useCallback(() => {
    setViewStart((d) =>
      mode === "week" ? addWeeks(d, -1) : addDays(d, -1)
    );
  }, [mode]);

  const goNext = useCallback(() => {
    setViewStart((d) =>
      mode === "week" ? addWeeks(d, 1) : addDays(d, 1)
    );
  }, [mode]);

  const goToday = useCallback(() => {
    const today = new Date();
    setViewStart(
      mode === "week" ? startOfWeek(today, { weekStartsOn: 1 }) : startOfDay(today)
    );
    setTimeout(() => {
      const hour = today.getHours() + today.getMinutes() / 60;
      const scrollTop = hour * HOUR_HEIGHT - 100;
      scrollRef.current?.scrollTo({ top: Math.max(0, scrollTop), behavior: "smooth" });
    }, 50);
  }, [mode]);

  const timeColumnWidth =
    mode === "week" ? TIME_COLUMN_WIDTH_WEEK : TIME_COLUMN_WIDTH_DAY;
  const gridHeight = 24 * HOUR_HEIGHT;

  /** Get the date for a task: use task.date if ISO string, else use first day of view (so all tasks show on first day) */
  const getTaskDate = useCallback(
    (task: CalendarTask): Date => {
      if (task.date) {
        try {
          return parseISO(task.date);
        } catch {
          return displayStart;
        }
      }
      return displayStart;
    },
    [displayStart]
  );

  const tasksInRange = useMemo(() => {
    return tasks.filter((task) => {
      const taskDate = getTaskDate(task);
      return isWithinInterval(taskDate, {
        start: displayStart,
        end: displayEnd,
      });
    });
  }, [tasks, displayStart, displayEnd, getTaskDate]);

  const currentTimeTop = now.getHours() * HOUR_HEIGHT + (now.getMinutes() / 60) * HOUR_HEIGHT;
  const nowLabel = `Now - ${format(now, "h:mm a")}`;

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Calendar header */}
      <div
        className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-4"
        style={{ height: CALENDAR_HEADER_HEIGHT }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <span className="ml-4 shrink-0 text-base font-semibold text-gray-900">
            {dateLabel}
          </span>
          <button
            type="button"
            onClick={goToday}
            className="ml-3 shrink-0 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Today
          </button>
        </div>
        <div className="inline-flex rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => onModeChange("day")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150",
              mode === "day"
                ? "bg-white font-semibold text-gray-900 shadow-sm"
                : "bg-transparent text-gray-600 hover:text-gray-900"
            )}
          >
            Day
          </button>
          <button
            type="button"
            onClick={() => onModeChange("week")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150",
              mode === "week"
                ? "bg-white font-semibold text-gray-900 shadow-sm"
                : "bg-transparent text-gray-600 hover:text-gray-900"
            )}
          >
            Week
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto"
        style={{ minHeight: 400 }}
      >
        <div
          className="relative"
          style={{ height: CALENDAR_HEADER_HEIGHT + gridHeight }}
        >
          {/* Time column + day columns */}
          <div className="flex border-b border-gray-100">
            <div
              className="shrink-0 border-r border-gray-100 pr-2 text-right text-xs text-gray-500"
              style={{ width: timeColumnWidth }}
            >
              <div style={{ height: CALENDAR_HEADER_HEIGHT }} />
              {Array.from({ length: 24 }, (_, i) => (
                <div
                  key={i}
                  style={{ height: HOUR_HEIGHT }}
                  className="py-1"
                >
                  {i === 0
                    ? "12am"
                    : i === 12
                      ? "12pm"
                      : i < 12
                        ? `${i}am`
                        : `${i - 12}pm`}
                </div>
              ))}
            </div>
            <div className="flex flex-1">
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "flex-1 shrink-0 border-r border-gray-100 last:border-r-0",
                    mode === "week" && "min-w-0"
                  )}
                  style={{
                    minWidth: mode === "day" ? 200 : undefined,
                  }}
                >
                  <div
                    className={cn(
                      "border-b border-gray-100 py-2 text-center text-xs font-medium",
                      isToday(day) && "bg-primary-50 text-primary-600"
                    )}
                    style={{ height: CALENDAR_HEADER_HEIGHT }}
                  >
                    {mode === "week"
                      ? format(day, "EEE d")
                      : format(day, "EEEE, MMM d")}
                  </div>
                  <div
                    className="relative"
                    style={{ height: 24 * HOUR_HEIGHT }}
                  >
                    {/* Hour grid lines */}
                    {Array.from({ length: 25 }, (_, i) => (
                      <div
                        key={i}
                        className="absolute left-0 right-0 border-t border-gray-100"
                        style={{ top: i * HOUR_HEIGHT }}
                      />
                    ))}
                    {/* Task blocks for this day */}
                    {tasksInRange
                      .filter((task) =>
                        isSameDay(getTaskDate(task), day)
                      )
                      .map((task) => {
                        const startHours = parseTimeToHours(task.startTime);
                        const duration = task.duration || 1;
                        const top = startHours * HOUR_HEIGHT;
                        const height = duration * HOUR_HEIGHT;
                        return (
                          <div
                            key={task.id}
                            className="absolute left-0 right-0 overflow-hidden"
                            style={{
                              top,
                              height: Math.max(height, 24),
                              width: mode === "week" ? "90%" : "95%",
                              marginLeft: mode === "week" ? "5%" : "2.5%",
                            }}
                          >
                            <CalendarTaskBlock
                              task={task}
                              mode={mode}
                              onClick={onTaskClick ?? (() => {})}
                              isSelected={selectedTaskId === task.id}
                            />
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current time indicator - full width */}
          <div
            className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
            style={{
              top: currentTimeTop + CALENDAR_HEADER_HEIGHT,
            }}
          >
            <div className="h-0.5 flex-1 bg-red-500 shadow-sm" />
            <div className="flex h-3 w-3 shrink-0 rounded-full border-2 border-white bg-red-500" />
            <span className="ml-2 rounded bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-600">
              {nowLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
