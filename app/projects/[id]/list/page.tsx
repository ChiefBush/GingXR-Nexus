import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { TasksTable } from "@/components/project/tasks-table";
import { ProtectedLayout } from "@/lib/protected-layout";
import { getProject, getProjectTasks } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ProjectListViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <ProtectedLayout>
      <ListContent params={params} />
    </ProtectedLayout>
  );
}

async function ListContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [projectRes, tasksRes] = await Promise.all([
    getProject(id),
    getProjectTasks(id),
  ]);
  if (!projectRes.success || !projectRes.data) return notFound();
  const project = projectRes.data;
  const tasks = tasksRes.success ? tasksRes.data : [];

  return (
    <>
      <Link
        href={`/projects/${project.id}`}
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to {project.name}
      </Link>
      <PageHeader
        title={`${project.name} · List`}
        description={`${tasks.length} tasks`}
      />
      <TasksTable tasks={tasks} projectId={project.id} />
    </>
  );
}
