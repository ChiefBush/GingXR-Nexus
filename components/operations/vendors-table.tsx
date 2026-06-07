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
import { deleteVendor, updateVendor } from "@/app/operations/actions";
import { NewVendorButton } from "./new-vendor-dialog";
import { useRouter } from "next/navigation";

type Vendor = {
  id: string;
  name: string;
  service: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contractUrl: string | null;
  renewalDate: Date | null;
  status: string;
  notes: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  ENDED: "Ended",
};

const STATUS_CLS: Record<string, string> = {
  ACTIVE: "bg-accent text-foreground",
  ON_HOLD: "bg-warning text-foreground",
  ENDED: "bg-muted text-muted-foreground",
};

const fmt = (d: Date | null) => (d ? new Date(d).toLocaleDateString() : "—");

export function VendorsTable({ rows }: { rows: Vendor[] }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{rows.length} vendors</p>
        <NewVendorButton />
      </div>
      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
          No vendors tracked.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">Service</th>
                <th className="px-3 py-2 text-left font-medium">Contact</th>
                <th className="px-3 py-2 text-left font-medium">Renewal</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <VendorRow key={r.id} row={r} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function VendorRow({ row }: { row: Vendor }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [pending, start] = useTransition();
  const [pendingDel, startDel] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(row.name);
  const [service, setService] = useState(row.service ?? "");
  const [contactName, setContactName] = useState(row.contactName ?? "");
  const [contactEmail, setContactEmail] = useState(row.contactEmail ?? "");
  const [contactPhone, setContactPhone] = useState(row.contactPhone ?? "");
  const [contractUrl, setContractUrl] = useState(row.contractUrl ?? "");
  const [renewalDate, setRenewalDate] = useState(
    row.renewalDate ? new Date(row.renewalDate).toISOString().slice(0, 10) : "",
  );
  const [notes, setNotes] = useState(row.notes ?? "");
  const [status, setStatus] = useState(row.status);

  const save = () => {
    setError(null);
    start(async () => {
      const res = await updateVendor({
        id: row.id,
        name: name.trim(),
        service: service || null,
        contactName: contactName || null,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        contractUrl: contractUrl || null,
        renewalDate: renewalDate || null,
        notes: notes || null,
        status: status as "ACTIVE" | "ON_HOLD" | "ENDED",
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
    if (!confirm("Delete this vendor?")) return;
    startDel(async () => {
      const res = await deleteVendor(row.id);
      if (!res.success) alert(res.error);
      else router.refresh();
    });
  };

  return (
    <tr className="border-t border-border">
      <td className="px-3 py-2 font-medium">{row.name}</td>
      <td className="px-3 py-2 text-xs">{row.service ?? "—"}</td>
      <td className="px-3 py-2 text-xs">
        <p>{row.contactName ?? "—"}</p>
        {row.contactEmail ? (
          <p className="text-[10px] text-muted-foreground">{row.contactEmail}</p>
        ) : null}
      </td>
      <td className="px-3 py-2 text-xs">{fmt(row.renewalDate)}</td>
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
            <DialogTitle>Edit vendor</DialogTitle>
            <DialogDescription>Update vendor details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>Service</Label>
                <Input
                  value={service}
                  onChange={(e) => setService(e.target.value)}
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
                <Label>Contract URL</Label>
                <Input
                  type="url"
                  value={contractUrl}
                  onChange={(e) => setContractUrl(e.target.value)}
                />
              </div>
              <div>
                <Label>Renewal date</Label>
                <Input
                  type="date"
                  value={renewalDate}
                  onChange={(e) => setRenewalDate(e.target.value)}
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
