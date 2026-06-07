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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteCandidate, updateCandidate } from "@/app/recruitment/actions";
import type { CandidateStage } from "@prisma/client";

type Initial = {
  name: string;
  email: string;
  positionApplied: string;
  score: number | null;
  notes: string | null;
};

export function CandidateActionsMenu({
  candidateId,
  currentStage,
  initial,
}: {
  candidateId: string;
  currentStage: CandidateStage;
  initial?: Initial;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [pending, start] = useTransition();
  const [pendingDelete, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [position, setPosition] = useState(initial?.positionApplied ?? "");
  const [score, setScore] = useState(
    initial?.score !== null && initial?.score !== undefined
      ? String(initial.score)
      : "",
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const save = () => {
    setError(null);
    start(async () => {
      const res = await updateCandidate({
        id: candidateId,
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        positionApplied: position.trim() || undefined,
        score: score ? Number(score) : undefined,
        notes: notes || null,
        stage: currentStage,
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
    if (!confirm("Delete this candidate? The record will be hidden.")) return;
    startDelete(async () => {
      const res = await deleteCandidate(candidateId);
      if (res.success) {
        router.push("/recruitment");
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
            Edit candidate
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Candidate</DialogTitle>
            <DialogDescription>
              Update candidate details. Stage is changed from the page header.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="ecname">Name</Label>
              <Input
                id="ecname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="(unchanged)"
              />
            </div>
            <div>
              <Label htmlFor="ecemail">Email</Label>
              <Input
                id="ecemail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="(unchanged)"
              />
            </div>
            <div>
              <Label htmlFor="ecposition">Position</Label>
              <Input
                id="ecposition"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="(unchanged)"
              />
            </div>
            <div>
              <Label htmlFor="ecscore">Score (0-100)</Label>
              <Input
                id="ecscore"
                type="number"
                min={0}
                max={100}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="(unchanged)"
              />
            </div>
            <div>
              <Label htmlFor="ecnotes">Notes</Label>
              <Textarea
                id="ecnotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="(unchanged)"
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={save} disabled={pending}>
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
