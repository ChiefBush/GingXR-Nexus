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
import { createAsset } from "@/app/assets/actions";
import type { AssetStatus } from "@prisma/client";

type Category = { id: string; name: string };
type Emp = { id: string; name: string; email: string; employeeId: string };

const STATUS_LABELS: Record<AssetStatus, string> = {
  ACTIVE: "Active",
  EXPIRED: "Expired",
  IN_MAINTENANCE: "In maintenance",
  DISPOSED: "Disposed",
};

export function NewAssetDialog({
  categories,
  employees,
}: {
  categories: Category[];
  employees: Emp[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [assetCategoryId, setAssetCategoryId] = useState(
    categories[0]?.id ?? "",
  );
  const [ownerId, setOwnerId] = useState("__none__");
  const [value, setValue] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [renewalDate, setRenewalDate] = useState("");
  const [status, setStatus] = useState<AssetStatus>("ACTIVE");
  const [notes, setNotes] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await createAsset({
        name,
        type,
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
        setOpen(false);
        setName("");
        setType("");
        setValue("");
        setPurchaseDate("");
        setExpiryDate("");
        setRenewalDate("");
        setNotes("");
        setOwnerId("__none__");
        setStatus("ACTIVE");
        router.push(`/assets/${res.data.id}`);
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
          <Plus className="h-4 w-4" /> New Asset
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New asset</DialogTitle>
          <DialogDescription>Track a company asset.</DialogDescription>
        </DialogHeader>
        {categories.length === 0 ? (
          <p className="rounded-md border border-warning/40 bg-warning/10 p-3 text-xs text-muted-foreground">
            Create an asset category first.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="aname">Name</Label>
                <Input
                  id="aname"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. MacBook Pro 16″ — Sky"
                />
              </div>
              <div>
                <Label htmlFor="atype">Type</Label>
                <Input
                  id="atype"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  required
                  placeholder="e.g. Hardware, Domain, License"
                />
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
                    <SelectValue placeholder="Unassigned" />
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
                <Label htmlFor="avalue">Value (USD)</Label>
                <Input
                  id="avalue"
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0"
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
                <Label htmlFor="apurchase">Purchase date</Label>
                <Input
                  id="apurchase"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="aexpiry">Expiry date</Label>
                <Input
                  id="aexpiry"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="arenewal">Renewal date</Label>
                <Input
                  id="arenewal"
                  type="date"
                  value={renewalDate}
                  onChange={(e) => setRenewalDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="anotes">Notes</Label>
              <Textarea
                id="anotes"
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
                disabled={
                  pending ||
                  !name.trim() ||
                  !type.trim() ||
                  !assetCategoryId
                }
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
