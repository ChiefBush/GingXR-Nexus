"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Loader2 } from "lucide-react";
import { linkItem, unlinkItem } from "@/app/releases/actions";
import type { BugSeverity, BugStatus, FeaturePriority, TaskPriority, TaskStatus } from "@prisma/client";

type Feature = { id: string; name: string; priority: FeaturePriority };
type Bug = { id: string; title: string; status: BugStatus; severity: BugSeverity };
type Task = { id: string; title: string; status: TaskStatus; priority: TaskPriority };

type ItemType = "feature" | "bug" | "task";

export function ReleaseItemsTable({
  releaseId,
  features,
  bugs,
  tasks,
}: {
  releaseId: string;
  productId: string;
  features: Feature[];
  bugs: Bug[];
  tasks: Task[];
}) {
  const router = useRouter();
  const [addingType, setAddingType] = useState<ItemType | null>(null);
  const [newId, setNewId] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!newId.trim() || !addingType) return;
    setError(null);
    start(async () => {
      const res = await linkItem({
        releaseId,
        itemId: newId.trim(),
        itemType: addingType,
      });
      if (res.success) {
        setAddingType(null);
        setNewId("");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  const onUnlink = (itemId: string, itemType: ItemType) => {
    start(async () => {
      const res = await unlinkItem({ releaseId, itemId, itemType });
      if (!res.success) alert(res.error);
      else router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <Section title={`Features (${features.length})`} empty={features.length === 0}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {features.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.name}</TableCell>
                <TableCell>
                  <Badge className="bg-muted text-muted-foreground">{f.priority}</Badge>
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => onUnlink(f.id, "feature")}
                    className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Unlink"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      <Section title={`Bugs (${bugs.length})`} empty={bugs.length === 0}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {bugs.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium">{b.title}</TableCell>
                <TableCell>
                  <Badge className="bg-muted text-muted-foreground">{b.severity}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className="bg-muted text-muted-foreground">{b.status}</Badge>
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => onUnlink(b.id, "bug")}
                    className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Unlink"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      <Section title={`Tasks (${tasks.length})`} empty={tasks.length === 0}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.title}</TableCell>
                <TableCell>
                  <Badge className="bg-muted text-muted-foreground">{t.status}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className="bg-muted text-muted-foreground">{t.priority}</Badge>
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => onUnlink(t.id, "task")}
                    className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Unlink"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      <div className="rounded-md border border-dashed border-border bg-muted/20 p-3">
        {addingType ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Paste the UUID of the {addingType} you want to link. (Server validates
              membership and product match.)
            </p>
            <Input
              autoFocus
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              placeholder={`${addingType} UUID`}
              className="font-mono text-xs"
            />
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAddingType(null);
                  setNewId("");
                  setError(null);
                }}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={submit} disabled={pending || !newId.trim()}>
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Link"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setAddingType("feature")}
            >
              <Plus className="h-3.5 w-3.5" /> Link feature
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setAddingType("bug")}
            >
              <Plus className="h-3.5 w-3.5" /> Link bug
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setAddingType("task")}
            >
              <Plus className="h-3.5 w-3.5" /> Link task
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      {empty ? (
        <p className="rounded-md border border-dashed border-border bg-card p-3 text-sm text-muted-foreground">
          None linked yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          {children}
        </div>
      )}
    </div>
  );
}
