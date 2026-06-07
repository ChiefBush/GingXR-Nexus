"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { deleteHoliday } from "@/app/hrm/actions";

type Holiday = {
  id: string;
  name: string;
  date: Date;
  description: string | null;
  recurring: boolean;
};

export function HolidaysList({ holidays }: { holidays: Holiday[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {holidays.map((h) => (
        <HolidayRow key={h.id} holiday={h} />
      ))}
    </div>
  );
}

function HolidayRow({ holiday }: { holiday: Holiday }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const onDelete = () => {
    if (!confirm("Delete this holiday?")) return;
    start(async () => {
      const res = await deleteHoliday(holiday.id);
      if (!res.success) alert(res.error);
      else router.refresh();
    });
  };
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{holiday.name}</h3>
            {holiday.recurring ? (
              <Badge className="bg-secondary text-foreground">Recurring</Badge>
            ) : null}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {new Date(holiday.date).toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          {holiday.description ? (
            <p className="mt-1 text-xs text-muted-foreground">{holiday.description}</p>
          ) : null}
        </div>
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
    </Card>
  );
}
