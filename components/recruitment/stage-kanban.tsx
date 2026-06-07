"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { moveCandidate } from "@/app/recruitment/actions";
import type { CandidateStage } from "@prisma/client";

type Candidate = {
  id: string;
  name: string;
  email: string;
  positionApplied: string;
  stage: CandidateStage;
  score: number | null;
};

const STAGE_LABELS: Record<CandidateStage, string> = {
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  TECHNICAL_ROUND: "Technical",
  ASSIGNMENT: "Assignment",
  OFFER: "Offer",
  HIRED: "Hired",
  REJECTED: "Rejected",
};

export function StageKanban({
  stages,
  candidates,
}: {
  stages: CandidateStage[];
  candidates: Candidate[];
}) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-fit gap-3 pb-2">
        {stages.map((s) => {
          const items = candidates.filter((c) => c.stage === s);
          return (
            <Column
              key={s}
              stage={s}
              label={STAGE_LABELS[s]}
              items={items}
            />
          );
        })}
      </div>
    </div>
  );
}

function Column({
  stage,
  label,
  items,
}: {
  stage: CandidateStage;
  label: string;
  items: Candidate[];
}) {
  const [dragOver, setDragOver] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    setError(null);
    start(async () => {
      const res = await moveCandidate({ id, stage });
      if (!res.success) setError(res.error);
      else router.refresh();
    });
  };

  return (
    <div
      className={`flex w-60 shrink-0 flex-col gap-2 rounded-lg border ${
        dragOver ? "border-primary bg-primary/5" : "border-border bg-card"
      } p-2`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <div className="flex items-center justify-between px-1">
        <h4 className="text-xs font-semibold">{label}</h4>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
          {items.length}
        </span>
      </div>
      <div className="flex min-h-[60px] flex-col gap-2">
        {items.map((c) => (
          <KanbanCard key={c.id} candidate={c} />
        ))}
        {items.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-3 text-center text-[10px] text-muted-foreground">
            Drop here
          </p>
        ) : null}
      </div>
      {pending ? (
        <p className="flex items-center gap-1 px-1 text-[10px] text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> moving…
        </p>
      ) : null}
      {error ? (
        <p className="px-1 text-[10px] text-destructive">{error}</p>
      ) : null}
    </div>
  );
}

function KanbanCard({ candidate }: { candidate: Candidate }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [stage, setStage] = useState<CandidateStage>(candidate.stage);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const promote = (next: CandidateStage) => {
    setError(null);
    start(async () => {
      const res = await moveCandidate({ id: candidate.id, stage: next });
      if (!res.success) setError(res.error);
      else router.refresh();
    });
  };

  return (
    <>
      <div
        draggable
        onDragStart={(e) => e.dataTransfer.setData("text/plain", candidate.id)}
        className="cursor-grab rounded-md border border-border bg-background p-2 text-xs shadow-sm hover:bg-accent/30"
      >
        <Link
          href={`/recruitment/${candidate.id}`}
          className="block font-medium text-foreground hover:underline"
        >
          {candidate.name}
        </Link>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
          {candidate.positionApplied}
        </p>
        {candidate.score !== null ? (
          <p className="mt-1 text-[10px] font-mono text-muted-foreground">
            Score {candidate.score}%
          </p>
        ) : null}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
          }}
          className="mt-1 inline-flex items-center gap-0.5 text-[10px] text-primary hover:underline"
        >
          Move <ArrowRight className="h-2.5 w-2.5" />
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move {candidate.name}</DialogTitle>
            <DialogDescription>
              Currently in {STAGE_LABELS[candidate.stage]}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            {(
              [
                "APPLIED",
                "SCREENING",
                "INTERVIEW",
                "TECHNICAL_ROUND",
                "ASSIGNMENT",
                "OFFER",
                "HIRED",
                "REJECTED",
              ] as CandidateStage[]
            ).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={s === stage ? "default" : "outline"}
                onClick={() => setStage(s)}
                disabled={s === candidate.stage}
              >
                {STAGE_LABELS[s]}
              </Button>
            ))}
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setOpen(false);
                promote(stage);
              }}
              disabled={pending || stage === candidate.stage}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Move"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
