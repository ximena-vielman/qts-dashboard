"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  ChartGantt,
  Filter,
  Search,
  Sparkles,
  AlertTriangle,
  Check,
  Server,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { TaskDetailDrawer } from "@/components/features/tasks/task-detail-drawer";
import { CalendarView } from "@/components/features/tasks/calendar-view";
import {
  OptimizationResultsModal,
  type OptimizationResult,
  type OptimizationChange,
} from "@/components/features/tasks/optimization-results-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
// Optimization: time helpers & algorithm
// ---------------------------------------------------------------------------

function hoursToTimeStr(hours: number): string {
  const h = Math.floor(hours) % 24;
  const m = Math.round((hours % 1) * 60);
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 || 12;
  return `${displayHour}:${m.toString().padStart(2, "0")} ${period}`;
}

function getPriorityWeight(priority: Task["priority"]): number {
  const weights = { urgent: 1, high: 2, medium: 3, low: 4 };
  return weights[priority];
}

/** Simplified optimization: sort by priority, group by location, adjust times to avoid conflicts. */
function optimizeTasks(tasks: Task[]): Task[] {
  const sorted = [...tasks].sort(
    (a, b) => getPriorityWeight(a.priority) - getPriorityWeight(b.priority)
  );
  const byLocation = new Map<string, Task[]>();
  for (const t of sorted) {
    const list = byLocation.get(t.location) ?? [];
    list.push(t);
    byLocation.set(t.location, list);
  }
  const locationOrder = Array.from(byLocation.keys()).sort();
  const flat: Task[] = [];
  for (const loc of locationOrder) {
    flat.push(...(byLocation.get(loc) ?? []));
  }
  let cursor = 7;
  const buffer = 0.25;
  return flat.map((t) => {
    const startStr = hoursToTimeStr(cursor);
    const endStr = hoursToTimeStr(cursor + t.duration);
    cursor += t.duration + buffer;
    return {
      ...t,
      startTime: startStr,
      endTime: endStr,
      conflictsWith: [],
    };
  });
}

function generateMockOptimizationResult(
  originalTasks: Task[],
  optimizedTasks: Task[]
): OptimizationResult {
  const changes: OptimizationChange[] = [];
  const originalMap = new Map(originalTasks.map((t) => [t.id, t]));
  optimizedTasks.forEach((opt, index) => {
    const orig = originalMap.get(opt.id);
    if (!orig || orig.startTime === opt.startTime) return;
    changes.push({
      taskId: opt.id,
      taskName: `${opt.equipment} ${opt.title}`,
      type: "time",
      before: orig.startTime,
      after: opt.startTime,
      reason:
        orig.location === opt.location
          ? "Grouped with other " + opt.location + " tasks"
          : "Minimized travel between buildings",
    });
  });
  const conflictCount = originalTasks.filter((t) => t.conflictsWith.length > 0).length;
  return {
    optimizedTasks,
    stats: {
      conflictsResolved: conflictCount,
      travelTimeSaved: "45min → 25min",
      efficiencyGain: "+35%",
    },
    changes: changes.length > 0 ? changes : [
      {
        taskId: optimizedTasks[0]?.id ?? "task-1",
        taskName: optimizedTasks[0] ? `${optimizedTasks[0].equipment} ${optimizedTasks[0].title}` : "Task",
        type: "time",
        before: originalTasks[0]?.startTime ?? "7:42 AM",
        after: optimizedTasks[0]?.startTime ?? "7:00 AM",
        reason: "Reordered by priority and location for efficiency",
      },
    ],
  };
}

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
const OVERLAP_OFFSET_PX = 4;
const MAJOR_HOURS = [0, 6, 12, 18]; // 12am, 6am, 12pm, 6pm

/** Standard row/layout constants for task list and Gantt alignment. */
const TIMELINE_HEADER_HEIGHT = 60;
const ROW_HEIGHT = 72;
const BAR_HEIGHT = 48;
const BAR_VERTICAL_PADDING = (ROW_HEIGHT - BAR_HEIGHT) / 2; // 12px above/below bar in row

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
    <div
      className="flex h-[72px] shrink-0 items-center border-b border-gray-100 bg-gray-50/50"
      style={{ height: ROW_HEIGHT }}
    >
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </h3>
    </div>
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
// Task list skeleton (during optimization)
// ---------------------------------------------------------------------------

function TaskItemSkeleton() {
  return (
    <div
      className="flex h-[72px] items-center gap-3 border-b border-gray-100 bg-white py-3"
      style={{ height: ROW_HEIGHT }}
    >
      <div className="h-5 w-5 shrink-0 rounded-full bg-gray-200 animate-pulse" />
      <div className="h-6 w-[60px] shrink-0 rounded bg-gray-200 animate-pulse" />
      <div className="min-w-0 flex-1">
        <div className="h-4 w-[60%] rounded bg-gray-200 animate-pulse" />
        <div className="mt-1 h-3 w-[40%] rounded bg-gray-100 animate-pulse" />
      </div>
      <div className="h-6 w-[70px] shrink-0 rounded bg-gray-200 animate-pulse" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Todo list item (simplified, minimal)
// TODO: Implement drag & drop reordering (GripVertical handle, drop zones, real-time Gantt update)
// ---------------------------------------------------------------------------

function TodoListItem({
  task,
  isSelected,
  completed,
  isRecentlyChanged,
  onToggle,
  onSelect,
  onHover,
}: {
  task: Task;
  isSelected: boolean;
  completed: boolean;
  isRecentlyChanged?: boolean;
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
      className={cn(
        "flex h-[72px] cursor-pointer items-center gap-3 border-b border-gray-100 bg-white py-3 transition-colors duration-300 box-border",
        isRecentlyChanged && "border-l-4 border-l-blue-500 bg-blue-50/50"
      )}
      style={{ height: ROW_HEIGHT, minHeight: ROW_HEIGHT, maxHeight: ROW_HEIGHT }}
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
// Gantt bar (light pastel backgrounds, readable text, 1px gray border)
// ---------------------------------------------------------------------------

const BAR_BACKGROUNDS: Record<
  "urgent" | "high" | "medium" | "low",
  string
> = {
  urgent: "bg-red-100",
  high: "bg-orange-100",
  medium: "bg-yellow-100",
  low: "bg-gray-100",
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
  isRecentlyChanged,
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
  isRecentlyChanged?: boolean;
  dragPreviewLeft: number | null;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
  onDragStart?: (e: React.MouseEvent) => void;
}) {
  const startHours = parseTimeToHours(task.startTime);
  const left = startHours * HOUR_WIDTH;
  const width = task.duration * HOUR_WIDTH;
  const barTop = top + BAR_VERTICAL_PADDING + overlapOffset;

  const bgClass = BAR_BACKGROUNDS[task.priority];
  const showDuration = width >= 56;
  const durationText =
    task.duration >= 1
      ? `${task.duration}h`
      : `${Math.round(task.duration * 60)}m`;

  const textColorClass = completed
    ? "text-gray-400"
    : isSelected
      ? "text-primary-900"
      : hasConflict
        ? "text-orange-900"
        : "text-gray-700";

  const barContent = (
    <>
      <div
        className="absolute left-1.5 flex h-6 w-6 items-center justify-center rounded bg-black/5"
        aria-hidden
      >
        <Server className={cn("h-3.5 w-3.5", textColorClass)} />
      </div>
      <span className={cn("ml-9 truncate text-xs font-medium", textColorClass)}>
        {task.equipment}
      </span>
      {showDuration && (
        <span className={cn("ml-1.5 shrink-0 text-[10px] font-medium", textColorClass)}>
          {durationText}
        </span>
      )}
      {hasConflict && (
        <span
          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center text-orange-600"
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
        height: BAR_HEIGHT,
      }}
    >
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        onMouseDown={onDragStart}
        className={cn(
          "relative flex h-full w-full cursor-pointer items-center rounded-md px-2 transition-all duration-150 ease-out",
          "border border-[#C3C3C3]",
          completed && "bg-gray-50 opacity-60 border-dashed border-[#C3C3C3]",
          !completed && !isSelected && !hasConflict && bgClass,
          !completed && !isSelected && !hasConflict && "hover:bg-gray-200 hover:shadow-sm hover:border-[#C3C3C3]",
          isSelected && "bg-primary-50 border-2 border-primary-600 shadow-md z-10",
          hasConflict && !completed && "bg-orange-50 border-2 border-orange-400",
          isHovered && !isSelected && "shadow-sm",
          isDragging && "cursor-grabbing opacity-90",
          isRecentlyChanged && "ring-2 ring-blue-500 ring-offset-2"
        )}
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
  taskIdToRowIndex,
}: {
  tasks: Task[];
  overlapOffsets: Record<string, number>;
  taskIdToRowIndex: Map<string, number>;
}) {
  const pairs: { taskA: Task; taskB: Task; rowIndexA: number; rowIndexB: number }[] = [];
  tasks.forEach((task) => {
    task.conflictsWith.forEach((otherId) => {
      if (task.id >= otherId) return;
      const taskB = tasks.find((t) => t.id === otherId);
      if (!taskB) return;
      const rowIndexA = taskIdToRowIndex.get(task.id);
      const rowIndexB = taskIdToRowIndex.get(taskB.id);
      if (rowIndexA === undefined || rowIndexB === undefined) return;
      pairs.push({ taskA: task, taskB, rowIndexA, rowIndexB });
    });
  });

  const barCenterY = (rowIndex: number, offset: number) =>
    rowIndex * ROW_HEIGHT +
    BAR_VERTICAL_PADDING +
    BAR_HEIGHT / 2 +
    offset;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[1] overflow-visible"
      aria-hidden
    >
      {pairs.map(({ taskA, taskB, rowIndexA, rowIndexB }) => {
        const startA = parseTimeToHours(taskA.startTime);
        const endA = startA + taskA.duration;
        const startB = parseTimeToHours(taskB.startTime);
        const endB = startB + taskB.duration;
        const overlapStart = Math.max(startA, startB) * HOUR_WIDTH;
        const overlapEnd = Math.min(endA, endB) * HOUR_WIDTH;
        const centerX = (overlapStart + overlapEnd) / 2;
        const y1 = barCenterY(rowIndexA, overlapOffsets[taskA.id] ?? 0);
        const y2 = barCenterY(rowIndexB, overlapOffsets[taskB.id] ?? 0);
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("all");
  const [filterType, setFilterType] = useState<string>("All Types");
  const [dateRange, setDateRange] = useState<DateRange>("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult | null>(null);
  const [showOptimizationModal, setShowOptimizationModal] = useState(false);
  const [originalTasks, setOriginalTasks] = useState<Task[]>([]);
  const [recentlyChangedIds, setRecentlyChangedIds] = useState<Set<string>>(new Set());
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragPreviewLeft, setDragPreviewLeft] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<"gantt" | "calendar">("gantt");
  const [calendarMode, setCalendarMode] = useState<"day" | "week">("week");
  const listRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragStartLeft = useRef(0);

  // Persist view preference
  useEffect(() => {
    const savedView = localStorage.getItem("todos-view") as "gantt" | "calendar" | null;
    const savedMode = localStorage.getItem("calendar-mode") as "day" | "week" | null;
    if (savedView === "gantt" || savedView === "calendar") setActiveView(savedView);
    if (savedMode === "day" || savedMode === "week") setCalendarMode(savedMode);
  }, []);
  useEffect(() => {
    localStorage.setItem("todos-view", activeView);
    localStorage.setItem("calendar-mode", calendarMode);
  }, [activeView, calendarMode]);

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

  /** Unified rows (section headers + tasks) so task list and Gantt share the same 72px grid. */
  const unifiedRows = useMemo(() => {
    const rows: Array<
      | { type: "section"; label: string }
      | { type: "task"; task: (typeof filteredTasks)[number] }
    > = [];
    if (urgentTasks.length > 0) {
      rows.push({ type: "section", label: "Urgent" });
      urgentTasks.forEach((t) => rows.push({ type: "task", task: t }));
    }
    if (upcomingTasks.length > 0) {
      rows.push({ type: "section", label: "Upcoming" });
      upcomingTasks.forEach((t) => rows.push({ type: "task", task: t }));
    }
    return rows;
  }, [urgentTasks, upcomingTasks]);

  const taskIdToRowIndex = useMemo(() => {
    const map = new Map<string, number>();
    unifiedRows.forEach((row, index) => {
      if (row.type === "task") map.set(row.task.id, index);
    });
    return map;
  }, [unifiedRows]);

  const handleOptimize = useCallback(async () => {
    try {
      setIsOptimizing(true);
      setShowOptimizationModal(false);
      setOriginalTasks([...tasks]);
      await new Promise((resolve) => setTimeout(resolve, 2500));
      const optimized = optimizeTasks(tasks);
      const result = generateMockOptimizationResult(tasks, optimized);
      setOptimizationResults(result);
      setIsOptimizing(false);
      setShowOptimizationModal(true);
    } catch (err) {
      console.error("Optimization failed:", err);
      setIsOptimizing(false);
      toast.error("Optimization failed. Please try again.");
    }
  }, [tasks]);

  const applyOptimization = useCallback(() => {
    if (!optimizationResults) return;
    setTasks(detectConflicts(optimizationResults.optimizedTasks));
    setRecentlyChangedIds(new Set(optimizationResults.changes.map((c) => c.taskId)));
    setShowOptimizationModal(false);
    setOptimizationResults(null);
    toast.success("Schedule optimized!", {
      description: `${optimizationResults.changes.length} tasks reorganized.`,
      duration: 3000,
    });
    const firstId = optimizationResults.changes[0]?.taskId;
    if (firstId) setTimeout(() => document.getElementById(`task-list-item-${firstId}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }), 100);
  }, [optimizationResults]);

  const cancelOptimization = useCallback(() => {
    if (originalTasks.length > 0) setTasks(originalTasks);
    setShowOptimizationModal(false);
    setOptimizationResults(null);
  }, [originalTasks]);

  useEffect(() => {
    if (recentlyChangedIds.size === 0) return;
    const t = setTimeout(() => setRecentlyChangedIds(new Set()), 3000);
    return () => clearTimeout(t);
  }, [recentlyChangedIds]);

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

  const handleTaskSelect = useCallback((id: string) => {
    setSelectedTaskId(id);
    setIsDrawerOpen(true);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-50">
      {/* Page header: title + filters and action buttons (same row) */}
      <header className="sticky top-0 z-10 flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-white px-8 py-4">
        <h1 className="text-2xl font-semibold text-gray-900 shrink-0">
          To Do&apos;s
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter overflow menu: Display + Type */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Filter className="h-4 w-4" aria-hidden />
                Filter
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[200px]">
              <DropdownMenuLabel>Display</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={displayMode}
                onValueChange={(v) => setDisplayMode(v as DisplayMode)}
              >
                {(
                  [
                    { id: "all", label: "All" },
                    { id: "urgent", label: "Urgent" },
                    { id: "upcoming", label: "Upcoming" },
                  ] as const
                ).map(({ id, label }) => (
                  <DropdownMenuRadioItem key={id} value={id}>
                    {label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Type</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={filterType}
                onValueChange={setFilterType}
              >
                {FILTER_OPTIONS.map((opt) => (
                  <DropdownMenuRadioItem key={opt} value={opt}>
                    {opt}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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
          {/* Gantt view button */}
          <button
            type="button"
            onClick={() => setActiveView("gantt")}
            aria-label="Switch to Gantt view"
            aria-pressed={activeView === "gantt"}
            title="Gantt view"
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-all duration-150",
              activeView === "gantt"
                ? "bg-gray-900 text-white border border-gray-900"
                : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900"
            )}
          >
            <ChartGantt className="h-[20px] w-[20px]" strokeWidth={1.5} aria-hidden />
          </button>
          {/* Calendar view button */}
          <button
            type="button"
            onClick={() => setActiveView("calendar")}
            aria-label="Switch to Calendar view"
            aria-pressed={activeView === "calendar"}
            title="Calendar view"
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-all duration-150",
              activeView === "calendar"
                ? "bg-gray-900 text-white border border-gray-900"
                : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900"
            )}
          >
            <Calendar className="h-[20px] w-[20px]" strokeWidth={1.5} aria-hidden />
          </button>
          <button
            type="button"
            onClick={handleOptimize}
            disabled={isOptimizing}
            aria-busy={isOptimizing}
            aria-label={isOptimizing ? "Optimizing schedule" : "Optimize schedule"}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors",
              isOptimizing
                ? "cursor-not-allowed bg-gray-700"
                : "bg-gray-900 hover:bg-gray-800"
            )}
          >
            {isOptimizing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden />
            )}
            {isOptimizing ? "Optimizing..." : "Optimize"}
          </button>
        </div>
      </header>

      {/* Two-column layout: task list only in Gantt view; main area full width in Calendar */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Left column: Task list - only in Gantt view */}
        {activeView === "gantt" && (
          <aside
            className="flex h-full min-h-0 w-full flex-col border-r border-gray-200 bg-gray-50 lg:w-[40%] lg:min-w-[500px] lg:max-w-[600px]"
          >
            <div className="flex flex-1 flex-col overflow-y-auto p-6">
              {/* Spacer so task rows align with Gantt bars */}
              <div
                className="h-[60px] shrink-0"
                style={{ height: TIMELINE_HEADER_HEIGHT }}
                aria-hidden
              />
              {/* Task list - no gap; each row is exactly ROW_HEIGHT (72px) */}
              <div ref={listRef} className="flex-1">
                {isOptimizing ? (
                  <>
                    <SectionHeader label="Urgent" />
                    {Array.from({ length: 4 }, (_, i) => (
                      <TaskItemSkeleton key={`skeleton-urgent-${i}`} />
                    ))}
                    <SectionHeader label="Upcoming" />
                    {Array.from({ length: 5 }, (_, i) => (
                      <TaskItemSkeleton key={`skeleton-upcoming-${i}`} />
                    ))}
                  </>
                ) : unifiedRows.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-500">
                    No tasks match your filters.
                  </p>
                ) : (
                  unifiedRows.map((row, index) =>
                    row.type === "section" ? (
                      <SectionHeader key={`section-${row.label}-${index}`} label={row.label} />
                    ) : (
                      <TodoListItem
                        key={row.task.id}
                        task={row.task}
                        isSelected={selectedTaskId === row.task.id}
                        completed={row.task.completed}
                        isRecentlyChanged={recentlyChangedIds.has(row.task.id)}
                        onToggle={toggleComplete}
                        onSelect={handleTaskSelect}
                        onHover={setHoveredTaskId}
                      />
                    )
                  )
                )}
              </div>
            </div>
          </aside>
        )}

        {/* Right column: Gantt or Calendar - flex-1 fills remaining (60% with list, 100% without) */}
        <main
          className="min-h-0 flex-1 overflow-auto bg-white p-6 transition-all duration-300 lg:min-w-0"
        >
          {activeView === "gantt" && (
            <>
          {/* Timeline header - 60px so task list spacer matches */}
          <div
            className="sticky top-0 z-[5] h-[60px] shrink-0 border-b-2 border-gray-200 bg-white"
            style={{ height: TIMELINE_HEADER_HEIGHT }}
          >
            <div
              className="grid h-full gap-0 items-center"
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

          {/* Gantt chart area - row count from unified rows */}
          <div
            ref={ganttRef}
            className="relative"
            style={{
              width: ganttTotalWidth,
              minHeight: Math.max(400, unifiedRows.length * ROW_HEIGHT),
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
                gridTemplateRows: `repeat(${Math.max(unifiedRows.length, 1)}, ${ROW_HEIGHT}px)`,
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
              taskIdToRowIndex={taskIdToRowIndex}
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

            {/* Task bars (dimmed when optimizing) - top = rowIndex * ROW_HEIGHT */}
            {filteredTasks.map((task) => {
              const rowIndex = taskIdToRowIndex.get(task.id);
              if (rowIndex === undefined) return null;
              return (
                <div
                  key={task.id}
                  className={cn("transition-opacity duration-200", isOptimizing && "opacity-30 pointer-events-none")}
                >
                  <GanttBar
                    task={task}
                    top={rowIndex * ROW_HEIGHT}
                    overlapOffset={overlapOffsets[task.id] ?? 0}
                  isSelected={selectedTaskId === task.id}
                  isHovered={hoveredTaskId === task.id}
                  hasConflict={task.conflictsWith.length > 0}
                  completed={task.completed}
                  isDragging={draggingTaskId === task.id}
                  isRecentlyChanged={recentlyChangedIds.has(task.id)}
                  dragPreviewLeft={
                    draggingTaskId === task.id ? dragPreviewLeft : null
                  }
                  onClick={() => handleTaskSelect(task.id)}
                  onHover={(hovered) =>
                    setHoveredTaskId(hovered ? task.id : null)
                  }
                  onDragStart={(e) => handleBarDragStart(task.id, e)}
                  />
                </div>
              );
            })}

            {/* Gantt loading overlay during optimization */}
            {isOptimizing && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/70">
                <p className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-lg">
                  Optimizing...
                </p>
              </div>
            )}
          </div>
            </>
          )}
          {activeView === "calendar" && (
            <CalendarView
              tasks={filteredTasks}
              mode={calendarMode}
              onModeChange={setCalendarMode}
              onTaskClick={handleTaskSelect}
              selectedTaskId={selectedTaskId}
            />
          )}
        </main>
      </div>

      <OptimizationResultsModal
        open={showOptimizationModal}
        onClose={cancelOptimization}
        result={optimizationResults}
        onApply={applyOptimization}
        onCancel={cancelOptimization}
      />

      <TaskDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        taskId={selectedTaskId}
      />
    </div>
  );
}
