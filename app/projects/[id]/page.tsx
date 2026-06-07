import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, KanbanSquare, ListTodo, Calendar } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { NewTaskDialog } from "@/components/project/new-task-dialog";
import { NewSprintDialog } from "@/components/project/new-sprint-dialog";
import { ProjectActionsMenu } from "@/components/project/project-actions-menu";
import { ProtectedLayout } from "@/lib/protected-layout";
import { getProject, getProjectTasks } from "../actions";
import type { ProjectPriority, ProjectStatus, TaskStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <ProtectedLayout>
      <ProjectDetailContent params={params} />
    </ProtectedLayout>
  );
}

async function ProjectDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [projectRes, tasksRes] = await Promise.all([
    getProject(id),
    getProjectTasks(id),
  ]);
  if (!projectRes.success || !projectRes.data) return notFound();
  const project = projectRes.data;
  const tasks = tasksRes.success ? tasksRes.data : [];

  const byStatus: Record<TaskStatus, number> = {
    BACKLOG: 0,
    TO_DO: 0,
    IN_PROGRESS: 0,
    REVIEW: 0,
    TESTING: 0,
    DONE: 0,
  };
  for (const t of tasks) {
    byStatus[t.status as TaskStatus]++;
  }

  return (
    <>
      <Link
        href="/projects"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to Projects
      </Link>
      <PageHeader
        title={project.name}
        description={project.description ?? undefined}
        actions={
          <ProjectActionsMenu
            projectId={project.id}
            initial={{
              name: project.name,
              description: project.description,
              status: project.status,
              priority: project.priority,
              startDate: project.startDate
                ? project.startDate.toISOString().slice(0, 10)
                : null,
              deadline: project.deadline
                ? project.deadline.toISOString().slice(0, 10)
                : null,
            }}
          />
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
        <StatusBadge status={project.status as ProjectStatus} />
        <PriorityBadge priority={project.priority as ProjectPriority} />
        {project.startDate ? (
          <span className="text-muted-foreground">
            Start: {new Date(project.startDate).toLocaleDateString()}
          </span>
        ) : null}
        {project.deadline ? (
          <span className="text-muted-foreground">
            · Deadline: {new Date(project.deadline).toLocaleDateString()}
          </span>
        ) : null}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link href={`/projects/${project.id}/board`}>
          <Card className="flex items-center gap-3 p-4 transition-shadow hover:shadow-md">
            <KanbanSquare className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Kanban Board</p>
              <p className="text-xs text-muted-foreground">Drag tasks across statuses</p>
            </div>
          </Card>
        </Link>
        <Link href={`/projects/${project.id}/list`}>
          <Card className="flex items-center gap-3 p-4 transition-shadow hover:shadow-md">
            <ListTodo className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">List View</p>
              <p className="text-xs text-muted-foreground">Table of all tasks</p>
            </div>
          </Card>
        </Link>
        <Link href={`/projects/${project.id}/sprints`}>
          <Card className="flex items-center gap-3 p-4 transition-shadow hover:shadow-md">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Sprints</p>
              <p className="text-xs text-muted-foreground">{project.sprints.length} sprints</p>
            </div>
          </Card>
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3 md:grid-cols-6">
        {(Object.keys(byStatus) as TaskStatus[]).map((s) => (
          <Card key={s} className="p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {s.replace("_", " ")}
            </p>
            <p className="mt-1 text-xl font-semibold">{byStatus[s]}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <NewTaskDialog projectId={project.id} sprints={project.sprints} />
        <NewSprintDialog projectId={project.id} />
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  const map: Record<ProjectStatus, { label: string; cls: string }> = {
    PLANNING: { label: "Planning", cls: "bg-muted text-muted-foreground" },
    ACTIVE: { label: "Active", cls: "bg-accent text-foreground" },
    ON_HOLD: { label: "On hold", cls: "bg-warning text-foreground" },
    COMPLETED: { label: "Completed", cls: "bg-primary text-primary-foreground" },
    CANCELLED: { label: "Cancelled", cls: "bg-destructive text-destructive-foreground" },
  };
  return <Badge className={map[status].cls}>{map[status].label}</Badge>;
}

function PriorityBadge({ priority }: { priority: ProjectPriority }) {
  const map: Record<ProjectPriority, { label: string; cls: string }> = {
    LOW: { label: "Low", cls: "bg-muted text-muted-foreground" },
    MEDIUM: { label: "Medium", cls: "bg-secondary text-foreground" },
    HIGH: { label: "High", cls: "bg-warning text-foreground" },
    CRITICAL: { label: "Critical", cls: "bg-destructive text-destructive-foreground" },
  };
  return <Badge className={map[priority].cls}>{map[priority].label}</Badge>;
}
