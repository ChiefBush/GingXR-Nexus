"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { TaskPriority, TaskStatus } from "@prisma/client";

type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: { id: string; name: string | null; email: string } | null;
  sprint: { id: string; name: string } | null;
  dueDate: Date | null;
};

const STATUS_CLS: Record<TaskStatus, string> = {
  BACKLOG: "bg-muted text-muted-foreground",
  TO_DO: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-accent text-foreground",
  REVIEW: "bg-warning text-foreground",
  TESTING: "bg-secondary text-foreground",
  DONE: "bg-primary text-primary-foreground",
};
const PRIORITY_CLS: Record<TaskPriority, string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-secondary text-foreground",
  HIGH: "bg-warning text-foreground",
  CRITICAL: "bg-destructive text-destructive-foreground",
};

export function TasksTable({ tasks, projectId }: { tasks: Task[]; projectId: string }) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-12 text-center text-sm text-muted-foreground">
        No tasks yet. Use New Task to add one.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Sprint</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Due</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((t) => (
            <TableRow key={t.id}>
              <TableCell>
                <Link
                  href={`/projects/${projectId}/tasks/${t.id}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {t.title}
                </Link>
              </TableCell>
              <TableCell>
                <Badge className={STATUS_CLS[t.status]}>
                  {t.status.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={PRIORITY_CLS[t.priority]}>{t.priority}</Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {t.sprint?.name ?? "—"}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {t.assignee?.name ?? t.assignee?.email ?? "—"}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
