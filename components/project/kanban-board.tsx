"use client";

import { useState, useTransition, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { moveTask } from "@/app/projects/actions";
import type { TaskPriority, TaskStatus } from "@prisma/client";

type Assignee = { id: string; name: string | null; email: string; image: string | null } | null;
type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: Assignee;
  sprintId: string | null;
  dueDate: Date | null;
};
type Sprint = { id: string; name: string };

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "BACKLOG", label: "Backlog" },
  { status: "TO_DO", label: "To do" },
  { status: "IN_PROGRESS", label: "In progress" },
  { status: "REVIEW", label: "Review" },
  { status: "TESTING", label: "Testing" },
  { status: "DONE", label: "Done" },
];

export function KanbanBoard({
  projectId,
  initialTasks,
  sprints,
}: {
  projectId: string;
  initialTasks: Task[];
  sprints: Sprint[];
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [sprintFilter, setSprintFilter] = useState<string>("__all__");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<TaskStatus | null>(null);
  const [, start] = useTransition();

  const filtered = sprintFilter === "__all__"
    ? tasks
    : sprintFilter === "__none__"
      ? tasks.filter((t) => t.sprintId === null)
      : tasks.filter((t) => t.sprintId === sprintFilter);

  const byStatus = (s: TaskStatus) => filtered.filter((t) => t.status === s);

  const onDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
    setDraggingId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (e: DragEvent<HTMLDivElement>, s: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverCol(s);
  };
  const onDragLeave = () => setOverCol(null);
  const onDrop = (e: DragEvent<HTMLDivElement>, target: TaskStatus) => {
    e.preventDefault();
    setOverCol(null);
    const id = e.dataTransfer.getData("text/plain") || draggingId;
    setDraggingId(null);
    if (!id) return;
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === target) return;

    // Optimistic move.
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: target } : t)),
    );
    start(async () => {
      const res = await moveTask({ id, status: target });
      if (!res.success) {
        // Revert on failure.
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: task.status } : t)),
        );
        alert(res.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Sprint:</span>
        <select
          value={sprintFilter}
          onChange={(e) => setSprintFilter(e.target.value)}
          className="h-8 rounded-md border border-border bg-card px-2 text-xs"
        >
          <option value="__all__">All</option>
          <option value="__none__">No sprint (backlog)</option>
          {sprints.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <Link
          href={`/projects/${projectId}/list`}
          className="ml-auto text-xs text-muted-foreground hover:text-foreground"
        >
          Switch to list view →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {COLUMNS.map((col) => {
          const list = byStatus(col.status);
          const isOver = overCol === col.status;
          return (
            <div
              key={col.status}
              onDragOver={(e) => onDragOver(e, col.status)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, col.status)}
              className={`flex min-h-[400px] flex-col rounded-lg border bg-muted/20 p-2 transition-colors ${
                isOver ? "border-primary bg-accent/30" : "border-border"
              }`}
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {col.label}
                </span>
                <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {list.length}
                </span>
              </div>
              <div className="flex-1 space-y-2">
                {list.map((t) => (
                  <KanbanCard key={t.id} task={t} projectId={projectId} onDragStart={onDragStart} />
                ))}
                {list.length === 0 ? (
                  <div className="flex h-20 items-center justify-center rounded-md border border-dashed border-border text-[10px] text-muted-foreground">
                    Drop here
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KanbanCard({
  task,
  projectId,
  onDragStart,
}: {
  task: Task;
  projectId: string;
  onDragStart: (e: DragEvent<HTMLDivElement>, id: string) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      className="cursor-grab rounded-md border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
    >
      <Link href={`/projects/${projectId}/tasks/${task.id}`} className="block">
        <p className="text-sm font-medium leading-snug text-foreground">
          {task.title}
        </p>
        <div className="mt-2 flex items-center justify-between gap-1">
          <PriorityPill priority={task.priority} />
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            {task.dueDate ? (
              <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
            ) : null}
            {task.assignee ? (
              <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[9px] font-medium text-primary-foreground">
                {(task.assignee.name ?? task.assignee.email).slice(0, 1).toUpperCase()}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </div>
  );
}

function PriorityPill({ priority }: { priority: TaskPriority }) {
  const map: Record<TaskPriority, { label: string; cls: string }> = {
    LOW: { label: "Low", cls: "bg-muted text-muted-foreground" },
    MEDIUM: { label: "Medium", cls: "bg-secondary text-foreground" },
    HIGH: { label: "High", cls: "bg-warning text-foreground" },
    CRITICAL: { label: "Critical", cls: "bg-destructive text-destructive-foreground" },
  };
  const m = map[priority];
  return <Badge className={m.cls}>{m.label}</Badge>;
}
