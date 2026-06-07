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
import { Loader2, ChevronDown } from "lucide-react";
import { updateAsset } from "@/app/assets/actions";
import type { AssetStatus } from "@prisma/client";

const STATUS_LABELS: Record<AssetStatus, string> = {
  ACTIVE: "Active",
  EXPIRED: "Expired",
  IN_MAINTENANCE: "In maintenance",
  DISPOSED: "Disposed",
};

const STATUSES: AssetStatus[] = [
  "ACTIVE",
  "EXPIRED",
  "IN_MAINTENANCE",
  "DISPOSED",
];

export function AssetStatusChanger({
  assetId,
  currentStatus,
}: {
  assetId: string;
  currentStatus: AssetStatus;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AssetStatus>(currentStatus);

  const save = () => {
    setError(null);
    start(async () => {
      const res = await updateAsset({ id: assetId, status });
      if (res.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          {STATUS_LABELS[currentStatus]}{" "}
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change status</DialogTitle>
          <DialogDescription>
            Currently {STATUS_LABELS[currentStatus]}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={s === status ? "default" : "outline"}
              onClick={() => setStatus(s)}
              disabled={s === currentStatus}
            >
              {STATUS_LABELS[s]}
            </Button>
          ))}
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={save} disabled={pending || status === currentStatus}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
