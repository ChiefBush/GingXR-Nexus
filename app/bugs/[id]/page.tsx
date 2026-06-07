import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BugActionsMenu } from "@/components/bug/bug-actions-menu";
import { BugStatusChanger } from "@/components/bug/bug-status-changer";
import { BugComments } from "@/components/bug/bug-comments";
import { ProtectedLayout } from "@/lib/protected-layout";
import { getBug, listBugComments } from "../actions";
import { listProducts } from "@/app/product/actions";
import { listReleases } from "@/app/releases/actions";
import { getCurrentUser } from "@/lib/rbac";
import type { BugPriority, BugSeverity, BugStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function BugDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <ProtectedLayout>
      <BugContent params={params} />
    </ProtectedLayout>
  );
}

async function BugContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [bugRes, commentsRes, productsRes, releasesRes, currentUser] = await Promise.all([
    getBug(id),
    listBugComments(id),
    listProducts(),
    listReleases(),
    getCurrentUser(),
  ]);
  if (!bugRes.success || !bugRes.data) return notFound();
  const bug = bugRes.data;
  const comments = commentsRes.success ? commentsRes.data : [];
  const products = productsRes.success ? productsRes.data : [];
  const releases = releasesRes.success
    ? releasesRes.data.map((r) => ({ id: r.id, label: `${r.product.name} v${r.version}` }))
    : [];

  return (
    <>
      <Link
        href="/bugs"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to Bugs
      </Link>
      <PageHeader
        title={bug.title}
        description={
          bug.description
            ? `${bug.bugId} · ${bug.description}`
            : bug.bugId
        }
        actions={
          <BugActionsMenu
            bugId={bug.id}
            initial={{
              title: bug.title,
              description: bug.description,
              severity: bug.severity,
              priority: bug.priority,
              status: bug.status,
              platform: bug.platform,
              productId: bug.productId,
              releaseId: bug.releaseId,
              version: bug.version,
              assigneeId: bug.assigneeId,
              steps: bug.steps,
            }}
            products={products}
            releases={releases}
          />
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
        <SeverityBadge severity={bug.severity as BugSeverity} />
        <PriorityBadge priority={bug.priority as BugPriority} />
        <StatusBadge status={bug.status as BugStatus} />
        {bug.platform ? <Badge variant="outline">{bug.platform}</Badge> : null}
        {bug.version ? <Badge variant="outline">v{bug.version}</Badge> : null}
        {bug.product ? <Badge variant="outline">Product: {bug.product.name}</Badge> : null}
        {bug.release ? (
          <Badge variant="outline">
            Release: v{bug.release.version} · {bug.release.name}
          </Badge>
        ) : null}
        <span className="text-muted-foreground">
          Assignee: {bug.assignee?.name ?? bug.assignee?.email ?? "Unassigned"}
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">
          Reporter: {bug.reporter.name ?? bug.reporter.email}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {bug.steps ? (
            <Card className="p-5">
              <h3 className="mb-2 text-sm font-semibold">Steps to reproduce</h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{bug.steps}</p>
            </Card>
          ) : null}

          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold">Activity</h3>
            <BugComments
              bugId={bug.id}
              comments={comments}
              currentUserId={currentUser?.id ?? ""}
            />
          </Card>
        </div>
        <div>
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold">Status</h3>
            <BugStatusChanger bugId={bug.id} currentStatus={bug.status as BugStatus} />
          </Card>
        </div>
      </div>
    </>
  );
}

function SeverityBadge({ severity }: { severity: BugSeverity }) {
  const map: Record<BugSeverity, { label: string; cls: string }> = {
    CRITICAL: { label: "Critical", cls: "bg-destructive text-destructive-foreground" },
    MAJOR: { label: "Major", cls: "bg-warning text-foreground" },
    MINOR: { label: "Minor", cls: "bg-muted text-muted-foreground" },
    TRIVIAL: { label: "Trivial", cls: "bg-muted text-muted-foreground" },
  };
  return <Badge className={map[severity].cls}>{map[severity].label}</Badge>;
}

function PriorityBadge({ priority }: { priority: BugPriority }) {
  const map: Record<BugPriority, { label: string; cls: string }> = {
    LOW: { label: "Low", cls: "bg-muted text-muted-foreground" },
    MEDIUM: { label: "Medium", cls: "bg-secondary text-foreground" },
    HIGH: { label: "High", cls: "bg-warning text-foreground" },
    CRITICAL: { label: "Critical", cls: "bg-destructive text-destructive-foreground" },
  };
  return <Badge className={map[priority].cls}>{map[priority].label}</Badge>;
}

function StatusBadge({ status }: { status: BugStatus }) {
  const map: Record<BugStatus, { label: string; cls: string }> = {
    OPEN: { label: "Open", cls: "bg-destructive text-destructive-foreground" },
    INVESTIGATING: { label: "Investigating", cls: "bg-warning text-foreground" },
    IN_PROGRESS: { label: "In progress", cls: "bg-secondary text-foreground" },
    TESTING: { label: "Testing", cls: "bg-accent text-foreground" },
    RESOLVED: { label: "Resolved", cls: "bg-primary text-primary-foreground" },
    CLOSED: { label: "Closed", cls: "bg-muted text-muted-foreground" },
  };
  return <Badge className={map[status].cls}>{map[status].label}</Badge>;
}
