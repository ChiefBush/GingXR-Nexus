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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { createScorecard } from "@/app/recruitment/actions";

export function NewScorecardDialog({ candidateId }: { candidateId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [criteria, setCriteria] = useState("");
  const [score, setScore] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await createScorecard({
        candidateId,
        criteria,
        score: Number(score),
        notes: notes || null,
      });
      if (res.success) {
        setOpen(false);
        setCriteria("");
        setScore("");
        setNotes("");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add scorecard
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add scorecard</DialogTitle>
          <DialogDescription>
            Evaluate a single criterion for this candidate.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="scriteria">Criterion</Label>
            <Input
              id="scriteria"
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              required
              placeholder="e.g. System design, Communication"
            />
          </div>
          <div>
            <Label htmlFor="sscore">Score (0-100)</Label>
            <Input
              id="sscore"
              type="number"
              min={0}
              max={100}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="snotes">Notes</Label>
            <Textarea
              id="snotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending || !criteria.trim() || score === ""}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
