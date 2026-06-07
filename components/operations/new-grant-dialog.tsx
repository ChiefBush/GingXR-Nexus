"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
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
import { createGrant } from "@/app/operations/actions";

const STATUS_LABELS: Record<string, string> = {
  RESEARCHING: "Researching",
  APPLIED: "Applied",
  IN_REVIEW: "In review",
  AWARDED: "Awarded",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

export function NewGrantButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [program, setProgram] = useState("");
  const [organization, setOrganization] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("APPLIED");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await createGrant({
        program,
        organization,
        amount: amount ? Number(amount) : null,
        deadline: deadline || null,
        notes: notes || null,
        status: status as
          | "RESEARCHING"
          | "APPLIED"
          | "IN_REVIEW"
          | "AWARDED"
          | "REJECTED"
          | "WITHDRAWN",
      });
      if (res.success) {
        setOpen(false);
        setProgram("");
        setOrganization("");
        setAmount("");
        setDeadline("");
        setNotes("");
        setStatus("APPLIED");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> New Grant
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New grant</DialogTitle>
          <DialogDescription>Track a grant application.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Program</Label>
              <Input
                autoFocus
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                required
                placeholder="e.g. SBIR Phase I"
              />
            </div>
            <div>
              <Label>Organization</Label>
              <Input
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                required
                placeholder="e.g. NSF"
              />
            </div>
            <div>
              <Label>Amount (USD)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Deadline</Label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
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
              disabled={pending || !program.trim() || !organization.trim()}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
