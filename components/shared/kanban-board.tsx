"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type KanbanColumn<T> = {
  id: string;
  label: string;
  items: T[];
};

export function KanbanBoard<T extends { id: string }>({
  columns,
  renderCard,
  onStatusChange,
}: {
  columns: KanbanColumn<T>[];
  renderCard: (item: T) => React.ReactNode;
  onStatusChange?: (itemId: string, newStatus: string) => void;
}) {
  const [dragging, setDragging] = useState<string | null>(null);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col) => (
        <div
          key={col.id}
          className="flex w-72 shrink-0 flex-col rounded-lg border border-border bg-muted/40"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragging && onStatusChange) {
              onStatusChange(dragging, col.id);
              setDragging(null);
            }
          }}
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-sm font-medium">{col.label}</span>
            <span className="rounded-full bg-card px-2 py-0.5 text-xs text-muted-foreground">
              {col.items.length}
            </span>
          </div>
          <div className="flex-1 space-y-2 p-2 min-h-[120px]">
            {col.items.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => setDragging(item.id)}
                onDragEnd={() => setDragging(null)}
                className={cn(
                  "rounded-md border border-border bg-card p-3 text-sm shadow-sm cursor-grab active:cursor-grabbing transition-opacity",
                  dragging === item.id && "opacity-40",
                )}
              >
                {renderCard(item)}
              </div>
            ))}
            {col.items.length === 0 ? (
              <div className="rounded-md border border-dashed border-border bg-card/40 py-6 text-center text-xs text-muted-foreground">
                No leads
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
