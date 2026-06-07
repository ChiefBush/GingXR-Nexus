import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { AssetsTable } from "@/components/assets/assets-table";
import { NewCategoryButton } from "@/components/assets/new-category-button";
import { ProtectedLayout } from "@/lib/protected-layout";
import { listAssets, listAssetCategories, getAssetMetrics } from "./actions";
import { listEmployees } from "@/app/hrm/actions";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  return (
    <ProtectedLayout>
      <AssetsContent />
    </ProtectedLayout>
  );
}

async function AssetsContent() {
  const [aRes, cRes, eRes, mRes] = await Promise.all([
    listAssets(),
    listAssetCategories(),
    listEmployees(),
    getAssetMetrics(),
  ]);
  const assets = aRes.success ? aRes.data : [];
  const categories = cRes.success ? cRes.data : [];
  const employees = eRes.success
    ? eRes.data.map((e) => ({
        id: e.id,
        name: e.name,
        email: e.email,
        employeeId: e.employeeId,
      }))
    : [];
  const m = mRes.success
    ? mRes.data
    : {
        totalAssets: 0,
        activeAssets: 0,
        expiredAssets: 0,
        totalValue: 0,
        expiringSoon: 0,
        unassignedAssets: 0,
        totalCategories: 0,
        currentlyAssigned: 0,
      };

  return (
    <>
      <PageHeader
        title="Assets"
        description={`${m.totalAssets} assets · ${m.expiringSoon} expiring in 30 days · ${m.unassignedAssets} unassigned`}
        actions={<NewCategoryButton />}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric
          label="Total value"
          value={`$${m.totalValue.toLocaleString()}`}
          sub={`${m.activeAssets} active`}
        />
        <Metric
          label="Expiring in 30d"
          value={m.expiringSoon}
          sub="renew or replace"
          highlight={m.expiringSoon > 0}
        />
        <Metric
          label="Expired"
          value={m.expiredAssets}
          sub="immediate attention"
          highlight={m.expiredAssets > 0}
        />
        <Metric
          label="Unassigned"
          value={m.unassignedAssets}
          sub={`${m.currentlyAssigned} out`}
        />
      </div>

      {categories.length > 0 ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((c) => (
            <span
              key={c.id}
              className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground"
            >
              {c.name} ({c._count.assets})
            </span>
          ))}
        </div>
      ) : null}

      {assets.length === 0 ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">
          No assets tracked. Add an asset category first, then create assets
          and assign them to employees.
        </Card>
      ) : (
        <AssetsTable
          assets={JSON.parse(JSON.stringify(assets))}
          categories={JSON.parse(JSON.stringify(categories))}
          employees={employees}
        />
      )}
    </>
  );
}

function Metric({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: number | string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <Card className={`p-4 ${highlight ? "border-warning/30 bg-warning/5" : ""}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold ${highlight ? "text-warning" : "text-foreground"}`}
      >
        {value}
      </p>
      {sub ? <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p> : null}
    </Card>
  );
}
