"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { deleteAsset, updateAsset } from "@/app/assets/actions";
import { NewAssetDialog } from "./new-asset-dialog";
import type { AssetStatus } from "@prisma/client";

type Asset = {
  id: string;
  name: string;
  type: string;
  category: { id: string; name: string };
  owner: { id: string; name: string; email: string; employeeId: string } | null;
  value: string | null;
  purchaseDate: Date | null;
  expiryDate: Date | null;
  renewalDate: Date | null;
  status: AssetStatus;
  notes: string | null;
  _count: { assignments: number };
};

type Category = { id: string; name: string };
type Emp = { id: string; name: string; email: string; employeeId: string };

const STATUS_LABELS: Record<AssetStatus, string> = {
  ACTIVE: "Active",
  EXPIRED: "Expired",
  IN_MAINTENANCE: "In maintenance",
  DISPOSED: "Disposed",
};

const STATUS_CLS: Record<AssetStatus, string> = {
  ACTIVE: "bg-accent text-foreground",
  EXPIRED: "bg-destructive text-destructive-foreground",
  IN_MAINTENANCE: "bg-warning text-foreground",
  DISPOSED: "bg-muted text-muted-foreground",
};

const fmt = (d: Date | null) => (d ? new Date(d).toLocaleDateString() : "—");
const fmtVal = (v: string | null) =>
  v ? `$${Number(v).toLocaleString()}` : "—";

export function AssetsTable({
  assets,
  categories,
  employees,
}: {
  assets: Asset[];
  categories: Category[];
  employees: Emp[];
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{assets.length} assets</p>
        <NewAssetDialog categories={categories} employees={employees} />
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Name</th>
              <th className="px-3 py-2 text-left font-medium">Type</th>
              <th className="px-3 py-2 text-left font-medium">Category</th>
              <th className="px-3 py-2 text-left font-medium">Owner</th>
              <th className="px-3 py-2 text-left font-medium">Value</th>
              <th className="px-3 py-2 text-left font-medium">Expiry</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="w-24" />
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <AssetRow
                key={a.id}
                row={a}
                categories={categories}
                employees={employees}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AssetRow({
  row,
  categories,
  employees,
}: {
  row: Asset;
  categories: Category[];
  employees: Emp[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [pending, start] = useTransition();
  const [pendingDel, startDel] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(row.name);
  const [type, setType] = useState(row.type);
  const [assetCategoryId, setAssetCategoryId] = useState(row.category.id);
  const [ownerId, setOwnerId] = useState(row.owner?.id ?? "__none__");
  const [value, setValue] = useState(row.value ?? "");
  const [purchaseDate, setPurchaseDate] = useState(
    row.purchaseDate ? new Date(row.purchaseDate).toISOString().slice(0, 10) : "",
  );
  const [expiryDate, setExpiryDate] = useState(
    row.expiryDate ? new Date(row.expiryDate).toISOString().slice(0, 10) : "",
  );
  const [renewalDate, setRenewalDate] = useState(
    row.renewalDate ? new Date(row.renewalDate).toISOString().slice(0, 10) : "",
  );
  const [status, setStatus] = useState<AssetStatus>(row.status);
  const [notes, setNotes] = useState(row.notes ?? "");

  const save = () => {
    setError(null);
    start(async () => {
      const res = await updateAsset({
        id: row.id,
        name: name.trim(),
        type: type.trim(),
        assetCategoryId,
        ownerId: ownerId === "__none__" ? null : ownerId,
        value: value ? Number(value) : null,
        purchaseDate: purchaseDate || null,
        expiryDate: expiryDate || null,
        renewalDate: renewalDate || null,
        status,
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
    if (!confirm("Delete this asset?")) return;
    startDel(async () => {
      const res = await deleteAsset(row.id);
      if (!res.success) alert(res.error);
      else router.refresh();
    });
  };

  return (
    <tr className="border-t border-border">
      <td className="px-3 py-2 font-medium">
        <Link
          href={`/assets/${row.id}`}
          className="text-foreground hover:underline"
        >
          {row.name}
        </Link>
      </td>
      <td className="px-3 py-2 text-xs">{row.type}</td>
      <td className="px-3 py-2 text-xs">
        <Badge className="bg-secondary text-foreground">
          {row.category.name}
        </Badge>
      </td>
      <td className="px-3 py-2 text-xs">
        {row.owner ? (
          <Link
            href={`/hrm/${row.owner.id}`}
            className="text-primary hover:underline"
          >
            {row.owner.name}
          </Link>
        ) : (
          "—"
        )}
      </td>
      <td className="px-3 py-2 text-xs font-mono">{fmtVal(row.value)}</td>
      <td className="px-3 py-2 text-xs">{fmt(row.expiryDate)}</td>
      <td className="px-3 py-2">
        <Badge className={STATUS_CLS[row.status]}>
          {STATUS_LABELS[row.status]}
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
            <DialogTitle>Edit asset</DialogTitle>
            <DialogDescription>Update asset details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>Type</Label>
                <Input value={type} onChange={(e) => setType(e.target.value)} />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={assetCategoryId}
                  onValueChange={setAssetCategoryId}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Owner</Label>
                <Select value={ownerId} onValueChange={setOwnerId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Unassigned</SelectItem>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name} ({e.employeeId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Value (USD)</Label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as AssetStatus)}
                >
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
                <Label>Purchase date</Label>
                <Input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Expiry date</Label>
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Label>Renewal date</Label>
                <Input
                  type="date"
                  value={renewalDate}
                  onChange={(e) => setRenewalDate(e.target.value)}
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
            <Button
              onClick={save}
              disabled={pending || !name.trim() || !type.trim()}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </tr>
  );
}
