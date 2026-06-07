"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setPlatformStatus } from "@/app/product/actions";
import { StatusPill, PLATFORM_STATUSES } from "./status-pill";
import { Loader2 } from "lucide-react";
import type { PlatformStatus } from "@prisma/client";

export function MatrixCell({
  featureId,
  subFeatureId,
  platformId,
  status,
  size = "default",
}: {
  featureId: string | null;
  subFeatureId: string | null;
  platformId: string;
  status: PlatformStatus | null;
  size?: "default" | "compact";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const current = status ?? "NOT_STARTED";

  const onChange = (next: PlatformStatus) => {
    start(async () => {
      const res = await setPlatformStatus({
        featureId: featureId ?? undefined,
        subFeatureId: subFeatureId ?? undefined,
        platformId,
        status: next,
      });
      if (res.success) router.refresh();
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-7 w-full items-center justify-center rounded-md hover:bg-muted focus:outline-none focus:ring-1 focus:ring-ring"
        aria-label="Change platform status"
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        ) : (
          <StatusPill status={current} className={size === "compact" ? "text-[10px] px-1.5" : undefined} />
        )}
      </button>
    );
  }

  return (
    <Select
      value={current}
      onValueChange={(v) => {
        onChange(v as PlatformStatus);
        setOpen(false);
      }}
      open={open}
      onOpenChange={setOpen}
    >
      <SelectTrigger className="h-7 w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PLATFORM_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            <StatusPill status={s} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
