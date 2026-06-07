import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AssetStatusChanger } from "@/components/assets/asset-status-changer";
import { NewAssignmentButton } from "@/components/assets/new-assignment-button";
import { AssignmentsList } from "@/components/assets/assignments-list";
import { ProtectedLayout } from "@/lib/protected-layout";
import { getAsset, listAssetCategories } from "../actions";
import { listEmployees } from "@/app/hrm/actions";
import type { AssetStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <ProtectedLayout>
      <AssetContent params={params} />
    </ProtectedLayout>
  );
}

async function AssetContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [aRes, cRes, eRes] = await Promise.all([
    getAsset(id),
    listAssetCategories(),
    listEmployees(),
  ]);
  if (!aRes.success || !aRes.data) return notFound();
  const a = aRes.data;
  const categories = cRes.success ? cRes.data : [];
  const employees = eRes.success
    ? eRes.data.map((e) => ({
        id: e.id,
        name: e.name,
        email: e.email,
        employeeId: e.employeeId,
      }))
    : [];

  return (
    <>
      <Link
        href="/assets"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to Assets
      </Link>
      <PageHeader
        title={a.name}
        description={`${a.type} · ${a.category.name}`}
        actions={
          <AssetStatusChanger
            assetId={a.id}
            currentStatus={a.status as AssetStatus}
          />
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
        <StatusBadge status={a.status as AssetStatus} />
        {a.value !== null ? (
          <span className="text-muted-foreground">
            ${Number(a.value).toLocaleString()}
          </span>
        ) : null}
        {a.purchaseDate ? (
          <span className="text-muted-foreground">
            · Purchased {new Date(a.purchaseDate).toLocaleDateString()}
          </span>
        ) : null}
        {a.expiryDate ? (
          <span className="text-muted-foreground">
            · Expires {new Date(a.expiryDate).toLocaleDateString()}
          </span>
        ) : null}
        {a.renewalDate ? (
          <span className="text-muted-foreground">
            · Renews {new Date(a.renewalDate).toLocaleDateString()}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <h3 className="mb-2 text-sm font-semibold">Details</h3>
          <dl className="grid grid-cols-1 gap-3 text-sm">
            <Field label="Type" value={a.type} />
            <Field label="Category" value={a.category.name} />
            <Field
              label="Owner"
              value={
                a.owner ? (
                  <Link
                    href={`/hrm/${a.owner.id}`}
                    className="text-primary hover:underline"
                  >
                    {a.owner.name} ({a.owner.employeeId})
                  </Link>
                ) : (
                  "Unassigned"
                )
              }
            />
            <Field
              label="Value"
              value={
                a.value !== null
                  ? `$${Number(a.value).toLocaleString()}`
                  : "—"
              }
            />
            <Field
              label="Purchase date"
              value={
                a.purchaseDate
                  ? new Date(a.purchaseDate).toLocaleDateString()
                  : "—"
              }
            />
            <Field
              label="Expiry"
              value={
                a.expiryDate
                  ? new Date(a.expiryDate).toLocaleDateString()
                  : "—"
              }
            />
            <Field
              label="Renewal"
              value={
                a.renewalDate
                  ? new Date(a.renewalDate).toLocaleDateString()
                  : "—"
              }
            />
          </dl>
          {a.notes ? (
            <>
              <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Notes
              </h4>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                {a.notes}
              </p>
            </>
          ) : null}
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              Assignments ({a._count.assignments})
            </h3>
            <NewAssignmentButton assetId={a.id} employees={employees} />
          </div>
          {a.assignments.length === 0 ? (
            <p className="rounded-md border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              No assignments yet. Assign this asset to an employee.
            </p>
          ) : (
            <AssignmentsList
              assignments={JSON.parse(JSON.stringify(a.assignments))}
            />
          )}
        </Card>
      </div>
    </>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: AssetStatus }) {
  const map: Record<AssetStatus, { label: string; cls: string }> = {
    ACTIVE: { label: "Active", cls: "bg-accent text-foreground" },
    EXPIRED: { label: "Expired", cls: "bg-destructive text-destructive-foreground" },
    IN_MAINTENANCE: { label: "Maintenance", cls: "bg-warning text-foreground" },
    DISPOSED: { label: "Disposed", cls: "bg-muted text-muted-foreground" },
  };
  return <Badge className={map[status].cls}>{map[status].label}</Badge>;
}
