import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { NewBugDialog } from "@/components/bug/new-bug-dialog";
import { ProtectedLayout } from "@/lib/protected-layout";
import { listBugs, getBugMetrics } from "./actions";
import { listProducts } from "@/app/product/actions";
import { listReleases } from "@/app/releases/actions";
import type { BugPriority, BugSeverity, BugStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function BugsListPage() {
  return (
    <ProtectedLayout>
      <BugsListContent />
    </ProtectedLayout>
  );
}

async function BugsListContent() {
  const [bugsRes, metricsRes, productsRes, releasesRes] = await Promise.all([
    listBugs(),
    getBugMetrics(),
    listProducts(),
    listReleases(),
  ]);

  const bugs = bugsRes.success ? bugsRes.data : [];
  const metrics = metricsRes.success
    ? metricsRes.data
    : { total: 0, open: 0, investigating: 0, inProgress: 0, resolved: 0, closed: 0, critical: 0 };
  const products = productsRes.success ? productsRes.data : [];
  const releases = releasesRes.success ? releasesRes.data : [];

  return (
    <>
      <PageHeader
        title="Bugs"
        description={`${metrics.total} bugs · ${metrics.open} open · ${metrics.critical} critical`}
        actions={
          <NewBugDialog
            products={products}
            releases={releases.map((r) => ({ id: r.id, label: `${r.product.name} v${r.version}` }))}
          />
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Total" value={metrics.total} />
        <MetricCard label="Open" value={metrics.open} highlight={metrics.open > 0} />
        <MetricCard label="In Progress" value={metrics.inProgress} />
        <MetricCard label="Critical" value={metrics.critical} highlight={metrics.critical > 0} />
      </div>

      {bugs.length === 0 ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">
          No bugs yet. Click <span className="font-medium text-foreground">New Bug</span> to file one.
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">ID</th>
                <th className="px-3 py-2 text-left font-medium">Title</th>
                <th className="px-3 py-2 text-left font-medium">Severity</th>
                <th className="px-3 py-2 text-left font-medium">Priority</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">Assignee</th>
                <th className="px-3 py-2 text-left font-medium">Product</th>
              </tr>
            </thead>
            <tbody>
              {bugs.map((b) => (
                <tr key={b.id} className="border-t border-border">
                  <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                    {b.bugId}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/bugs/${b.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {b.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <SeverityBadge severity={b.severity as BugSeverity} />
                  </td>
                  <td className="px-3 py-2">
                    <PriorityBadge priority={b.priority as BugPriority} />
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={b.status as BugStatus} />
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {b.assignee?.name ?? b.assignee?.email ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {b.product?.name ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function MetricCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <Card className={`p-4 ${highlight ? "border-destructive/30 bg-destructive/5" : ""}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${highlight ? "text-destructive" : "text-foreground"}`}>
        {value}
      </p>
    </Card>
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
