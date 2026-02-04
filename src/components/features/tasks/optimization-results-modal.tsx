"use client";

import {
  CheckCircle,
  Clock,
  MapPin,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface OptimizationChange {
  taskId: string;
  taskName: string;
  type: "time" | "location" | "priority";
  before: string;
  after: string;
  reason: string;
}

/** Task shape used by optimization; must match Task from todos page for apply. */
export interface OptimizationTask {
  id: string;
  equipment: string;
  title: string;
  location: string;
  company: string;
  type: string;
  category: "urgent" | "upcoming";
  priority: "urgent" | "high" | "medium" | "low";
  startTime: string;
  endTime: string;
  duration: number;
  completed: boolean;
  conflictsWith: string[];
}

export interface OptimizationResult {
  optimizedTasks: OptimizationTask[];
  stats: {
    conflictsResolved: number;
    travelTimeSaved: string;
    efficiencyGain: string;
  };
  changes: OptimizationChange[];
}

export interface OptimizationResultsModalProps {
  open: boolean;
  onClose: () => void;
  result: OptimizationResult | null;
  onApply: () => void;
  onCancel: () => void;
}

const CHANGE_ICONS = {
  time: { Icon: Clock, className: "text-blue-500" },
  location: { Icon: MapPin, className: "text-teal-500" },
  priority: { Icon: AlertTriangle, className: "text-orange-500" },
} as const;

export function OptimizationResultsModal({
  open,
  onClose,
  result,
  onApply,
  onCancel,
}: OptimizationResultsModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  useEffect(() => {
    if (open && contentRef.current) {
      const focusable = contentRef.current.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1001] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="optimization-modal-title"
      aria-describedby="optimization-modal-desc"
    >
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden
        onClick={onCancel}
      />
      <div
        ref={contentRef}
        className="relative w-full max-w-[800px] max-h-[80vh] overflow-hidden rounded-xl bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex max-h-[80vh] flex-col">
          {/* Header */}
          <div className="mb-6 shrink-0">
            <CheckCircle
              className="mb-2 h-8 w-8 text-green-500"
              aria-hidden
            />
            <h2
              id="optimization-modal-title"
              className="text-2xl font-bold text-gray-900"
            >
              Schedule Optimized
            </h2>
            <p
              id="optimization-modal-desc"
              className="mt-1 text-base text-gray-600"
            >
              Eva has reorganized your tasks for maximum efficiency
            </p>
          </div>

          {result && (
            <>
              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4 shrink-0">
                <div className="rounded-lg bg-gray-50 p-4 text-center">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Conflicts
                  </p>
                  <p className="mt-1 text-sm">
                    <span className="text-gray-500 line-through">
                      {result.stats.conflictsResolved}
                    </span>
                    <ArrowRight className="mx-1 inline h-4 w-4 text-gray-400" />
                    <span className="font-semibold text-green-600">0</span>
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4 text-center">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Travel time
                  </p>
                  <p className="mt-1 text-sm font-semibold text-green-600">
                    {result.stats.travelTimeSaved}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4 text-center">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Efficiency
                  </p>
                  <p className="mt-1 text-sm font-semibold text-green-600">
                    {result.stats.efficiencyGain}
                  </p>
                </div>
              </div>

              {/* Changes list */}
              <div className="mt-6 shrink-0">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">
                  Key Changes
                </h3>
                <div
                  className="max-h-[300px] overflow-y-auto rounded-lg border border-gray-100"
                  tabIndex={0}
                >
                  {result.changes.map((change, index) => {
                    const { Icon, className } = CHANGE_ICONS[change.type];
                    return (
                      <div
                        key={`${change.taskId}-${index}`}
                        className="flex gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0"
                      >
                        <Icon
                          className={cn("h-5 w-5 shrink-0 mt-0.5", className)}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900">
                            {change.type === "location"
                              ? `Moved "${change.taskName}"`
                              : change.taskName}
                          </p>
                          <p className="mt-0.5 text-sm text-gray-600">
                            From: {change.before} → To: {change.after}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {change.reason}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={onCancel}
                  className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onApply}
                  className="inline-flex items-center rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Apply Changes
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
