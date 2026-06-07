import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ReleaseActionsMenu } from "@/components/release/release-actions-menu";
import { ReleaseNotesPanel } from "@/components/release/release-notes-panel";
import { ReleaseItemsTable } from "@/components/release/release-items-table";
import { ChangelogPreview } from "@/components/release/changelog-preview";
import { ProtectedLayout } from "@/lib/protected-layout";
import { getRelease, generateChangelog } from "../actions";
import { listProducts } from "@/app/product/actions";
import type { ReleaseStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function ReleaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <ProtectedLayout>
      <ReleaseContent params={params} />
    </ProtectedLayout>
  );
}

async function ReleaseContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [releaseRes, changelogRes, productsRes] = await Promise.all([
    getRelease(id),
    generateChangelog(id),
    listProducts(),
  ]);
  if (!releaseRes.success || !releaseRes.data) return notFound();
  const release = releaseRes.data;
  const changelog = changelogRes.success ? changelogRes.data : [];
  const products = productsRes.success ? productsRes.data : [];

  return (
    <>
      <Link
        href="/releases"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to Releases
      </Link>
      <PageHeader
        title={`${release.product.name} · v${release.version}`}
        description={release.name}
        actions={
          <ReleaseActionsMenu
            releaseId={release.id}
            initial={{
              version: release.version,
              name: release.name,
              status: release.status,
              releaseDate: release.releaseDate
                ? release.releaseDate.toISOString().slice(0, 10)
                : null,
              notes: release.notes,
            }}
          />
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
        <StatusBadge status={release.status as ReleaseStatus} />
        {release.releaseDate ? (
          <span className="text-muted-foreground">
            {new Date(release.releaseDate).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-muted-foreground">No release date set</span>
        )}
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">
          {release.features.length} features · {release.bugs.length} bugs ·{" "}
          {release.tasks.length} tasks
        </span>
      </div>

      {release.notes ? (
        <Card className="mb-6 p-5">
          <h3 className="mb-2 text-sm font-semibold">Internal notes</h3>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{release.notes}</p>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold">Items in this release</h3>
            <ReleaseItemsTable
              releaseId={release.id}
              productId={release.productId}
              features={release.features}
              bugs={release.bugs}
              tasks={release.tasks}
            />
          </Card>
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold">Changelog preview</h3>
            <ChangelogPreview
              releaseId={release.id}
              initialEntries={changelog}
            />
          </Card>
        </div>
        <div>
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold">Notes</h3>
            <ReleaseNotesPanel
              releaseId={release.id}
              notes={release.releaseNotes}
            />
          </Card>
        </div>
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: ReleaseStatus }) {
  const map: Record<ReleaseStatus, { label: string; cls: string }> = {
    PLANNING: { label: "Planning", cls: "bg-muted text-muted-foreground" },
    DEVELOPMENT: { label: "Development", cls: "bg-secondary text-foreground" },
    QA: { label: "QA", cls: "bg-warning text-foreground" },
    RELEASED: { label: "Released", cls: "bg-primary text-primary-foreground" },
  };
  return <Badge className={map[status].cls}>{map[status].label}</Badge>;
}
