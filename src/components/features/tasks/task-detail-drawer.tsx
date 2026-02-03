"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowUp,
  Calendar,
  Check,
  ExternalLink,
  Maximize2,
  Minus,
  Plus,
  Send,
  Sparkles,
  UserPlus,
  Wrench,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TaskDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string | null;
}

interface HistoryItem {
  equipment: string;
  title: string;
  time: string;
  location: string;
  company: string;
  type: string;
}

interface EvaData {
  recentHistory: string[];
  lastService: {
    date: string;
    technician: { initials: string; name: string };
    work: string;
    nextService: string;
  };
  recommendedFocus: string[];
  relevantDocs: { title: string; url: string }[];
}

interface TaskData {
  id: string;
  title: string;
  workOrder: string;
  campus: string;
  asset: string;
  state: "Draft" | "In Progress" | "Completed" | "Cancelled";
  assignee: string | null;
  caller: string;
  company: string;
  priority: "Urgent" | "High" | "Medium" | "Low";
  date: string;
  capacity: string;
  operatingMode: string;
  loaded: string;
  history: HistoryItem[];
  evaData: EvaData;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_TASK_DATA: TaskData = {
  id: "task-1",
  title: "Generator Weekly Check",
  workOrder: "WK10001",
  campus: "ASH1-DC1",
  asset: "R-127",
  state: "Draft",
  assignee: null,
  caller: "DCIM Alerts",
  company: "Quality Tech",
  priority: "High",
  date: "February 15, 2026 • 9:00 AM",
  capacity: "75%",
  operatingMode: "Automatic",
  loaded: "Partially",
  history: [
    {
      equipment: "R-127",
      title: "Temperature Anomaly",
      time: "8:15 AM",
      location: "ASH1-DC1",
      company: "Meta Inc.",
      type: "Preventive",
    },
    {
      equipment: "R-128",
      title: "Humidity Levels",
      time: "9:00 AM",
      location: "ASH1-DC1",
      company: "Meta Inc.",
      type: "Preventive",
    },
    {
      equipment: "R-129",
      title: "Air Quality Index",
      time: "9:45 AM",
      location: "ASH1-DC1",
      company: "Meta Inc.",
      type: "Preventive",
    },
  ],
  evaData: {
    recentHistory: [
      "Generator ran for 15 min yesterday (power test)",
      "Oil temp was 5°F higher than usual",
      "No issues reported, but watch oil level",
    ],
    lastService: {
      date: "Dec 15, 2025",
      technician: { initials: "JT", name: "James Tames" },
      work: "Oil changed, filters replaced",
      nextService: "Feb 15, 2026",
    },
    recommendedFocus: [
      "Check oil level",
      "Inspect cooling system (temp was elevated)",
      "Standard checks: battery, belts, fuel",
    ],
    relevantDocs: [
      { title: "Generator PM Checklist", url: "#" },
      { title: "Oil Temperature Troubleshooting Guide", url: "#" },
    ],
  },
};

const STATE_BADGE_STYLES: Record<
  "Draft" | "In Progress" | "Completed" | "Cancelled",
  string
> = {
  Draft: "border-blue-200 bg-blue-50 text-blue-700",
  "In Progress": "border-green-200 bg-green-50 text-green-700",
  Completed: "border-gray-200 bg-gray-50 text-gray-700",
  Cancelled: "border-gray-200 bg-gray-50 text-gray-600",
};

const PRIORITY_BADGE_STYLES: Record<
  "Urgent" | "High" | "Medium" | "Low",
  string
> = {
  Urgent: "border-red-200 bg-red-50 text-red-700",
  High: "border-orange-200 bg-orange-50 text-orange-700",
  Medium: "border-yellow-200 bg-yellow-50 text-yellow-700",
  Low: "border-gray-200 bg-gray-50 text-gray-600",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DetailField({
  label,
  value,
  children,
}: {
  label: string;
  value?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-sm font-normal text-gray-600">{label}</p>
      {children ?? (
        <p className="text-base font-medium leading-snug text-gray-900">
          {value}
        </p>
      )}
    </div>
  );
}

function StatusIndicator({
  label,
  value,
  dotColor,
}: {
  label: string;
  value: string;
  dotColor?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="flex items-center gap-2 text-lg font-medium text-gray-900">
        {dotColor && (
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: dotColor }}
            aria-hidden
          />
        )}
        {value}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TaskDetailDrawer
// ---------------------------------------------------------------------------

export function TaskDetailDrawer({
  isOpen,
  onClose,
  taskId,
}: TaskDetailDrawerProps) {
  const [taskData, setTaskData] = useState<TaskData | null>(null);
  const [isAssigned, setIsAssigned] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [isExiting, setIsExiting] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Load task data when taskId changes
  useEffect(() => {
    if (taskId && isOpen) {
      setTaskData(MOCK_TASK_DATA);
      setIsAssigned(MOCK_TASK_DATA.assignee !== null);
    } else if (!isOpen) {
      setTaskData(null);
    }
  }, [taskId, isOpen]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 300);
  }, [onClose]);

  // ESC to close
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, handleClose]);

  const handleBackdropClick = () => handleClose();

  const handleAssign = () => {
    setIsAssigned(true);
  };

  const handleStartWork = () => {
    console.log("Starting work mode...");
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    setChatMessage("");
  };

  if (!isOpen && !isExiting) return null;

  const drawerVisible = isOpen && !isExiting;
  const backdropVisible = isOpen && !isExiting;

  return (
    <>
      {/* Backdrop */}
      <div
        role="presentation"
        onClick={handleBackdropClick}
        className={cn(
          "fixed inset-y-0 left-0 z-[999] bg-black/40 transition-opacity duration-300",
          backdropVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        style={{ width: "25vw" }}
        aria-hidden
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Task details"
        className={cn(
          "fixed inset-y-0 right-0 z-[1000] flex h-screen flex-col bg-white shadow-2xl",
          "w-full md:w-[85vw] lg:min-w-[900px] lg:max-w-[1200px] lg:w-[75vw]",
          drawerVisible
            ? "translate-x-0 transition-[transform_350ms_cubic-bezier(0.4,0,0.2,1)]"
            : "translate-x-full transition-[transform_300ms_cubic-bezier(0.4,0,1,1)]"
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-[72px] shrink-0 items-center justify-between border-b border-gray-200 bg-white px-8 py-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Work Order Details
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        {/* Two columns */}
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* Left column: Work Order Details (60%) */}
          <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto border-r border-gray-200 bg-white px-8 py-8 lg:w-[60%]">
            {taskData && (
              <>
                <h1 className="mb-8 text-3xl font-bold leading-tight text-gray-900">
                  {taskData.title}
                </h1>

                {/* Details grid */}
                <div className="mb-8 grid grid-cols-2 gap-x-6 gap-y-5">
                  <DetailField label="Work order" value={taskData.workOrder} />
                  <DetailField label="Campus" value={taskData.campus} />
                  <DetailField label="Asset">
                    <a
                      href="#"
                      className="text-base font-medium text-primary hover:underline"
                    >
                      {taskData.asset}
                    </a>
                  </DetailField>
                  <DetailField label="State">
                    <span
                      className={cn(
                        "inline-block rounded px-2.5 py-1 text-sm font-medium border",
                        STATE_BADGE_STYLES[taskData.state]
                      )}
                    >
                      {taskData.state}
                    </span>
                  </DetailField>
                  <DetailField label="Assignee">
                    {isAssigned ? (
                      <span className="text-base font-medium text-gray-900">
                        John Morgan
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleAssign}
                        className="inline-flex items-center gap-2 text-base font-normal text-gray-700 transition-colors hover:text-primary"
                      >
                        <UserPlus className="h-4 w-4" aria-hidden />
                        Assign to me
                      </button>
                    )}
                  </DetailField>
                  <DetailField label="Caller" value={taskData.caller} />
                  <DetailField label="Company" value={taskData.company} />
                  <DetailField label="Priority">
                    <span
                      className={cn(
                        "inline-block rounded px-2.5 py-1 text-sm font-medium border",
                        PRIORITY_BADGE_STYLES[taskData.priority]
                      )}
                    >
                      {taskData.priority}
                    </span>
                  </DetailField>
                  <DetailField label="Date" value={taskData.date} />
                </div>

                {/* Equipment image */}
                <div className="relative mb-6 h-[340px] w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="absolute inset-4 flex items-center justify-center">
                    <img
                      src="/equipment.svg"
                      alt="Equipment"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="absolute right-4 top-4 flex flex-col gap-2">
                    <button
                      type="button"
                      aria-label="Expand"
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white transition-colors hover:bg-gray-100"
                    >
                      <Maximize2 className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      type="button"
                      aria-label="Zoom in"
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white transition-colors hover:bg-gray-100"
                    >
                      <Plus className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      type="button"
                      aria-label="Zoom out"
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white transition-colors hover:bg-gray-100"
                    >
                      <Minus className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Status indicators */}
                <div className="mb-8 grid grid-cols-3 gap-6">
                  <StatusIndicator
                    label="Capacity"
                    value={taskData.capacity}
                    dotColor="rgb(34 197 94)"
                  />
                  <StatusIndicator
                    label="Operating mode"
                    value={taskData.operatingMode}
                  />
                  <StatusIndicator
                    label="Loaded"
                    value={taskData.loaded}
                    dotColor="rgb(59 130 246)"
                  />
                </div>

                {/* History */}
                <h3 className="mb-5 text-xl font-semibold text-gray-900">
                  History
                </h3>
                <div className="mb-8 space-y-0">
                  {taskData.history.map((item, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-start gap-3 py-3",
                        i < taskData.history.length - 1 &&
                          "border-b border-gray-100"
                      )}
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs font-medium text-gray-700">
                            {item.equipment}
                          </span>
                          <span className="text-base font-medium text-gray-900">
                            {item.title}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm font-normal text-gray-500">
                          {item.time} • {item.location} • {item.company} •{" "}
                          {item.type}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 pt-6">
                  <button
                    type="button"
                    onClick={handleStartWork}
                    className="rounded-lg bg-primary px-6 py-3 text-base font-medium text-white transition-colors hover:bg-primary/90 active:bg-primary/80"
                  >
                    Start work
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                    Create incident
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right column: Eva AI Assistant (40%) */}
          <div className="flex min-h-0 w-full flex-col overflow-hidden bg-white lg:w-[40%]">
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-8 py-8">
              {/* Eva header */}
              <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                  <Sparkles className="h-4 w-4" aria-hidden />
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-900">Eva</p>
                  <p className="text-sm font-normal text-gray-500">
                    [the assistant]
                  </p>
                </div>
              </div>

              {/* System knowledge */}
              <div className="mb-6 flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" aria-hidden />
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  System knowledge
                </p>
              </div>

              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Recent history
              </p>
              <ul className="mb-5 list-disc space-y-2 pl-4 text-sm font-normal leading-relaxed text-gray-700">
                {taskData?.evaData.recentHistory.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>

              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Last service
              </p>
              <div className="mb-5 space-y-2 text-sm text-gray-700">
                <p>
                  {taskData?.evaData.lastService.date} by{" "}
                  <span className="inline-flex items-center gap-1">
                    <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-semibold text-yellow-700">
                      {taskData?.evaData.lastService.technician.initials}
                    </span>
                    {taskData?.evaData.lastService.technician.name}
                  </span>
                </p>
                <p>{taskData?.evaData.lastService.work}</p>
                <p className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" aria-hidden />
                  <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-primary">
                    {taskData?.evaData.lastService.nextService}
                  </span>
                </p>
              </div>

              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Recommended focus
              </p>
              <ul className="mb-6 list-disc space-y-2 pl-4 text-sm font-normal leading-relaxed text-gray-700">
                {taskData?.evaData.recommendedFocus.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>

              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Relevant docs
              </p>
              <div className="mb-6 space-y-2">
                {taskData?.evaData.relevantDocs.map((doc, i) => (
                  <a
                    key={i}
                    href={doc.url}
                    className="flex items-center gap-2 py-2 text-sm font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
                  >
                    {doc.title}
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  </a>
                ))}
              </div>
            </div>

            {/* Chat input - sticky at bottom */}
            <div className="shrink-0 border-t border-gray-200 bg-white pt-5">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ask Eva"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 py-3 pl-4 pr-12 text-sm font-normal transition-colors placeholder:text-gray-500 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim()}
                  aria-label="Send"
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary/90 disabled:bg-gray-300 disabled:opacity-70"
                >
                  <ArrowUp className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
