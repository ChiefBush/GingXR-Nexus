import type { PlatformStatus, FeaturePriority } from "@prisma/client";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<PlatformStatus, { bg: string; text: string; label: string }> = {
  NOT_STARTED: { bg: "bg-muted", text: "text-muted-foreground", label: "Not Started" },
  PLANNED: { bg: "bg-secondary/40", text: "text-foreground", label: "Planned" },
  IN_PROGRESS: { bg: "bg-primary/15", text: "text-primary", label: "In Progress" },
  TESTING: { bg: "bg-warning/50", text: "text-foreground", label: "Testing" },
  BLOCKED: { bg: "bg-destructive/40", text: "text-destructive", label: "Blocked" },
  DONE: { bg: "bg-success/50", text: "text-foreground", label: "Done" },
};

export const PLATFORM_STATUSES = Object.keys(STATUS_STYLES) as PlatformStatus[];

export function StatusPill({ status, className }: { status: PlatformStatus; className?: string }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        s.bg,
        s.text,
        className,
      )}
    >
      {s.label}
    </span>
  );
}

const PRIORITY_STYLES: Record<FeaturePriority, string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-secondary text-secondary-foreground",
  HIGH: "bg-warning text-foreground",
  CRITICAL: "bg-destructive text-destructive-foreground",
};

export function PriorityPill({ priority }: { priority: FeaturePriority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        PRIORITY_STYLES[priority],
      )}
    >
      {priority}
    </span>
  );
}
