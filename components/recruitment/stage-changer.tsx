"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, ChevronDown } from "lucide-react";
import { moveCandidate } from "@/app/recruitment/actions";
import type { CandidateStage } from "@prisma/client";

const STAGE_LABELS: Record<CandidateStage, string> = {
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  TECHNICAL_ROUND: "Technical round",
  ASSIGNMENT: "Assignment",
  OFFER: "Offer",
  HIRED: "Hired",
  REJECTED: "Rejected",
};

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

export function StageChanger({
  candidateId,
  currentStage,
}: {
  candidateId: string;
  currentStage: CandidateStage;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<CandidateStage>(currentStage);

  const save = () => {
    setError(null);
    start(async () => {
      const res = await moveCandidate({ id: candidateId, stage });
      if (res.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          Move stage <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move candidate</DialogTitle>
          <DialogDescription>
            Currently in {STAGE_LABELS[currentStage]}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          {STAGES.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={s === stage ? "default" : "outline"}
              onClick={() => setStage(s)}
              disabled={s === currentStage}
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
            onClick={save}
            disabled={pending || stage === currentStage}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Move"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
