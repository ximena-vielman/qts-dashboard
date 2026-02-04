"use client";

import { useState, useCallback, useMemo } from "react";
import { TaskItem } from "@/components/features/dashboard/task-item";

type TaskPriority = "urgent" | "high" | "medium" | "low";

export type FilterTab = "urgent" | "upcoming";

interface Task {
  id: string;
  equipment: string;
  title: string;
  time: string;
  location: string;
  company: string;
  type: string;
  priority: TaskPriority;
}

const MOCK_TASKS: Task[] = [
  {
    id: "1",
    equipment: "R-127",
    title: "Power Draw Spike",
    time: "7:42 AM",
    location: "ASH1-DC1",
    company: "Meta Inc.",
    type: "Preventive",
    priority: "urgent",
  },
  {
    id: "2",
    equipment: "R-145",
    title: "Temperature Anomaly",
    time: "8:15 AM",
    location: "ASH1-DC2",
    company: "AWS",
    type: "Incident",
    priority: "high",
  },
  {
    id: "3",
    equipment: "R-128",
    title: "Routine Maintenance Check",
    time: "9:00 AM",
    location: "ASH1-DC1",
    company: "Google Cloud",
    type: "Maintenance",
    priority: "medium",
  },
  {
    id: "4",
    equipment: "R-129",
    title: "Remote Hands Request",
    time: "10:30 AM",
    location: "ASH2-DC1",
    company: "Meta Inc.",
    type: "Remote hands",
    priority: "low",
  },
];

function isUrgent(priority: TaskPriority): boolean {
  return priority === "urgent" || priority === "high";
}

const MAX_VISIBLE_TASKS = 5;

export interface TaskListProps {
  filter: FilterTab;
  /** When provided, task items are clickable and this is called with the task id (e.g. to open detail drawer). */
  onTaskClick?: (taskId: string) => void;
}

/**
 * TaskList feature component.
 * Renders up to 5 TaskItem components for the To-Do's widget. Toggle lives in card header.
 */
export function TaskList({ filter, onTaskClick }: TaskListProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const filteredTasks = useMemo(() => {
    if (filter === "urgent") {
      return MOCK_TASKS.filter((t) => isUrgent(t.priority));
    }
    return MOCK_TASKS.filter((t) => !isUrgent(t.priority));
  }, [filter]);

  const visibleTasks = useMemo(
    () => filteredTasks.slice(0, MAX_VISIBLE_TASKS),
    [filteredTasks]
  );

  const handleToggle = useCallback((id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div>
      {visibleTasks.map((task) => (
        <TaskItem
          key={task.id}
          id={task.id}
          equipment={task.equipment}
          title={task.title}
          time={task.time}
          location={task.location}
          company={task.company}
          type={task.type}
          priority={task.priority}
          completed={completedIds.has(task.id)}
          onToggle={handleToggle}
          onClick={onTaskClick ? () => onTaskClick(task.id) : undefined}
        />
      ))}
    </div>
  );
}
