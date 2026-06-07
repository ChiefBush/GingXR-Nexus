"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
};

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  total,
  page,
  limit,
  basePath,
  emptyMessage = "No records found.",
}: {
  rows: T[];
  columns: DataTableColumn<T>[];
  total: number;
  page: number;
  limit: number;
  basePath: string;
  emptyMessage?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const [pendingPage, setPendingPage] = useState<number | null>(null);

  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((c) => (
              <TableHead key={c.key} className={c.className}>
                {c.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-32 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                {columns.map((c) => (
                  <TableCell key={c.key} className={c.className}>
                    {c.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
        <div>
          {total === 0
            ? "0 results"
            : `Showing ${(page - 1) * limit + 1}–${Math.min(
                page * limit,
                total,
              )} of ${total}`}
        </div>
        <div className="flex items-center gap-1">
          <Button
            asChild={page > 1}
            variant="ghost"
            size="icon"
            disabled={page <= 1}
            onClick={() => setPendingPage(page - 1)}
          >
            {page > 1 ? (
              <Link href={buildHref(page - 1)} aria-label="Previous page">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
          <span className="px-2">
            Page {pendingPage ?? page} of {totalPages}
          </span>
          <Button
            asChild={page < totalPages}
            variant="ghost"
            size="icon"
            disabled={page >= totalPages}
            onClick={() => setPendingPage(page + 1)}
          >
            {page < totalPages ? (
              <Link href={buildHref(page + 1)} aria-label="Next page">
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
