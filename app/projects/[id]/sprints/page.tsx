import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { SprintsList } from "@/components/project/sprints-list";
import { NewSprintDialog } from "@/components/project/new-sprint-dialog";
import { ProtectedLayout } from "@/lib/protected-layout";
import { getProject } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ProjectSprintsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <ProtectedLayout>
      <SprintsContent params={params} />
    </ProtectedLayout>
  );
}

async function SprintsContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectRes = await getProject(id);
  if (!projectRes.success || !projectRes.data) return notFound();
  const project = projectRes.data;

  return (
    <>
      <Link
        href={`/projects/${project.id}`}
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to {project.name}
      </Link>
      <PageHeader
        title={`${project.name} · Sprints`}
        description={`${project.sprints.length} sprints`}
        actions={<NewSprintDialog projectId={project.id} />}
      />
      <SprintsList
        projectId={project.id}
        sprints={project.sprints}
      />
    </>
  );
}
