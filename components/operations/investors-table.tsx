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
import { deleteInvestor, updateInvestor } from "@/app/operations/actions";
import { NewInvestorButton } from "./new-investor-dialog";
import { useRouter } from "next/navigation";

type Investor = {
  id: string;
  name: string;
  fund: string | null;
  email: string | null;
  phone: string | null;
  ticketSize: string | null;
  lastMeeting: Date | null;
  nextFollowUp: Date | null;
  notes: string | null;
  status: string;
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  PASS: "Pass",
  COMMITTED: "Committed",
  PASSED: "Passed",
  ON_HOLD: "On hold",
};

const STATUS_CLS: Record<string, string> = {
  ACTIVE: "bg-accent text-foreground",
  PASS: "bg-muted text-muted-foreground",
  COMMITTED: "bg-success text-foreground",
  PASSED: "bg-destructive text-destructive-foreground",
  ON_HOLD: "bg-warning text-foreground",
};

const fmt = (d: Date | null) => (d ? new Date(d).toLocaleDateString() : "—");

export function InvestorsTable({ rows }: { rows: Investor[] }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{rows.length} investors</p>
        <NewInvestorButton />
      </div>
      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
          No investors tracked.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">Fund</th>
                <th className="px-3 py-2 text-left font-medium">Ticket</th>
                <th className="px-3 py-2 text-left font-medium">Last meeting</th>
                <th className="px-3 py-2 text-left font-medium">Next follow-up</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <InvestorRow key={r.id} row={r} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function InvestorRow({ row }: { row: Investor }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [pending, start] = useTransition();
  const [pendingDel, startDel] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(row.name);
  const [fund, setFund] = useState(row.fund ?? "");
  const [email, setEmail] = useState(row.email ?? "");
  const [phone, setPhone] = useState(row.phone ?? "");
  const [ticketSize, setTicketSize] = useState(row.ticketSize ?? "");
  const [lastMeeting, setLastMeeting] = useState(
    row.lastMeeting ? new Date(row.lastMeeting).toISOString().slice(0, 10) : "",
  );
  const [nextFollowUp, setNextFollowUp] = useState(
    row.nextFollowUp ? new Date(row.nextFollowUp).toISOString().slice(0, 10) : "",
  );
  const [notes, setNotes] = useState(row.notes ?? "");
  const [status, setStatus] = useState(row.status);

  const save = () => {
    setError(null);
    start(async () => {
      const res = await updateInvestor({
        id: row.id,
        name: name.trim(),
        fund: fund || null,
        email: email || null,
        phone: phone || null,
        ticketSize: ticketSize || null,
        lastMeeting: lastMeeting || null,
        nextFollowUp: nextFollowUp || null,
        notes: notes || null,
        status: status as
          | "ACTIVE"
          | "PASS"
          | "COMMITTED"
          | "PASSED"
          | "ON_HOLD",
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
    if (!confirm("Delete this investor?")) return;
    startDel(async () => {
      const res = await deleteInvestor(row.id);
      if (!res.success) alert(res.error);
      else router.refresh();
    });
  };

  return (
    <tr className="border-t border-border">
      <td className="px-3 py-2">
        <p className="font-medium">{row.name}</p>
        {row.email ? (
          <p className="text-[10px] text-muted-foreground">{row.email}</p>
        ) : null}
      </td>
      <td className="px-3 py-2 text-xs">{row.fund ?? "—"}</td>
      <td className="px-3 py-2 text-xs">{row.ticketSize ?? "—"}</td>
      <td className="px-3 py-2 text-xs">{fmt(row.lastMeeting)}</td>
      <td className="px-3 py-2 text-xs">{fmt(row.nextFollowUp)}</td>
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
            <DialogTitle>Edit investor</DialogTitle>
            <DialogDescription>Update investor details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>Fund</Label>
                <Input value={fund} onChange={(e) => setFund(e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <Label>Ticket size</Label>
                <Input
                  value={ticketSize}
                  onChange={(e) => setTicketSize(e.target.value)}
                  placeholder="e.g. 100K-500K"
                />
              </div>
              <div>
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
              <div>
                <Label>Last meeting</Label>
                <Input
                  type="date"
                  value={lastMeeting}
                  onChange={(e) => setLastMeeting(e.target.value)}
                />
              </div>
              <div>
                <Label>Next follow-up</Label>
                <Input
                  type="date"
                  value={nextFollowUp}
                  onChange={(e) => setNextFollowUp(e.target.value)}
                />
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
            <Button onClick={save} disabled={pending || !name.trim()}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </tr>
  );
}
