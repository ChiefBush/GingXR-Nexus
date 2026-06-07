import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TaskActionsMenu } from "@/components/project/task-actions-menu";
import { TaskDependencyManager } from "@/components/project/task-dependency-manager";
import { ProtectedLayout } from "@/lib/protected-layout";
import { getTask } from "../../../actions";

export const dynamic = "force-dynamic";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>;
}) {
  return (
    <ProtectedLayout>
      <TaskContent params={params} />
    </ProtectedLayout>
  );
}

async function TaskContent({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>;
}) {
  const { id, taskId } = await params;
  const res = await getTask(taskId);
  if (!res.success || !res.data) return notFound();
  const task = res.data;

  return (
    <>
      <Link
        href={`/projects/${id}`}
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to project
      </Link>
      <PageHeader
        title={task.title}
        description={task.description ?? undefined}
        actions={
          <TaskActionsMenu
            projectId={id}
            taskId={task.id}
            initial={{
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              assigneeId: task.assigneeId,
              sprintId: task.sprintId,
              dueDate: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : null,
            }}
          />
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
        <Badge className="bg-muted text-muted-foreground">
          {task.status.replace("_", " ")}
        </Badge>
        <Badge className="bg-secondary text-foreground">{task.priority}</Badge>
        {task.sprint ? <Badge variant="outline">Sprint: {task.sprint.name}</Badge> : null}
        {task.assignee ? (
          <Badge variant="outline">Assignee: {task.assignee.name ?? task.assignee.email}</Badge>
        ) : (
          <Badge variant="outline">Unassigned</Badge>
        )}
        {task.dueDate ? (
          <span className="text-muted-foreground">
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold">Subtasks</h3>
          {task.subtasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subtasks.</p>
          ) : (
            <ul className="space-y-1">
              {task.subtasks.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
                >
                  <span>{s.title}</span>
                  <Badge className="bg-muted text-muted-foreground">
                    {s.status.replace("_", " ")}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold">Dependencies</h3>
          <TaskDependencyManager
            projectId={id}
            taskId={task.id}
            dependencies={task.dependencies}
          />
        </Card>
      </div>
    </>
  );
}
