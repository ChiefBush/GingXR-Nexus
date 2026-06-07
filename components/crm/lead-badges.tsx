import { Badge } from "@/components/ui/badge";
import type { LeadStatus, LeadPriority } from "@prisma/client";

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  QUALIFIED: "Qualified",
  MEETING_SCHEDULED: "Meeting",
  PROPOSAL_SENT: "Proposal",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

const STATUS_CLASSES: Record<LeadStatus, string> = {
  NEW: "bg-muted text-foreground",
  QUALIFIED: "bg-secondary text-secondary-foreground",
  MEETING_SCHEDULED: "bg-accent text-accent-foreground",
  PROPOSAL_SENT: "bg-primary text-primary-foreground",
  NEGOTIATION: "bg-warning text-foreground",
  WON: "bg-success text-foreground",
  LOST: "bg-destructive text-destructive-foreground",
};

const PRIORITY_CLASSES: Record<LeadPriority, string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-secondary text-secondary-foreground",
  HIGH: "bg-warning text-foreground",
  URGENT: "bg-destructive text-destructive-foreground",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge className={STATUS_CLASSES[status]} variant="secondary">
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: LeadPriority }) {
  return (
    <Badge className={PRIORITY_CLASSES[priority]} variant="secondary">
      {priority}
    </Badge>
  );
}

export const LEAD_STATUSES: LeadStatus[] = [
  "NEW",
  "QUALIFIED",
  "MEETING_SCHEDULED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
];

export const STATUS_LABEL_MAP = STATUS_LABELS;
