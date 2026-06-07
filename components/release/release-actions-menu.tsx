"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteRelease, updateRelease } from "@/app/releases/actions";
import type { ReleaseStatus } from "@prisma/client";

type Initial = {
  version: string;
  name: string;
  status: ReleaseStatus;
  releaseDate: string | null;
  notes: string | null;
};

export function ReleaseActionsMenu({
  releaseId,
  initial,
}: {
  releaseId: string;
  initial: Initial;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [version, setVersion] = useState(initial.version);
  const [name, setName] = useState(initial.name);
  const [status, setStatus] = useState<ReleaseStatus>(initial.status);
  const [releaseDate, setReleaseDate] = useState(initial.releaseDate ?? "");
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, startDelete] = useTransition();

  const save = () => {
    setError(null);
    start(async () => {
      const res = await updateRelease({
        id: releaseId,
        version: version.trim(),
        name: name.trim(),
        status,
        releaseDate: releaseDate || null,
        notes: notes || null,
      });
      if (res.success) {
        setEditOpen(false);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  const onDelete = () => {
    if (!confirm("Delete this release? It will be hidden, not removed.")) return;
    startDelete(async () => {
      const res = await deleteRelease(releaseId);
      if (res.success) {
        router.push("/releases");
        router.refresh();
      } else {
        alert(res.error);
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            Edit release
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Release</DialogTitle>
            <DialogDescription>Update release metadata.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ev">Version</Label>
                <Input id="ev" value={version} onChange={(e) => setVersion(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="ed">Release date</Label>
                <Input
                  id="ed"
                  type="date"
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="en">Name</Label>
              <Input id="en" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as ReleaseStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNING">Planning</SelectItem>
                  <SelectItem value="DEVELOPMENT">Development</SelectItem>
                  <SelectItem value="QA">QA</SelectItem>
                  <SelectItem value="RELEASED">Released</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="enotes">Internal notes</Label>
              <Textarea
                id="enotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={pending || !version.trim() || !name.trim()}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {pendingDelete ? (
        <span className="ml-2 text-xs text-muted-foreground">Deleting…</span>
      ) : null}
    </>
  );
}
