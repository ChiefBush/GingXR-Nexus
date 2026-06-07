"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, RotateCcw } from "lucide-react";
import {
  deleteAssignment,
  returnAssignment,
} from "@/app/assets/actions";

type Assignment = {
  id: string;
  assignedAt: Date;
  returnedAt: Date | null;
  condition: string | null;
  employee: {
    id: string;
    name: string;
    email: string;
    employeeId: string;
  };
};

export function AssignmentsList({ assignments }: { assignments: Assignment[] }) {
  return (
    <div className="space-y-2">
      {assignments.map((a) => (
        <AssignmentRow key={a.id} assignment={a} />
      ))}
    </div>
  );
}

function AssignmentRow({ assignment }: { assignment: Assignment }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const onReturn = () => {
    start(async () => {
      const res = await returnAssignment({ id: assignment.id });
      if (!res.success) alert(res.error);
      else router.refresh();
    });
  };
  const onDelete = () => {
    if (!confirm("Delete this assignment record?")) return;
    start(async () => {
      const res = await deleteAssignment(assignment.id);
      if (!res.success) alert(res.error);
      else router.refresh();
    });
  };
  const isOpen = assignment.returnedAt === null;
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/hrm/${assignment.employee.id}`}
              className="font-medium text-foreground hover:underline"
            >
              {assignment.employee.name}
            </Link>
            <span className="text-[10px] font-mono text-muted-foreground">
              {assignment.employee.employeeId}
            </span>
            {isOpen ? (
              <Badge className="bg-accent text-foreground">Active</Badge>
            ) : (
              <Badge className="bg-muted text-muted-foreground">Returned</Badge>
            )}
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Assigned {new Date(assignment.assignedAt).toLocaleDateString()}
            {assignment.returnedAt
              ? ` · Returned ${new Date(assignment.returnedAt).toLocaleDateString()}`
              : ""}
          </p>
          {assignment.condition ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {assignment.condition}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          {isOpen ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={onReturn}
              disabled={pending}
              aria-label="Mark returned"
            >
              {pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            disabled={pending}
            aria-label="Delete"
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
