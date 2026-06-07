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
import {
  deletePartnership,
  updatePartnership,
} from "@/app/operations/actions";
import { NewPartnershipButton } from "./new-partnership-dialog";
import { useRouter } from "next/navigation";

type Partnership = {
  id: string;
  organization: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  status: string;
  type: string | null;
  notes: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  PROSPECTING: "Prospecting",
  DISCUSSION: "Discussion",
  AGREEMENT: "Agreement",
  ACTIVE: "Active",
  PAUSED: "Paused",
  ENDED: "Ended",
};

const TYPE_LABELS: Record<string, string> = {
  RESELLER: "Reseller",
  TECHNOLOGY: "Technology",
  MARKETING: "Marketing",
  INTEGRATION: "Integration",
  STRATEGIC: "Strategic",
  OTHER: "Other",
};

const STATUS_CLS: Record<string, string> = {
  PROSPECTING: "bg-muted text-foreground",
  DISCUSSION: "bg-secondary text-foreground",
  AGREEMENT: "bg-warning text-foreground",
  ACTIVE: "bg-accent text-foreground",
  PAUSED: "bg-muted text-muted-foreground",
  ENDED: "bg-destructive text-destructive-foreground",
};

export function PartnershipsTable({ rows }: { rows: Partnership[] }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{rows.length} partnerships</p>
        <NewPartnershipButton />
      </div>
      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
          No partnerships tracked.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Organization</th>
                <th className="px-3 py-2 text-left font-medium">Contact</th>
                <th className="px-3 py-2 text-left font-medium">Type</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <PartnershipRow key={r.id} row={r} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PartnershipRow({ row }: { row: Partnership }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [pending, start] = useTransition();
  const [pendingDel, startDel] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [organization, setOrganization] = useState(row.organization);
  const [contactName, setContactName] = useState(row.contactName ?? "");
  const [contactEmail, setContactEmail] = useState(row.contactEmail ?? "");
  const [contactPhone, setContactPhone] = useState(row.contactPhone ?? "");
  const [notes, setNotes] = useState(row.notes ?? "");
  const [status, setStatus] = useState(row.status);
  const [type, setType] = useState(row.type ?? "");

  const save = () => {
    setError(null);
    start(async () => {
      const res = await updatePartnership({
        id: row.id,
        organization: organization.trim(),
        contactName: contactName || null,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        notes: notes || null,
        status: status as
          | "PROSPECTING"
          | "DISCUSSION"
          | "AGREEMENT"
          | "ACTIVE"
          | "PAUSED"
          | "ENDED",
        type: (type as
          | "RESELLER"
          | "TECHNOLOGY"
          | "MARKETING"
          | "INTEGRATION"
          | "STRATEGIC"
          | "OTHER"
          | "") || null,
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
    if (!confirm("Delete this partnership?")) return;
    startDel(async () => {
      const res = await deletePartnership(row.id);
      if (!res.success) alert(res.error);
      else router.refresh();
    });
  };

  return (
    <tr className="border-t border-border">
      <td className="px-3 py-2 font-medium">{row.organization}</td>
      <td className="px-3 py-2 text-xs">
        <p>{row.contactName ?? "—"}</p>
        {row.contactEmail ? (
          <p className="text-[10px] text-muted-foreground">{row.contactEmail}</p>
        ) : null}
      </td>
      <td className="px-3 py-2 text-xs">
        {row.type ? TYPE_LABELS[row.type] ?? row.type : "—"}
      </td>
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
            <DialogTitle>Edit partnership</DialogTitle>
            <DialogDescription>Update partnership details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Organization</Label>
                <Input
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                />
              </div>
              <div>
                <Label>Contact name</Label>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>
              <div>
                <Label>Contact email</Label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
              <div>
                <Label>Contact phone</Label>
                <Input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="— None —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {Object.entries(TYPE_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              disabled={pending || !organization.trim()}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </tr>
  );
}
