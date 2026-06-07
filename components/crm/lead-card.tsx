"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LeadStatus, LeadPriority } from "@prisma/client";
import { changeLeadStatus } from "@/app/crm/actions";
import { StatusBadge, PriorityBadge } from "./lead-badges";

type LeadCardData = {
  id: string;
  companyName: string;
  contactName: string;
  value: unknown;
  priority: LeadPriority;
  status: LeadStatus;
  assignedTo?: { name: string | null } | null;
};

export function LeadCard({ lead }: { lead: LeadCardData }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const value =
    lead.value != null ? Number(lead.value).toLocaleString() : null;

  return (
    <div
      onClick={() => router.push(`/crm/${lead.id}`)}
      className="cursor-pointer space-y-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">
            {lead.companyName}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {lead.contactName}
          </p>
        </div>
        <PriorityBadge priority={lead.priority} />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{value ? `₹${value}` : "—"}</span>
        {lead.assignedTo?.name ? <span>{lead.assignedTo.name}</span> : null}
      </div>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-1.5"
      >
        <StatusBadge status={lead.status} />
        <select
          aria-label="Change status"
          disabled={pending}
          value={lead.status}
          onChange={(e) => {
            const next = e.target.value as LeadStatus;
            start(async () => {
              await changeLeadStatus(lead.id, next);
            });
          }}
          className="ml-auto rounded border border-border bg-card px-1.5 py-0.5 text-[10px] text-muted-foreground"
        >
          {(
            [
              "NEW",
              "QUALIFIED",
              "MEETING_SCHEDULED",
              "PROPOSAL_SENT",
              "NEGOTIATION",
              "WON",
              "LOST",
            ] as LeadStatus[]
          ).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
