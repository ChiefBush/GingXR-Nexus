"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PriorityPill } from "./status-pill";
import { MatrixCell } from "./matrix-cell";
import { createFeature, createSubFeature, deleteFeature } from "@/app/product/actions";
import { featurePriorityEnum } from "@/lib/validations/product";
import type { FeaturePriority, PlatformStatus } from "@prisma/client";

type SubFeature = { id: string; name: string };
type Feature = {
  id: string;
  name: string;
  description: string | null;
  priority: FeaturePriority;
  subFeatures: SubFeature[];
  platformStatuses: { platformId: string; status: PlatformStatus }[];
};
type Platform = { id: string; name: string };

export function FeatureMatrix({
  productId,
  features,
  platforms,
}: {
  productId: string;
  features: Feature[];
  platforms: Platform[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="sticky left-0 z-10 bg-muted/50 px-3 py-2 text-left font-medium">
              Feature
            </th>
            {platforms.map((p) => (
              <th
                key={p.id}
                className="min-w-[120px] px-3 py-2 text-left font-medium"
              >
                {p.name}
              </th>
            ))}
            <th className="w-10 px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {features.length === 0 ? (
            <tr>
              <td
                colSpan={platforms.length + 2}
                className="px-3 py-12 text-center text-muted-foreground"
              >
                No features yet. Add the first one below.
              </td>
            </tr>
          ) : null}
          {features.map((f) => (
            <FeatureRow key={f.id} feature={f} platforms={platforms} />
          ))}
          <AddFeatureRow productId={productId} />
        </tbody>
      </table>
    </div>
  );
}

function FeatureRow({
  feature,
  platforms,
}: {
  feature: Feature;
  platforms: Platform[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pendingDelete, startDelete] = useTransition();

  const statusFor = (platformId: string) =>
    feature.platformStatuses.find((s) => s.platformId === platformId)?.status ?? null;

  const onDelete = () => {
    if (!confirm(`Delete "${feature.name}"?`)) return;
    startDelete(async () => {
      await deleteFeature(feature.id);
      router.refresh();
    });
  };

  return (
    <>
      <tr className="border-t border-border align-top">
        <td className="sticky left-0 z-10 bg-card px-3 py-3">
          <div className="flex items-start gap-2">
            <button
              onClick={() => setOpen((o) => !o)}
              className="mt-0.5 text-muted-foreground hover:text-foreground"
              aria-label={open ? "Collapse" : "Expand"}
            >
              <ChevronRight
                className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-90" : ""}`}
              />
            </button>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{feature.name}</p>
              {feature.description ? (
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                  {feature.description}
                </p>
              ) : null}
              <div className="mt-1.5 flex items-center gap-1.5">
                <PriorityPill priority={feature.priority} />
                {feature.subFeatures.length > 0 ? (
                  <span className="text-[10px] text-muted-foreground">
                    {feature.subFeatures.length} sub-feature
                    {feature.subFeatures.length === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </td>
        {platforms.map((p) => (
          <td key={p.id} className="px-2 py-2 text-center">
            <MatrixCell
              featureId={feature.id}
              subFeatureId={null}
              platformId={p.id}
              status={statusFor(p.id)}
            />
          </td>
        ))}
        <td className="px-2 py-2">
          <button
            type="button"
            onClick={onDelete}
            disabled={pendingDelete}
            className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            aria-label="Delete feature"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </td>
      </tr>
      {open
        ? feature.subFeatures.map((sf) => {
            // Sub-feature rows: their status maps onto the same platforms.
            const subStatuses = feature.platformStatuses.filter(
              (s) => s.platformId,
            );
            return (
              <tr key={sf.id} className="border-t border-border bg-muted/20">
                <td className="sticky left-0 z-10 bg-muted/20 px-3 py-2 pl-10 text-xs text-muted-foreground">
                  ↳ {sf.name}
                </td>
                {platforms.map((p) => (
                  <td key={p.id} className="px-2 py-2 text-center">
                    {/* Sub-feature cell uses the same status record (by platform). */}
                    <SubMatrixCell
                      subFeatureId={sf.id}
                      platformId={p.id}
                      status={
                        subStatuses.find((s) => s.platformId === p.id)?.status ??
                        null
                      }
                    />
                  </td>
                ))}
                <td />
              </tr>
            );
          })
        : null}
      {open ? <AddSubFeatureRow featureId={feature.id} /> : null}
    </>
  );
}

function SubMatrixCell({
  subFeatureId,
  platformId,
  status,
}: {
  subFeatureId: string;
  platformId: string;
  status: PlatformStatus | null;
}) {
  return (
    <MatrixCell
      featureId={null}
      subFeatureId={subFeatureId}
      platformId={platformId}
      status={status}
      size="compact"
    />
  );
}

function AddFeatureRow({ productId }: { productId: string }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<FeaturePriority>("MEDIUM");
  const [pending, start] = useTransition();

  const submit = () => {
    if (!name.trim()) return;
    start(async () => {
      await createFeature({
        productId,
        name: name.trim(),
        description: description.trim() || null,
        priority,
      });
      setName("");
      setDescription("");
      setPriority("MEDIUM");
      setShow(false);
      router.refresh();
    });
  };

  if (!show) {
    return (
      <tr className="border-t border-border">
        <td colSpan={2} className="px-3 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShow(true)}
            className="gap-1.5 text-muted-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            Add feature
          </Button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-border bg-accent/10">
      <td colSpan={2} className="px-3 py-2">
        <div className="space-y-2">
          <Input
            autoFocus
            placeholder="Feature name (e.g. Login)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              if (e.key === "Escape") setShow(false);
            }}
          />
          <Textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
          <div className="flex items-center gap-2">
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as FeaturePriority)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {featurePriorityEnum.options.map((p) => (
                  <SelectItem key={p} value={p}>
                    <PriorityPill priority={p as FeaturePriority} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={submit} disabled={pending || !name.trim()}>
              {pending ? "Saving…" : "Save"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShow(false)}
              disabled={pending}
            >
              Cancel
            </Button>
          </div>
        </div>
      </td>
    </tr>
  );
}

function AddSubFeatureRow({ featureId }: { featureId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pending, start] = useTransition();

  const submit = () => {
    if (!name.trim()) return;
    start(async () => {
      await createSubFeature({ featureId, name: name.trim() });
      setName("");
      router.refresh();
    });
  };

  return (
    <tr className="border-t border-border bg-muted/10">
      <td colSpan={2} className="px-3 py-2 pl-10">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Add sub-feature (e.g. OTP Login)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            className="h-8 text-sm"
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={submit}
            disabled={pending || !name.trim()}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      </td>
    </tr>
  );
}
