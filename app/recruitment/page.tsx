import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { NewCandidateDialog } from "@/components/recruitment/new-candidate-dialog";
import { CandidateActionsMenu } from "@/components/recruitment/candidate-actions-menu";
import { StageKanban } from "@/components/recruitment/stage-kanban";
import { ProtectedLayout } from "@/lib/protected-layout";
import {
  listCandidates,
  getRecruitmentMetrics,
} from "./actions";
import type { CandidateStage } from "@prisma/client";

export const dynamic = "force-dynamic";

const STAGES: CandidateStage[] = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "TECHNICAL_ROUND",
  "ASSIGNMENT",
  "OFFER",
  "HIRED",
  "REJECTED",
];

export default async function RecruitmentPage() {
  return (
    <ProtectedLayout>
      <RecruitmentContent />
    </ProtectedLayout>
  );
}

async function RecruitmentContent() {
  const [cRes, mRes] = await Promise.all([
    listCandidates(),
    getRecruitmentMetrics(),
  ]);
  const candidates = cRes.success ? cRes.data : [];
  const m = mRes.success
    ? mRes.data
    : {
        totalCandidates: 0,
        byStage: {} as Record<string, number>,
        hiredThisMonth: 0,
        rejectedThisMonth: 0,
        upcomingInterviews: 0,
        avgScore: null,
      };

  return (
    <>
      <PageHeader
        title="Recruitment"
        description={`${m.totalCandidates} candidates · ${m.upcomingInterviews} interviews upcoming`}
        actions={<NewCandidateDialog />}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Total candidates" value={m.totalCandidates} />
        <MetricCard label="Hired this month" value={m.hiredThisMonth} />
        <MetricCard label="Rejected this month" value={m.rejectedThisMonth} />
        <MetricCard label="Interviews upcoming" value={m.upcomingInterviews} />
        <MetricCard
          label="Avg score"
          value={m.avgScore !== null ? `${m.avgScore}%` : "—"}
        />
        <MetricCard label="In Applied" value={m.byStage.APPLIED ?? 0} />
        <MetricCard label="In Screening" value={m.byStage.SCREENING ?? 0} />
        <MetricCard label="In Offer" value={m.byStage.OFFER ?? 0} />
      </div>

      {candidates.length === 0 ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">
          No candidates yet. Click{" "}
          <span className="font-medium text-foreground">New Candidate</span> to add one.
        </Card>
      ) : (
        <>
          <h2 className="mb-3 text-sm font-semibold">Pipeline</h2>
          <StageKanban stages={STAGES} candidates={candidates} />

          <h2 className="mb-3 mt-8 text-sm font-semibold">All candidates</h2>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Name</th>
                  <th className="px-3 py-2 text-left font-medium">Email</th>
                  <th className="px-3 py-2 text-left font-medium">Position</th>
                  <th className="px-3 py-2 text-left font-medium">Source</th>
                  <th className="px-3 py-2 text-left font-medium">Stage</th>
                  <th className="px-3 py-2 text-left font-medium">Score</th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="px-3 py-2">
                      <Link
                        href={`/recruitment/${c.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {c.email}
                    </td>
                    <td className="px-3 py-2 text-xs">{c.positionApplied}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {c.source ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <StageBadge stage={c.stage} />
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {c.score !== null ? `${c.score}%` : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <CandidateActionsMenu
                        candidateId={c.id}
                        currentStage={c.stage}
                        initial={{
                          name: c.name,
                          email: c.email,
                          positionApplied: c.positionApplied,
                          score: c.score,
                          notes: null,
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
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
  value: number | string;
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
    </Card>
  );
}

function StageBadge({ stage }: { stage: CandidateStage }) {
  const map: Record<CandidateStage, { label: string; cls: string }> = {
    APPLIED: { label: "Applied", cls: "bg-muted text-foreground" },
    SCREENING: { label: "Screening", cls: "bg-secondary text-foreground" },
    INTERVIEW: { label: "Interview", cls: "bg-warning text-foreground" },
    TECHNICAL_ROUND: { label: "Technical", cls: "bg-warning text-foreground" },
    ASSIGNMENT: { label: "Assignment", cls: "bg-secondary text-foreground" },
    OFFER: { label: "Offer", cls: "bg-accent text-foreground" },
    HIRED: { label: "Hired", cls: "bg-accent text-foreground" },
    REJECTED: { label: "Rejected", cls: "bg-destructive text-destructive-foreground" },
  };
  return <Badge className={map[stage].cls}>{map[stage].label}</Badge>;
}
