import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { OperationsTabs } from "@/components/operations/operations-tabs";
import { ProtectedLayout } from "@/lib/protected-layout";
import {
  listInvestors,
  listGrants,
  listPartnerships,
  listVendors,
  getOperationsMetrics,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  return (
    <ProtectedLayout>
      <OperationsContent />
    </ProtectedLayout>
  );
}

async function OperationsContent() {
  const [invRes, grantRes, partRes, vendorRes, mRes] = await Promise.all([
    listInvestors(),
    listGrants(),
    listPartnerships(),
    listVendors(),
    getOperationsMetrics(),
  ]);

  const investors = invRes.success ? invRes.data : [];
  const grants = grantRes.success ? grantRes.data : [];
  const partnerships = partRes.success ? partRes.data : [];
  const vendors = vendorRes.success ? vendorRes.data : [];
  const m = mRes.success
    ? mRes.data
    : {
        totalInvestors: 0,
        activeInvestors: 0,
        totalGrants: 0,
        grantsAwarded: 0,
        totalFundingUsd: 0,
        totalPartnerships: 0,
        activePartnerships: 0,
        totalVendors: 0,
        activeVendors: 0,
        vendorsRenewingSoon: 0,
      };

  const totalCount =
    investors.length + grants.length + partnerships.length + vendors.length;

  return (
    <>
      <PageHeader
        title="Operations"
        description={`${m.activeInvestors} active investors · ${m.activePartnerships} active partnerships · ${m.activeVendors} active vendors`}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Metric label="Investors" value={m.totalInvestors} sub={`${m.activeInvestors} active`} />
        <Metric label="Grants" value={m.totalGrants} sub={`${m.grantsAwarded} awarded`} />
        <Metric
          label="Total funding"
          value={m.totalFundingUsd.toLocaleString()}
          sub="awarded grants"
        />
        <Metric
          label="Partnerships"
          value={m.totalPartnerships}
          sub={`${m.activePartnerships} active`}
        />
        <Metric
          label="Vendors renewing"
          value={m.vendorsRenewingSoon}
          sub="next 30 days"
          highlight={m.vendorsRenewingSoon > 0}
        />
      </div>

      {totalCount === 0 ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">
          Nothing tracked yet. Use the tabs below to add investors, grants,
          partnerships, and vendors.
        </Card>
      ) : (
        <OperationsTabs
          investors={JSON.parse(JSON.stringify(investors))}
          grants={JSON.parse(JSON.stringify(grants))}
          partnerships={JSON.parse(JSON.stringify(partnerships))}
          vendors={JSON.parse(JSON.stringify(vendors))}
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
