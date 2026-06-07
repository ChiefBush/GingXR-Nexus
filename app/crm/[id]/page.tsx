import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/crm/lead-badges";
import { getLead } from "@/app/crm/actions";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProtectedLayout } from "@/lib/protected-layout";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <ProtectedLayout>
      <LeadDetailContent params={params} />
    </ProtectedLayout>
  );
}

async function LeadDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getLead(id);
  if (!res.success || !res.data) return notFound();
  const lead = res.data;

  return (
    <>
      <Link
        href="/crm"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to CRM
      </Link>
      <PageHeader
        title={lead.companyName}
        description={lead.contactName}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={lead.status} />
            <PriorityBadge priority={lead.priority} />
          </div>
        }
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-4 md:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Detail label="Email" value={lead.email} />
            <Detail label="Phone" value={lead.phone ?? "—"} />
            <Detail label="Industry" value={lead.industry ?? "—"} />
            <Detail label="Source" value={lead.source ?? "—"} />
            <Detail
              label="Value"
              value={
                lead.value != null
                  ? `₹${Number(lead.value).toLocaleString()}`
                  : "—"
              }
            />
            <Detail
              label="Assigned To"
              value={lead.assignedTo?.name ?? "Unassigned"}
            />
          </div>
          {lead.notes ? (
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Notes
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{lead.notes}</p>
            </div>
          ) : null}
        </Card>
        <Card className="p-4 space-y-3 text-sm">
          <Detail label="Lead ID" value={lead.id} mono />
          <Detail
            label="Created"
            value={new Date(lead.createdAt).toLocaleString()}
          />
          <Detail
            label="Last Updated"
            value={new Date(lead.updatedAt).toLocaleString()}
          />
          <Detail label="Created By" value={lead.createdBy?.name ?? "—"} />
        </Card>
      </div>
    </>
  );
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </p>
      <p className={mono ? "mt-0.5 font-mono text-xs" : "mt-0.5"}>{value}</p>
    </div>
  );
}
