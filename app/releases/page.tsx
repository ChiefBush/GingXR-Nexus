import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { NewReleaseDialog } from "@/components/release/new-release-dialog";
import { ProtectedLayout } from "@/lib/protected-layout";
import { listReleases, getReleaseMetrics } from "./actions";
import { listProducts } from "@/app/product/actions";
import type { ReleaseStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function ReleasesListPage() {
  return (
    <ProtectedLayout>
      <ReleasesListContent />
    </ProtectedLayout>
  );
}

async function ReleasesListContent() {
  const [releasesRes, metricsRes, productsRes] = await Promise.all([
    listReleases(),
    getReleaseMetrics(),
    listProducts(),
  ]);

  const releases = releasesRes.success ? releasesRes.data : [];
  const metrics = metricsRes.success
    ? metricsRes.data
    : { total: 0, planning: 0, inProgress: 0, released: 0 };
  const products = productsRes.success ? productsRes.data : [];

  return (
    <>
      <PageHeader
        title="Releases"
        description={`${metrics.total} releases · ${metrics.inProgress} in progress · ${metrics.released} shipped`}
        actions={<NewReleaseDialog products={products} />}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Total" value={metrics.total} />
        <MetricCard label="Planning" value={metrics.planning} />
        <MetricCard label="In Progress" value={metrics.inProgress} />
        <MetricCard label="Shipped" value={metrics.released} />
      </div>

      {releases.length === 0 ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">
          No releases yet. Click <span className="font-medium text-foreground">New Release</span>{" "}
          to create one.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {releases.map((r) => (
            <Link key={r.id} href={`/releases/${r.id}`}>
              <Card className="p-5 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
                      {r.product.name}
                    </p>
                    <h3 className="mt-0.5 font-semibold text-foreground">
                      v{r.version}
                    </h3>
                    <p className="text-xs text-muted-foreground">{r.name}</p>
                  </div>
                  <StatusBadge status={r.status as ReleaseStatus} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <Stat n={r._count.features} label="features" />
                  <Stat n={r._count.bugs} label="bugs" />
                  <Stat n={r._count.tasks} label="tasks" />
                </div>
                {r.releaseDate ? (
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    {new Date(r.releaseDate).toLocaleDateString()}
                  </p>
                ) : (
                  <p className="mt-3 text-[11px] text-muted-foreground">No date set</p>
                )}
              </Card>
            </Link>
          ))}
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

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 py-2">
      <p className="text-base font-semibold">{n}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
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
