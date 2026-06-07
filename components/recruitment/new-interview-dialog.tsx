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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { createInterview } from "@/app/recruitment/actions";
import type { InterviewType, InterviewResult } from "@prisma/client";

const TYPES: { value: InterviewType; label: string }[] = [
  { value: "PHONE", label: "Phone screen" },
  { value: "VIDEO", label: "Video" },
  { value: "ONSITE", label: "Onsite" },
  { value: "PANEL", label: "Panel" },
];

const RESULTS: { value: InterviewResult; label: string }[] = [
  { value: "STRONG_HIRE", label: "Strong hire" },
  { value: "HIRE", label: "Hire" },
  { value: "NO_DECISION", label: "No decision" },
  { value: "NO_HIRE", label: "No hire" },
  { value: "STRONG_NO_HIRE", label: "Strong no hire" },
];

export function NewInterviewDialog({ candidateId }: { candidateId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [type, setType] = useState<InterviewType>("VIDEO");
  const [rating, setRating] = useState("");
  const [result, setResult] = useState<InterviewResult | "">("");
  const [notes, setNotes] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await createInterview({
        candidateId,
        scheduledAt,
        type,
        rating: rating ? Number(rating) : null,
        result: result || null,
        notes: notes || null,
      });
      if (res.success) {
        setOpen(false);
        setScheduledAt("");
        setRating("");
        setResult("");
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
          Schedule
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule interview</DialogTitle>
          <DialogDescription>
            Add an interview round to the candidate&apos;s timeline.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="itime">Date & time</Label>
            <Input
              id="itime"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Type</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as InterviewType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="irating">Rating (1-5)</Label>
              <Input
                id="irating"
                type="number"
                min={1}
                max={5}
                value={rating}
                onChange={(e) => setRating(e.target.value)}
              />
            </div>
            <div>
              <Label>Result</Label>
              <Select
                value={result}
                onValueChange={(v) =>
                  setResult(v === "__none__" ? "" : (v as InterviewResult))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="(pending)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">(pending)</SelectItem>
                  {RESULTS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="inotes">Notes</Label>
            <Textarea
              id="inotes"
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
            <Button type="submit" disabled={pending || !scheduledAt}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
