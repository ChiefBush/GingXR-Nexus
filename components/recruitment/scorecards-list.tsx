"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteScorecard } from "@/app/recruitment/actions";

type Scorecard = {
  id: string;
  criteria: string;
  score: number;
  notes: string | null;
  createdAt: Date;
};

export function ScorecardsList({ scorecards }: { scorecards: Scorecard[] }) {
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      {scorecards.map((s) => (
        <ScorecardRow key={s.id} scorecard={s} />
      ))}
    </div>
  );
}

function ScorecardRow({ scorecard }: { scorecard: Scorecard }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const onDelete = () => {
    if (!confirm("Delete this scorecard?")) return;
    start(async () => {
      const res = await deleteScorecard(scorecard.id);
      if (!res.success) alert(res.error);
      else router.refresh();
    });
  };
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-medium">{scorecard.criteria}</h4>
            <span
              className={`rounded-md px-2 py-0.5 font-mono text-xs ${
                scorecard.score >= 70
                  ? "bg-accent text-foreground"
                  : scorecard.score >= 40
                    ? "bg-warning text-foreground"
                    : "bg-destructive text-destructive-foreground"
              }`}
            >
              {scorecard.score}
            </span>
          </div>
          {scorecard.notes ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {scorecard.notes}
            </p>
          ) : null}
          <p className="mt-1 text-[10px] text-muted-foreground">
            {new Date(scorecard.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          disabled={pending}
          aria-label="Delete"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </Card>
  );
}
