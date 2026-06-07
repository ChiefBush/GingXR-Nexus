"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Edit2, Check, X } from "lucide-react";
import { updateSprint } from "@/app/projects/actions";
import type { SprintStatus } from "@prisma/client";

type Sprint = {
  id: string;
  name: string;
  goal: string | null;
  startDate: Date;
  endDate: Date;
  status: SprintStatus;
};

export function SprintsList({
  projectId,
  sprints,
}: {
  projectId: string;
  sprints: Sprint[];
}) {
  if (sprints.length === 0) {
    return (
      <Card className="p-12 text-center text-sm text-muted-foreground">
        No sprints yet. Create one to start grouping tasks.
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      {sprints.map((s) => (
        <SprintRow key={s.id} sprint={s} />
      ))}
    </div>
  );
}

function SprintRow({ sprint }: { sprint: Sprint }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(sprint.name);
  const [status, setStatus] = useState<SprintStatus>(sprint.status);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    setError(null);
    start(async () => {
      const res = await updateSprint({
        id: sprint.id,
        projectId: undefined as unknown as string,
        name,
        status,
      });
      if (res.success) {
        setEditing(false);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {editing ? (
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          ) : (
            <h3 className="font-semibold text-foreground">{sprint.name}</h3>
          )}
          {sprint.goal ? (
            <p className="mt-1 text-xs text-muted-foreground">{sprint.goal}</p>
          ) : null}
          <p className="mt-1 text-[11px] text-muted-foreground">
            {new Date(sprint.startDate).toLocaleDateString()} →{" "}
            {new Date(sprint.endDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SprintStatus)}
              className="h-8 rounded-md border border-border bg-card px-2 text-xs"
            >
              <option value="PLANNING">Planning</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
            </select>
          ) : (
            <StatusBadge status={sprint.status} />
          )}
          {editing ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={pending}>
                <X className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" onClick={save} disabled={pending || !name.trim()}>
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              </Button>
            </>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </Card>
  );
}

function StatusBadge({ status }: { status: SprintStatus }) {
  const map: Record<SprintStatus, { label: string; cls: string }> = {
    PLANNING: { label: "Planning", cls: "bg-muted text-muted-foreground" },
    ACTIVE: { label: "Active", cls: "bg-accent text-foreground" },
    COMPLETED: { label: "Completed", cls: "bg-primary text-primary-foreground" },
  };
  return <Badge className={map[status].cls}>{map[status].label}</Badge>;
}
