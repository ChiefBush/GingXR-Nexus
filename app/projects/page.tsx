import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { NewProjectDialog } from "@/components/project/new-project-dialog";
import { ProtectedLayout } from "@/lib/protected-layout";
import { listProjects, getProjectMetrics } from "./actions";
import type { ProjectStatus, TaskStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function ProjectsListPage() {
  return (
    <ProtectedLayout>
      <ProjectsListContent />
    </ProtectedLayout>
  );
}

async function ProjectsListContent() {
  const [projectsRes, metricsRes] = await Promise.all([
    listProjects(),
    getProjectMetrics(),
  ]);
  const projects = projectsRes.success ? projectsRes.data : [];
  const metrics = metricsRes.success
    ? metricsRes.data
    : { total: 0, active: 0, tasks: 0, done: 0 };

  return (
    <>
      <PageHeader
        title="Projects"
        description={`${metrics.total} projects · ${metrics.active} active · ${metrics.tasks} tasks`}
        actions={<NewProjectDialog />}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Total Projects" value={metrics.total} />
        <MetricCard label="Active" value={metrics.active} />
        <MetricCard label="Total Tasks" value={metrics.tasks} />
        <MetricCard label="Tasks Done" value={metrics.done} />
      </div>

      {projects.length === 0 ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">
          No projects yet. Click <span className="font-medium text-foreground">New Project</span> to
          create one.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const total = p.tasks.length;
            const done = p.tasks.filter(
              (t) => (t.status as TaskStatus) === "DONE",
            ).length;
            const pct = total ? Math.round((done / total) * 100) : 0;
            return (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card className="p-5 transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground">{p.name}</h3>
                    <StatusBadge status={p.status as ProjectStatus} />
                  </div>
                  {p.description ? (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {p.description}
                    </p>
                  ) : null}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {done}/{total} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{p.sprints.length} sprints</span>
                      <span>Owner: {p.owner?.name ?? "—"}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
    </Card>
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
  const m = map[status];
  return <Badge className={m.cls}>{m.label}</Badge>;
}
