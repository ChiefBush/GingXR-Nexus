import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CandidateActionsMenu } from "@/components/recruitment/candidate-actions-menu";
import { StageChanger } from "@/components/recruitment/stage-changer";
import { NewInterviewDialog } from "@/components/recruitment/new-interview-dialog";
import { InterviewsList } from "@/components/recruitment/interviews-list";
import { NewScorecardDialog } from "@/components/recruitment/new-scorecard-dialog";
import { ScorecardsList } from "@/components/recruitment/scorecards-list";
import { ProtectedLayout } from "@/lib/protected-layout";
import { getCandidate } from "../actions";
import type { CandidateStage } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <ProtectedLayout>
      <CandidateContent params={params} />
    </ProtectedLayout>
  );
}

async function CandidateContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getCandidate(id);
  if (!res.success || !res.data) return notFound();
  const c = res.data;

  return (
    <>
      <Link
        href="/recruitment"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to Recruitment
      </Link>
      <PageHeader
        title={c.name}
        description={`${c.positionApplied} · ${c.email}`}
        actions={
          <div className="flex items-center gap-2">
            <StageChanger candidateId={c.id} currentStage={c.stage} />
            <CandidateActionsMenu
              candidateId={c.id}
              currentStage={c.stage}
              initial={{
                name: c.name,
                email: c.email,
                positionApplied: c.positionApplied,
                score: c.score,
                notes: c.notes,
              }}
            />
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
        <StageBadge stage={c.stage} />
        {c.source ? (
          <span className="text-muted-foreground">Source: {c.source}</span>
        ) : null}
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">
          Applied {new Date(c.createdAt).toLocaleDateString()}
        </span>
        {c.score !== null ? (
          <>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">Score {c.score}%</span>
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <h3 className="mb-2 text-sm font-semibold">Profile</h3>
          <dl className="grid grid-cols-1 gap-3 text-sm">
            <Field label="Email" value={c.email} />
            <Field label="Phone" value={c.phone ?? "—"} />
            <Field
              label="Resume"
              value={c.resumeUrl ? (
                <a
                  href={c.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View
                </a>
              ) : (
                "—"
              )}
            />
            <Field
              label="Portfolio"
              value={c.portfolio ? (
                <a
                  href={c.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View
                </a>
              ) : (
                "—"
              )}
            />
            <Field
              label="LinkedIn"
              value={c.linkedIn ? (
                <a
                  href={c.linkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View
                </a>
              ) : (
                "—"
              )}
            />
          </dl>
          {c.notes ? (
            <>
              <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Notes
              </h4>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                {c.notes}
              </p>
            </>
          ) : null}
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              Interviews ({c._count.interviews})
            </h3>
            <NewInterviewDialog candidateId={c.id} />
          </div>
          {c.interviews.length === 0 ? (
            <p className="rounded-md border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              No interviews scheduled yet.
            </p>
          ) : (
            <InterviewsList interviews={c.interviews} />
          )}
        </Card>

        <Card className="p-5 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              Scorecards ({c._count.scorecards})
            </h3>
            <NewScorecardDialog candidateId={c.id} />
          </div>
          {c.scorecards.length === 0 ? (
            <p className="rounded-md border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              No scorecards yet. Add one to evaluate this candidate.
            </p>
          ) : (
            <ScorecardsList scorecards={c.scorecards} />
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
