"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2 } from "lucide-react";
import { createPlatform } from "@/app/product/actions";

export function NewPlatformInline() {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [pending, start] = useTransition();

  const submit = () => {
    if (!name.trim()) return;
    start(async () => {
      const res = await createPlatform({ name: name.trim() });
      if (res.success) {
        setName("");
        setAdding(false);
        router.refresh();
      }
    });
  };

  if (!adding) {
    return (
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setAdding(true)}
        className="gap-1.5 text-muted-foreground"
      >
        <Plus className="h-3.5 w-3.5" />
        Add platform
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        autoFocus
        placeholder="Platform name (e.g. iOS)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") setAdding(false);
        }}
        className="h-8 w-40"
      />
      <Button size="sm" onClick={submit} disabled={pending || !name.trim()}>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add"}
      </Button>
    </div>
  );
}
