"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AttendanceStatus } from "@prisma/client";

type Row = {
  id: string;
  date: Date;
  checkIn: Date | null;
  checkOut: Date | null;
  status: AttendanceStatus;
  note: string | null;
  employee: { id: string; name: string; email: string; employeeId: string };
};

const STATUS_CLS: Record<AttendanceStatus, string> = {
  PRESENT: "bg-accent text-foreground",
  ABSENT: "bg-destructive text-destructive-foreground",
  HALF_DAY: "bg-warning text-foreground",
  WORK_FROM_HOME: "bg-secondary text-foreground",
};

const fmt = (d: Date | null) => (d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—");

export function AttendanceTable({ records }: { records: Row[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Check in</TableHead>
            <TableHead>Check out</TableHead>
            <TableHead>Note</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <Link
                  href={`/hrm/${r.employee.id}`}
                  className="font-medium hover:underline"
                >
                  {r.employee.name}
                </Link>
                <p className="text-[10px] font-mono text-muted-foreground">
                  {r.employee.employeeId}
                </p>
              </TableCell>
              <TableCell className="text-xs">
                {new Date(r.date).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Badge className={STATUS_CLS[r.status]}>
                  {r.status.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-xs">{fmt(r.checkIn)}</TableCell>
              <TableCell className="text-xs">{fmt(r.checkOut)}</TableCell>
              <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                {r.note ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
