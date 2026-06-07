"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { deleteGrant, updateGrant } from "@/app/operations/actions";
import { NewGrantButton } from "./new-grant-dialog";
import { useRouter } from "next/navigation";

type Grant = {
  id: string;
  program: string;
  organization: string;
  status: string;
  amount: string | null;
  deadline: Date | null;
  notes: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  RESEARCHING: "Researching",
  APPLIED: "Applied",
  IN_REVIEW: "In review",
  AWARDED: "Awarded",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

const STATUS_CLS: Record<string, string> = {
  RESEARCHING: "bg-muted text-foreground",
  APPLIED: "bg-secondary text-foreground",
  IN_REVIEW: "bg-warning text-foreground",
  AWARDED: "bg-accent text-foreground",
  REJECTED: "bg-destructive text-destructive-foreground",
  WITHDRAWN: "bg-muted text-muted-foreground",
};

const fmt = (d: Date | null) => (d ? new Date(d).toLocaleDateString() : "—");
const fmtAmount = (a: string | null) =>
  a ? `$${Number(a).toLocaleString()}` : "—";

export function GrantsTable({ rows }: { rows: Grant[] }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{rows.length} grants</p>
        <NewGrantButton />
      </div>
      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
          No grants tracked.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Program</th>
                <th className="px-3 py-2 text-left font-medium">Organization</th>
                <th className="px-3 py-2 text-left font-medium">Amount</th>
                <th className="px-3 py-2 text-left font-medium">Deadline</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <GrantRow key={r.id} row={r} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function GrantRow({ row }: { row: Grant }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [pending, start] = useTransition();
  const [pendingDel, startDel] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [program, setProgram] = useState(row.program);
  const [organization, setOrganization] = useState(row.organization);
  const [amount, setAmount] = useState(row.amount ?? "");
  const [deadline, setDeadline] = useState(
    row.deadline ? new Date(row.deadline).toISOString().slice(0, 10) : "",
  );
  const [notes, setNotes] = useState(row.notes ?? "");
  const [status, setStatus] = useState(row.status);

  const save = () => {
    setError(null);
    start(async () => {
      const res = await updateGrant({
        id: row.id,
        program: program.trim(),
        organization: organization.trim(),
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
        setEditOpen(false);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  const onDelete = () => {
    if (!confirm("Delete this grant?")) return;
    startDel(async () => {
      const res = await deleteGrant(row.id);
      if (!res.success) alert(res.error);
      else router.refresh();
    });
  };

  return (
    <tr className="border-t border-border">
      <td className="px-3 py-2 font-medium">{row.program}</td>
      <td className="px-3 py-2 text-xs">{row.organization}</td>
      <td className="px-3 py-2 text-xs font-mono">{fmtAmount(row.amount)}</td>
      <td className="px-3 py-2 text-xs">{fmt(row.deadline)}</td>
      <td className="px-3 py-2">
        <Badge className={STATUS_CLS[row.status] ?? "bg-muted text-foreground"}>
          {STATUS_LABELS[row.status] ?? row.status}
        </Badge>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            disabled={pendingDel}
            aria-label="Delete"
          >
            {pendingDel ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </td>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit grant</DialogTitle>
            <DialogDescription>Update grant details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Program</Label>
                <Input
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                />
              </div>
              <div>
                <Label>Organization</Label>
                <Input
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                />
              </div>
              <div>
                <Label>Amount (USD)</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
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
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setEditOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={pending || !program.trim() || !organization.trim()}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </tr>
  );
}
