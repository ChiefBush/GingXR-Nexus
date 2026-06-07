"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { moveBug } from "@/app/bugs/actions";
import type { BugStatus } from "@prisma/client";

const ALL_STATUSES: { value: BugStatus; label: string }[] = [
  { value: "OPEN", label: "Open" },
  { value: "INVESTIGATING", label: "Investigating" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "TESTING", label: "Testing" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

export function BugStatusChanger({
  bugId,
  currentStatus,
}: {
  bugId: string;
  currentStatus: BugStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<BugStatus>(currentStatus);
  const [pending, start] = useTransition();

  const onChange = (next: BugStatus) => {
    const prev = status;
    setStatus(next);
    start(async () => {
      const res = await moveBug({ id: bugId, status: next });
      if (!res.success) {
        setStatus(prev);
        alert(res.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-2">
      <Select
        value={status}
        onValueChange={(v) => onChange(v as BugStatus)}
        disabled={pending}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ALL_STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {pending ? (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Updating…
        </p>
      ) : null}
    </div>
  );
}
