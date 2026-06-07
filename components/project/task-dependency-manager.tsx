"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, X } from "lucide-react";
import { addDependency, removeDependency } from "@/app/projects/actions";
import type { DependencyType, TaskStatus } from "@prisma/client";

type Dep = {
  id: string;
  type: DependencyType;
  dependsOn: { id: string; title: string; status: TaskStatus };
};

export function TaskDependencyManager({
  projectId,
  taskId,
  dependencies,
}: {
  projectId: string;
  taskId: string;
  dependencies: Dep[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [dependsOnId, setDependsOnId] = useState("");
  const [type, setType] = useState<DependencyType>("BLOCKS");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!dependsOnId.trim()) return;
    setError(null);
    start(async () => {
      const res = await addDependency({ taskId, dependsOnId, type });
      if (res.success) {
        setAdding(false);
        setDependsOnId("");
        setType("BLOCKS");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  const onRemove = (id: string) => {
    start(async () => {
      const res = await removeDependency(id);
      if (!res.success) alert(res.error);
      else router.refresh();
    });
  };

  return (
    <div className="space-y-2">
      {dependencies.length === 0 ? (
        <p className="text-sm text-muted-foreground">No dependencies.</p>
      ) : (
        <ul className="space-y-1">
          {dependencies.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
            >
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {d.type}
                </span>
                <p className="truncate font-medium">{d.dependsOn.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {d.dependsOn.status.replace("_", " ")}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemove(d.id)}
                aria-label="Remove dependency"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <Card className="space-y-2 border-dashed bg-muted/20 p-3">
          <input
            autoFocus
            value={dependsOnId}
            onChange={(e) => setDependsOnId(e.target.value)}
            placeholder="Depends-on task UUID"
            className="h-8 w-full rounded-md border border-border bg-card px-2 text-xs font-mono"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as DependencyType)}
            className="h-8 w-full rounded-md border border-border bg-card px-2 text-xs"
          >
            <option value="BLOCKS">Blocks</option>
            <option value="RELATES_TO">Relates to</option>
            <option value="DUPLICATES">Duplicates</option>
          </select>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)} disabled={pending}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={pending || !dependsOnId.trim()}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add"}
            </Button>
          </div>
        </Card>
      ) : (
        <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={() => setAdding(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add dependency
        </Button>
      )}
    </div>
  );
}
