"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteInterview } from "@/app/recruitment/actions";
import type { InterviewResult, InterviewType } from "@prisma/client";

type Interview = {
  id: string;
  scheduledAt: Date;
  type: InterviewType;
  notes: string | null;
  rating: number | null;
  result: InterviewResult | null;
};

const TYPE_LABELS: Record<InterviewType, string> = {
  PHONE: "Phone",
  VIDEO: "Video",
  ONSITE: "Onsite",
  PANEL: "Panel",
};

const RESULT_LABELS: Record<InterviewResult, { label: string; cls: string }> = {
  STRONG_HIRE: { label: "Strong hire", cls: "bg-accent text-foreground" },
  HIRE: { label: "Hire", cls: "bg-accent text-foreground" },
  NO_DECISION: { label: "No decision", cls: "bg-muted text-foreground" },
  NO_HIRE: { label: "No hire", cls: "bg-destructive text-destructive-foreground" },
  STRONG_NO_HIRE: { label: "Strong no hire", cls: "bg-destructive text-destructive-foreground" },
};

export function InterviewsList({ interviews }: { interviews: Interview[] }) {
  return (
    <div className="space-y-2">
      {interviews.map((i) => (
        <InterviewRow key={i.id} interview={i} />
      ))}
    </div>
  );
}

function InterviewRow({ interview }: { interview: Interview }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const onDelete = () => {
    if (!confirm("Delete this interview?")) return;
    start(async () => {
      const res = await deleteInterview(interview.id);
      if (!res.success) alert(res.error);
      else router.refresh();
    });
  };
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-secondary text-foreground">
              {TYPE_LABELS[interview.type]}
            </Badge>
            <span className="text-xs font-medium">
              {new Date(interview.scheduledAt).toLocaleString()}
            </span>
            {interview.rating ? (
              <span className="text-[10px] text-muted-foreground">
                {interview.rating}/5
              </span>
            ) : null}
            {interview.result ? (
              <Badge className={RESULT_LABELS[interview.result].cls}>
                {RESULT_LABELS[interview.result].label}
              </Badge>
            ) : (
              <Badge className="bg-muted text-muted-foreground">Pending</Badge>
            )}
          </div>
          {interview.notes ? (
            <p className="mt-1 text-xs text-muted-foreground">{interview.notes}</p>
          ) : null}
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
