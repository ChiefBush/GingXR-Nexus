import { PageHeader } from "@/components/shared/page-header";
import { NewLeadDialog } from "@/components/crm/new-lead-dialog";
import { LeadsView } from "@/components/crm/leads-view";
import { listLeads } from "./actions";
import { prisma } from "@/lib/prisma";
import { leadListQuerySchema } from "@/lib/validations/crm";
import { ProtectedLayout } from "@/lib/protected-layout";

export const dynamic = "force-dynamic";

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <ProtectedLayout>
      <CrmContent searchParams={searchParams} />
    </ProtectedLayout>
  );
}

async function CrmContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const params = leadListQuerySchema.safeParse({
    page: raw.page,
    limit: raw.limit,
    status: raw.status,
    priority: raw.priority,
    search: raw.search,
    assignedToId: raw.assignedToId,
    sortBy: raw.sortBy,
    sortOrder: raw.sortOrder,
  });
  const q = params.success ? params.data : leadListQuerySchema.parse({});

  const res = await listLeads(q);
  const leads = res.success ? res.data.data : [];

  const [total, won, lost, inPipeline] = await Promise.all([
    prisma.lead.count({ where: { deletedAt: null } }),
    prisma.lead.count({ where: { deletedAt: null, status: "WON" } }),
    prisma.lead.count({ where: { deletedAt: null, status: "LOST" } }),
    prisma.lead.count({
      where: {
        deletedAt: null,
        status: { in: ["QUALIFIED", "MEETING_SCHEDULED", "PROPOSAL_SENT", "NEGOTIATION"] },
      },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="CRM"
        description={`${total} leads · ${won} won · ${lost} lost · ${inPipeline} in pipeline`}
        actions={<NewLeadDialog />}
      />
      <LeadsView
        leads={leads}
        total={res.success ? res.data.total : 0}
        page={res.success ? res.data.page : 1}
        limit={res.success ? res.data.limit : 20}
        initialStatus={q.status}
        initialSearch={q.search}
      />
    </>
  );
}
