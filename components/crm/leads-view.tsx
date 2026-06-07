"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FilterBar } from "@/components/shared/filter-bar";
import { KanbanBoard, type KanbanColumn } from "@/components/shared/kanban-board";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import { LeadCard } from "@/components/crm/lead-card";
import {
  StatusBadge,
  PriorityBadge,
  LEAD_STATUSES,
  STATUS_LABEL_MAP,
} from "@/components/crm/lead-badges";
import { changeLeadStatus } from "@/app/crm/actions";
import Link from "next/link";
import type { LeadStatus, LeadPriority } from "@prisma/client";

type Lead = {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  value: unknown;
  priority: LeadPriority;
  status: LeadStatus;
  assignedTo?: { name: string | null } | null;
};

export function LeadsView({
  leads,
  total,
  page,
  limit,
  initialStatus,
  initialSearch,
}: {
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
  initialStatus?: string;
  initialSearch?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const view = (params.get("view") as "kanban" | "table") ?? "kanban";
  const [pending, start] = useTransition();
  const [search, setSearch] = useState(initialSearch ?? "");
  const [status, setStatus] = useState(initialStatus ?? "");

  const setView = (next: "kanban" | "table") => {
    const p = new URLSearchParams(params);
    p.set("view", next);
    router.push(`/crm?${p.toString()}`);
  };

  const applyFilters = () => {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (status && status !== "__all__") p.set("status", status);
    p.set("view", view);
    router.push(`/crm?${p.toString()}`);
  };

  const onStatusChange = (id: string, newStatus: string) => {
    start(async () => {
      await changeLeadStatus(id, newStatus);
      router.refresh();
    });
  };

  const columns: KanbanColumn<Lead>[] = LEAD_STATUSES.map((s) => ({
    id: s,
    label: STATUS_LABEL_MAP[s],
    items: leads.filter((l) => l.status === s),
  }));

  const tableColumns: DataTableColumn<Lead>[] = [
    {
      key: "company",
      header: "Company",
      render: (l) => (
        <Link
          href={`/crm/${l.id}`}
          className="font-medium text-foreground hover:underline"
        >
          {l.companyName}
        </Link>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (l) => (
        <div>
          <p>{l.contactName}</p>
          <p className="text-xs text-muted-foreground">{l.email}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (l) => <StatusBadge status={l.status} />,
    },
    {
      key: "priority",
      header: "Priority",
      render: (l) => <PriorityBadge priority={l.priority} />,
    },
    {
      key: "value",
      header: "Value",
      className: "text-right",
      render: (l) =>
        l.value != null
          ? `₹${Number(l.value).toLocaleString()}`
          : "—",
    },
    {
      key: "assigned",
      header: "Assigned",
      render: (l) => l.assignedTo?.name ?? "—",
    },
  ];

  return (
    <div>
      <FilterBar
        searchPlaceholder="Search by company, contact, email…"
        search={search}
        onSearchChange={setSearch}
        selects={[
          {
            placeholder: "Status",
            value: status || "__all__",
            onChange: (v) => setStatus(v === "__all__" ? "" : v),
            options: LEAD_STATUSES.map((s) => ({
              value: s,
              label: STATUS_LABEL_MAP[s],
            })),
          },
        ]}
        rightSlot={
          <>
            <Button variant="ghost" size="sm" onClick={applyFilters}>
              Apply
            </Button>
            <div className="flex items-center rounded-md border border-border bg-card p-0.5">
              <Button
                variant={view === "kanban" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("kanban")}
                className="h-7 gap-1.5"
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Kanban
              </Button>
              <Button
                variant={view === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("table")}
                className="h-7 gap-1.5"
              >
                <List className="h-3.5 w-3.5" /> Table
              </Button>
            </div>
          </>
        }
      />

      {view === "kanban" ? (
        <KanbanBoard
          columns={columns}
          renderCard={(l) => <LeadCard lead={l} />}
          onStatusChange={pending ? undefined : onStatusChange}
        />
      ) : (
        <DataTable
          rows={leads}
          columns={tableColumns}
          total={total}
          page={page}
          limit={limit}
          basePath="/crm?view=table"
        />
      )}
    </div>
  );
}
