"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FilterOption = { label: string; value: string };

export function FilterBar({
  searchPlaceholder = "Search…",
  search,
  onSearchChange,
  selects = [],
  rightSlot,
}: {
  searchPlaceholder?: string;
  search?: string;
  onSearchChange?: (v: string) => void;
  selects?: { placeholder: string; value?: string; onChange: (v: string) => void; options: FilterOption[] }[];
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Input
        placeholder={searchPlaceholder}
        value={search ?? ""}
        onChange={(e) => onSearchChange?.(e.target.value)}
        className="max-w-xs"
      />
      {selects.map((s) => (
        <Select key={s.placeholder} value={s.value} onValueChange={s.onChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={s.placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All {s.placeholder}</SelectItem>
            {s.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      {rightSlot ? <div className="ml-auto flex items-center gap-2">{rightSlot}</div> : null}
    </div>
  );
}
