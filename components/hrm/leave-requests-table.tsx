"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  decideLeaveRequest,
  deleteLeaveRequest,
} from "@/app/hrm/actions";
import type { LeaveStatus, LeaveType } from "@prisma/client";

type Leave = {
  id: string;
  leaveType: LeaveType;
  status: LeaveStatus;
  startDate: Date;
  endDate: Date;
  reason: string | null;
  employee: { id: string; name: string; email: string; employeeId: string };
};

const STATUS_CLS: Record<LeaveStatus, string> = {
  PENDING: "bg-warning text-foreground",
  APPROVED: "bg-accent text-foreground",
  REJECTED: "bg-destructive text-destructive-foreground",
};
const TYPE_LABELS: Record<LeaveType, string> = {
  CASUAL: "Casual",
  SICK: "Sick",
  EARNED: "Earned",
  WORK_FROM_HOME: "WFH",
};

export function LeaveRequestsTable({ leaves }: { leaves: Leave[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, start] = useTransition();

  const decide = (id: string, status: "APPROVED" | "REJECTED") => {
    setPendingId(id);
    start(async () => {
      const res = await decideLeaveRequest({ id, status });
      setPendingId(null);
      if (!res.success) alert(res.error);
      else router.refresh();
    });
  };

  const remove = (id: string) => {
    if (!confirm("Delete this leave request?")) return;
    setPendingId(id);
    start(async () => {
      const res = await deleteLeaveRequest(id);
      setPendingId(null);
      if (!res.success) alert(res.error);
      else router.refresh();
    });
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-32" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaves.map((l) => (
            <TableRow key={l.id}>
              <TableCell>
                <Link
                  href={`/hrm/${l.employee.id}`}
                  className="font-medium hover:underline"
                >
                  {l.employee.name}
                </Link>
                <p className="text-[10px] font-mono text-muted-foreground">
                  {l.employee.employeeId}
                </p>
              </TableCell>
              <TableCell>
                <Badge className="bg-secondary text-foreground">
                  {TYPE_LABELS[l.leaveType]}
                </Badge>
              </TableCell>
              <TableCell className="text-xs">
                {new Date(l.startDate).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-xs">
                {new Date(l.endDate).toLocaleDateString()}
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                {l.reason ?? "—"}
              </TableCell>
              <TableCell>
                <Badge className={STATUS_CLS[l.status]}>{l.status}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {l.status === "PENDING" ? (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => decide(l.id, "APPROVED")}
                        disabled={pendingId === l.id}
                        aria-label="Approve"
                      >
                        {pendingId === l.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => decide(l.id, "REJECTED")}
                        disabled={pendingId === l.id}
                        aria-label="Reject"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(l.id)}
                    disabled={pendingId === l.id}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
