"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpDown,
  Calendar,
  Menu,
  Search,
  Sparkles,
  AlertTriangle,
  Check,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Task {
  id: string;
  equipment: string;
  title: string;
  location: string;
  company: string;
  type: string;
  priority: "urgent" | "high" | "medium" | "low";
  category: "urgent" | "upcoming";
  startTime: string;
  endTime: string;
  duration: number;
  completed: boolean;
  conflictsWith: string[];
}

type DisplayMode = "all" | "urgent" | "upcoming";
type DateRange = "today" | "week";

// ---------------------------------------------------------------------------
// Time parsing & conflict detection
// ---------------------------------------------------------------------------

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

function isTimeOverlap(task1: Task, task2: Task): boolean {
  const start1 = parseTimeToHours(task1.startTime);
  const end1 = parseTimeToHours(task1.endTime);
  const start2 = parseTimeToHours(task2.startTime);
  const end2 = parseTimeToHours(task2.endTime);
  return start1 < end2 && start2 < end1;
}

function detectConflicts(tasks: Task[]): Task[] {
  return tasks.map((task) => {
    const conflicts = tasks.filter(
      (other) => other.id !== task.id && isTimeOverlap(task, other)
    );
    return { ...task, conflictsWith: conflicts.map((c) => c.id) };
  });
}

/** Format current time for "Now - 2:45 PM" */
function formatNowLabel(): string {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const period = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 || 12;
  return `Now - ${h}:${minutes.toString().padStart(2, "0")} ${period}`;
}

/** Compute vertical offset (px) for overlapping tasks so they stack. */
function getOverlapOffsets(tasks: Task[]): Record<string, number> {
  const map: Record<string, number> = {};
  const processed = new Set<string>();
  for (const task of tasks) {
    if (processed.has(task.id) || task.conflictsWith.length === 0) {
      if (!(task.id in map)) map[task.id] = 0;
      continue;
    }
    const group = new Set<string>([task.id, ...task.conflictsWith]);
    const sorted = [...group].sort((a, b) => {
      const ta = tasks.find((t) => t.id === a)!;
      const tb = tasks.find((t) => t.id === b)!;
      return parseTimeToHours(ta.startTime) - parseTimeToHours(tb.startTime);
    });
    sorted.forEach((id, i) => {
      map[id] = i * OVERLAP_OFFSET_PX;
      processed.add(id);
    });
  }
  tasks.forEach((t) => {
    if (!(t.id in map)) map[t.id] = 0;
  });
  return map;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_TASKS: Task[] = [
  {
    id: "task-1",
    equipment: "R-127",
    title: "Power Draw Spike",
    location: "ASH1-DC1",
    company: "Meta Inc.",
    type: "Preventive",
    priority: "urgent",
    category: "urgent",
    startTime: "7:42 AM",
    endTime: "9:42 AM",
    duration: 2,
    completed: false,
    conflictsWith: [],
  },
  {
    id: "task-2",
    equipment: "R-145",
    title: "Temperature Anomaly",
    location: "ASH1-DC1",
    company: "Meta Inc.",
    type: "Preventive",
    priority: "urgent",
    category: "urgent",
    startTime: "8:15 AM",
    endTime: "10:15 AM",
    duration: 2,
    completed: false,
    conflictsWith: [],
  },
  {
    id: "task-3",
    equipment: "R-128",
    title: "Routine Maintenance Check",
    location: "ASH1-DC1",
    company: "Google Cloud",
    type: "Maintenance",
    priority: "medium",
    category: "upcoming",
    startTime: "10:00 AM",
    endTime: "11:30 AM",
    duration: 1.5,
    completed: false,
    conflictsWith: [],
  },
  {
    id: "task-4",
    equipment: "R-129",
    title: "Remote Hands Request",
    location: "ASH2-DC1",
    company: "Meta Inc.",
    type: "Remote hands",
    priority: "low",
    category: "upcoming",
    startTime: "2:00 PM",
    endTime: "4:00 PM",
    duration: 2,
    completed: false,
    conflictsWith: [],
  },
  {
    id: "task-5",
    equipment: "R-130",
    title: "Cooling Unit Inspection",
    location: "ASH1-DC2",
    company: "AWS",
    type: "Preventive",
    priority: "high",
    category: "upcoming",
    startTime: "3:00 PM",
    endTime: "4:30 PM",
    duration: 1.5,
    completed: false,
    conflictsWith: [],
  },
];

const HOUR_WIDTH = 60;
const HALF_HOUR_WIDTH = HOUR_WIDTH / 2;
const GANTT_ROW_HEIGHT = 64;
const GANTT_ROW_GAP = 8;
const GANTT_BAR_HEIGHT = 48;
const OVERLAP_OFFSET_PX = 4;
const MAJOR_HOURS = [0, 6, 12, 18]; // 12am, 6am, 12pm, 6pm

const FILTER_OPTIONS = [
  "All Types",
  "Preventive",
  "Incident",
  "Maintenance",
  "Remote hands",
  "Changes",
  "Projects",
];

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionHeader({ label }: { label: string }) {
  return (
    <h3 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wider text-gray-500 first:mt-0">
      {label}
    </h3>
  );
}

const PRIORITY_BADGE_STYLES: Record<
  "urgent" | "high" | "medium" | "low",
  { bg: string; text: string; label: string }
> = {
  urgent: { bg: "bg-red-50", text: "text-red-700", label: "Urgent" },
  high: { bg: "bg-pink-50", text: "text-pink-700", label: "High" },
  medium: { bg: "bg-yellow-50", text: "text-yellow-700", label: "Medium" },
  low: { bg: "bg-teal-50", text: "text-teal-700", label: "Low" },
};

// ---------------------------------------------------------------------------
// Todo list item (simplified, minimal)
// ---------------------------------------------------------------------------

function TodoListItem({
  task,
  isSelected,
  completed,
  onToggle,
  onSelect,
  onHover,
}: {
  task: Task;
  isSelected: boolean;
  completed: boolean;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const priorityStyle = PRIORITY_BADGE_STYLES[task.priority];

  return (
    <div
      id={`task-list-item-${task.id}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(task.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(task.id);
        }
      }}
      onMouseEnter={() => onHover(task.id)}
      onMouseLeave={() => onHover(null)}
      className="flex cursor-pointer items-center gap-3 border-b border-gray-100 bg-white py-3"
      aria-label={`Task: ${task.title}, ${task.equipment}`}
      aria-pressed={isSelected}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task.id);
        }}
        aria-label={completed ? "Mark incomplete" : "Mark complete"}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 bg-white transition-colors hover:border-gray-400",
          completed
            ? "border-gray-900 bg-gray-900 text-white"
            : "border-gray-300"
        )}
      >
        {completed && <Check className="h-3 w-3" strokeWidth={3} />}
      </button>
      <span className="shrink-0 font-mono text-sm font-medium text-gray-500">
        {task.equipment}
      </span>
      <p
        className={cn(
          "min-w-0 flex-1 truncate text-sm font-normal text-gray-900",
          completed && "line-through opacity-60"
        )}
      >
        {task.title}
      </p>
      <span
        className={cn(
          "shrink-0 rounded px-2.5 py-1 text-xs font-medium",
          priorityStyle.bg,
          priorityStyle.text
        )}
      >
        {priorityStyle.label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gantt bar (with gradient, duration, icon, overlap offset)
// ---------------------------------------------------------------------------

const BAR_GRADIENTS: Record<
  "urgent" | "high" | "medium" | "low",
  string
> = {
  urgent:
    "linear-gradient(180deg, rgba(239,68,68,0.95) 0%, rgba(185,28,28,0.9) 100%)",
  high: "linear-gradient(180deg, rgba(249,115,22,0.95) 0%, rgba(194,65,12,0.9) 100%)",
  medium:
    "linear-gradient(180deg, rgba(234,179,8,0.95) 0%, rgba(161,98,7,0.9) 100%)",
  low: "linear-gradient(180deg, rgba(156,163,175,0.95) 0%, rgba(107,114,128,0.9) 100%)",
};

const BAR_BORDERS: Record<"urgent" | "high" | "medium" | "low", string> = {
  urgent: "border-red-700",
  high: "border-orange-700",
  medium: "border-yellow-700",
  low: "border-gray-600",
};

function GanttBar({
  task,
  top,
  overlapOffset,
  isSelected,
  isHovered,
  hasConflict,
  completed,
  isDragging,
  dragPreviewLeft,
  onClick,
  onHover,
  onDragStart,
}: {
  task: Task;
  top: number;
  overlapOffset: number;
  isSelected: boolean;
  isHovered: boolean;
  hasConflict: boolean;
  completed: boolean;
  isDragging: boolean;
  dragPreviewLeft: number | null;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
  onDragStart?: (e: React.MouseEvent) => void;
}) {
  const startHours = parseTimeToHours(task.startTime);
  const left = startHours * HOUR_WIDTH;
  const width = task.duration * HOUR_WIDTH;
  const barTop =
    top +
    (GANTT_ROW_HEIGHT + GANTT_ROW_GAP - GANTT_BAR_HEIGHT) / 2 +
    overlapOffset;

  const gradientCss = BAR_GRADIENTS[task.priority];
  const borderClass = BAR_BORDERS[task.priority];
  const showDuration = width >= 56;
  const durationText =
    task.duration >= 1
      ? `${task.duration}h`
      : `${Math.round(task.duration * 60)}m`;

  const barContent = (
    <>
      <div
        className="absolute left-1.5 flex h-6 w-6 items-center justify-center rounded bg-white/20"
        aria-hidden
      >
        <Server className="h-3.5 w-3.5 text-white" />
      </div>
      <span className="ml-9 truncate text-xs font-semibold text-white drop-shadow-sm">
        {task.equipment}
      </span>
      {showDuration && (
        <span className="ml-1.5 shrink-0 text-[10px] font-medium text-white/90">
          {durationText}
        </span>
      )}
      {hasConflict && (
        <span
          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white shadow"
          aria-hidden
        >
          <AlertTriangle className="h-3 w-3" />
        </span>
      )}
    </>
  );

  const displayLeft = isDragging && dragPreviewLeft !== null ? dragPreviewLeft : left;

  return (
    <div
      className="absolute flex items-center"
      style={{
        top: barTop,
        left: displayLeft,
        width,
        height: GANTT_BAR_HEIGHT,
      }}
    >
        <button
          type="button"
          onClick={onClick}
          onMouseEnter={() => onHover(true)}
          onMouseLeave={() => onHover(false)}
          onMouseDown={onDragStart}
          className={cn(
            "relative flex h-full w-full cursor-pointer items-center rounded-lg border-2 px-2 transition-all duration-200",
            borderClass,
            hasConflict &&
              "border-orange-500 bg-[repeating-linear-gradient(-45deg,transparent,transparent_3px,rgba(0,0,0,0.06)_3px,rgba(0,0,0,0.06)_6px)]",
            isSelected &&
              "z-10 ring-2 ring-primary ring-offset-2 shadow-lg shadow-primary/25",
            isHovered && !isSelected && "scale-[1.02] shadow-md",
            completed && "opacity-40 border-dashed",
            isDragging && "cursor-grabbing opacity-90"
          )}
          style={{
            background: hasConflict ? undefined : gradientCss,
          }}
          aria-label={`${task.equipment} ${task.title}`}
        >
          {barContent}
        </button>
      </div>
  );
}

// ---------------------------------------------------------------------------
// Overlap connectors (dashed lines between overlapping bars)
// ---------------------------------------------------------------------------

function OverlapConnectors({
  tasks,
  overlapOffsets,
}: {
  tasks: Task[];
  overlapOffsets: Record<string, number>;
}) {
  const pairs: { taskA: Task; taskB: Task; indexA: number; indexB: number }[] = [];
  tasks.forEach((task, indexA) => {
    task.conflictsWith.forEach((otherId) => {
      if (task.id >= otherId) return;
      const indexB = tasks.findIndex((t) => t.id === otherId);
      if (indexB === -1) return;
      const taskB = tasks[indexB];
      pairs.push({ taskA: task, taskB, indexA, indexB });
    });
  });

  const barCenterY = (index: number, offset: number) =>
    index * (GANTT_ROW_HEIGHT + GANTT_ROW_GAP) +
    (GANTT_ROW_HEIGHT + GANTT_ROW_GAP - GANTT_BAR_HEIGHT) / 2 +
    GANTT_BAR_HEIGHT / 2 +
    offset;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[1] overflow-visible"
      aria-hidden
    >
      {pairs.map(({ taskA, taskB, indexA, indexB }) => {
        const startA = parseTimeToHours(taskA.startTime);
        const endA = startA + taskA.duration;
        const startB = parseTimeToHours(taskB.startTime);
        const endB = startB + taskB.duration;
        const overlapStart = Math.max(startA, startB) * HOUR_WIDTH;
        const overlapEnd = Math.min(endA, endB) * HOUR_WIDTH;
        const centerX = (overlapStart + overlapEnd) / 2;
        const y1 = barCenterY(indexA, overlapOffsets[taskA.id] ?? 0);
        const y2 = barCenterY(indexB, overlapOffsets[taskB.id] ?? 0);
        return (
          <line
            key={`${taskA.id}-${taskB.id}`}
            x1={centerX}
            y1={y1}
            x2={centerX}
            y2={y2}
            stroke="rgb(249 115 22)"
            strokeWidth={2}
            strokeDasharray="4 4"
            opacity={0.8}
          />
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function TodosPage() {
  const [tasks, setTasks] = useState<Task[]>(() =>
    detectConflicts(MOCK_TASKS)
  );
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("all");
  const [filterType, setFilterType] = useState<string>("All Types");
  const [dateRange, setDateRange] = useState<DateRange>("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragPreviewLeft, setDragPreviewLeft] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragStartLeft = useRef(0);

  const toggleComplete = useCallback((id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const tasksWithCompleted = useMemo(
    () =>
      tasks.map((t) => ({
        ...t,
        completed: completedIds.has(t.id),
      })),
    [tasks, completedIds]
  );

  const filteredTasks = useMemo(() => {
    let list = tasksWithCompleted;
    if (displayMode === "urgent")
      list = list.filter((t) => t.category === "urgent");
    if (displayMode === "upcoming")
      list = list.filter((t) => t.category === "upcoming");
    if (filterType !== "All Types")
      list = list.filter((t) => t.type === filterType);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.equipment.toLowerCase().includes(q) ||
          t.location.toLowerCase().includes(q) ||
          t.company.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tasksWithCompleted, displayMode, filterType, searchQuery]);

  const urgentTasks = useMemo(
    () => filteredTasks.filter((t) => t.category === "urgent"),
    [filteredTasks]
  );
  const upcomingTasks = useMemo(
    () => filteredTasks.filter((t) => t.category === "upcoming"),
    [filteredTasks]
  );

  const handleOptimize = useCallback(() => {
    setIsOptimizing(true);
    setTimeout(() => {
      console.log("Optimizing schedule...");
      setIsOptimizing(false);
    }, 2000);
  }, []);

  const [nowTick, setNowTick] = useState(0);
  const currentHourPosition = useMemo(() => {
    const now = new Date();
    const hours = now.getHours() + now.getMinutes() / 60;
    return hours * HOUR_WIDTH;
  }, [nowTick]);
  const nowLabel = useMemo(() => formatNowLabel(), [nowTick]);

  useEffect(() => {
    const interval = setInterval(() => setNowTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  const ganttTotalWidth = 24 * HOUR_WIDTH;

  const overlapOffsets = useMemo(
    () => getOverlapOffsets(filteredTasks),
    [filteredTasks]
  );

  const handleBarDragStart = useCallback(
    (taskId: string, e: React.MouseEvent) => {
      e.preventDefault();
      const task = filteredTasks.find((t) => t.id === taskId);
      if (!task) return;
      const startHours = parseTimeToHours(task.startTime);
      const left = startHours * HOUR_WIDTH;
      setDraggingTaskId(taskId);
      setDragPreviewLeft(left);
      dragStartX.current = e.clientX;
      dragStartLeft.current = left;
    },
    [filteredTasks]
  );

  useEffect(() => {
    if (!draggingTaskId) return;
    const onMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartX.current;
      const newLeft = Math.max(
        0,
        Math.min(ganttTotalWidth - 60, dragStartLeft.current + deltaX)
      );
      setDragPreviewLeft(newLeft);
    };
    const onUp = () => setDraggingTaskId(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [draggingTaskId, ganttTotalWidth]);

  useEffect(() => {
    if (selectedTaskId) {
      document
        .getElementById(`task-list-item-${selectedTaskId}`)
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedTaskId]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-50">
      {/* Page header: title + filters and action buttons (same row) */}
      <header className="sticky top-0 z-10 flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-white px-8 py-4">
        <h1 className="text-2xl font-semibold text-gray-900 shrink-0">
          To Do&apos;s
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          {/* Display: All | Urgent | Upcoming */}
          <div className="inline-flex rounded-md bg-gray-100 p-0.5">
            {(
              [
                { id: "all", label: "All" },
                { id: "urgent", label: "Urgent" },
                { id: "upcoming", label: "Upcoming" },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setDisplayMode(id)}
                className={cn(
                  "rounded px-2.5 py-1.5 text-sm font-medium transition-colors",
                  displayMode === id
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Filter dropdown */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-9 min-w-[100px] rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {/* Today / Week */}
          <div className="inline-flex rounded-md bg-gray-100 p-0.5">
            <button
              type="button"
              onClick={() => setDateRange("today")}
              className={cn(
                "rounded px-2.5 py-1.5 text-sm font-medium transition-colors",
                dateRange === "today"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDateRange("week")}
              className={cn(
                "rounded px-2.5 py-1.5 text-sm font-medium transition-colors",
                dateRange === "week"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              Week
            </button>
          </div>
          {/* Search */}
          <div className="relative">
            <Search
              className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden
            />
            <Input
              type="search"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-40 rounded-md border-gray-300 pl-8 text-sm"
            />
          </div>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50"
          >
            <ArrowUpDown className="h-4 w-4" aria-hidden />
            Sort
          </button>
          <button
            type="button"
            aria-label="Calendar"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Calendar className="h-[18px] w-[18px]" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Menu"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Menu className="h-[18px] w-[18px]" aria-hidden />
          </button>
          <button
            type="button"
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-70"
          >
            <Sparkles
              className={cn("h-4 w-4", isOptimizing && "animate-pulse")}
              aria-hidden
            />
            {isOptimizing ? "Optimizing…" : "Optimize"}
          </button>
        </div>
      </header>

      {/* Two-column layout */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Left column: Task list */}
        <aside
          className="flex h-full min-h-0 w-full flex-col border-r border-gray-200 bg-gray-50 lg:w-[40%] lg:min-w-[500px] lg:max-w-[600px]"
        >
          <div className="flex flex-1 flex-col overflow-y-auto p-6">
            {/* Task list */}
            <div ref={listRef} className="flex-1 space-y-2">
              {urgentTasks.length > 0 && (
                <>
                  <SectionHeader label="Urgent" />
                  {urgentTasks.map((task) => (
                    <TodoListItem
                      key={task.id}
                      task={task}
                      isSelected={selectedTaskId === task.id}
                      completed={task.completed}
                      onToggle={toggleComplete}
                      onSelect={setSelectedTaskId}
                      onHover={setHoveredTaskId}
                    />
                  ))}
                </>
              )}
              {upcomingTasks.length > 0 && (
                <>
                  <SectionHeader label="Upcoming" />
                  {upcomingTasks.map((task) => (
                    <TodoListItem
                      key={task.id}
                      task={task}
                      isSelected={selectedTaskId === task.id}
                      completed={task.completed}
                      onToggle={toggleComplete}
                      onSelect={setSelectedTaskId}
                      onHover={setHoveredTaskId}
                    />
                  ))}
                </>
              )}
              {filteredTasks.length === 0 && (
                <p className="py-8 text-center text-sm text-gray-500">
                  No tasks match your filters.
                </p>
              )}
            </div>
          </div>
        </aside>

        {/* Right column: Gantt timeline */}
        <main
          className="min-h-0 flex-1 overflow-auto bg-white p-6 lg:min-w-0"
        >
          {/* Timeline header */}
          <div className="sticky top-0 z-[5] mb-4 border-b-2 border-gray-200 bg-white pb-4">
            <div
              className="grid gap-0"
              style={{
                width: ganttTotalWidth,
                gridTemplateColumns: `repeat(24, ${HOUR_WIDTH}px)`,
              }}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    "border-r border-gray-100 py-2 text-center text-xs text-gray-500",
                    (i === 0 || i === 6 || i === 12 || i === 18) &&
                      "border-gray-200 font-medium"
                  )}
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
          </div>

          {/* Gantt chart area */}
          <div
            ref={ganttRef}
            className="relative"
            style={{
              width: ganttTotalWidth,
              minHeight: Math.max(
                400,
                filteredTasks.length * (GANTT_ROW_HEIGHT + GANTT_ROW_GAP)
              ),
            }}
          >
            {/* Striped background: alternating hour columns (even = white, odd = gray-50) */}
            <div className="absolute inset-0 z-0 flex" aria-hidden>
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-shrink-0",
                    i % 2 === 0 ? "bg-white" : "bg-gray-50"
                  )}
                  style={{ width: HOUR_WIDTH }}
                />
              ))}
            </div>

            {/* Grid: half-hour (lighter) + hour (darker) + major hours (darkest) */}
            <div
              className="pointer-events-none absolute inset-0 z-[1] grid gap-0"
              style={{
                gridTemplateColumns: `repeat(48, ${HALF_HOUR_WIDTH}px)`,
                gridTemplateRows: `repeat(${Math.max(
                  filteredTasks.length,
                  1
                )}, ${GANTT_ROW_HEIGHT + GANTT_ROW_GAP}px)`,
              }}
            >
              {Array.from({ length: 48 }, (_, i) => {
                const isHour = i % 2 === 0;
                const hourIndex = i / 2;
                const isMajor = MAJOR_HOURS.includes(hourIndex);
                return (
                  <div
                    key={i}
                    className={cn(
                      "border-r",
                      isMajor
                        ? "border-gray-300"
                        : isHour
                          ? "border-gray-200"
                          : "border-gray-100"
                    )}
                    style={{ gridColumn: i + 1, gridRow: "1 / -1" }}
                  />
                );
              })}
            </div>

            {/* Overlap connectors (dashed lines) */}
            <OverlapConnectors
              tasks={filteredTasks}
              overlapOffsets={overlapOffsets}
            />

            {/* Current time indicator: 3px, pulse, "Now - 2:45 PM" */}
            {currentHourPosition >= 0 &&
              currentHourPosition <= ganttTotalWidth && (
                <div
                  className="absolute top-0 z-20 w-[3px] bg-red-500 animate-gantt-now-pulse"
                  style={{
                    left: currentHourPosition - 1.5,
                    height: "100%",
                  }}
                >
                  <span className="absolute -top-7 left-0 whitespace-nowrap rounded bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white shadow">
                    {nowLabel}
                  </span>
                </div>
              )}

            {/* Task bars */}
            {filteredTasks.map((task, index) => (
              <GanttBar
                key={task.id}
                task={task}
                top={index * (GANTT_ROW_HEIGHT + GANTT_ROW_GAP)}
                overlapOffset={overlapOffsets[task.id] ?? 0}
                isSelected={selectedTaskId === task.id}
                isHovered={hoveredTaskId === task.id}
                hasConflict={task.conflictsWith.length > 0}
                completed={task.completed}
                isDragging={draggingTaskId === task.id}
                dragPreviewLeft={
                  draggingTaskId === task.id ? dragPreviewLeft : null
                }
                onClick={() => setSelectedTaskId(task.id)}
                onHover={(hovered) =>
                  setHoveredTaskId(hovered ? task.id : null)
                }
                onDragStart={(e) => handleBarDragStart(task.id, e)}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
