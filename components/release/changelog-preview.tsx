"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, Check } from "lucide-react";
import {
  addReleaseNote,
  deleteReleaseNote,
  generateChangelog,
  type ChangelogEntry,
} from "@/app/releases/actions";

type Note = { id: string; category: string };

export function ChangelogPreview({
  releaseId,
  initialEntries,
}: {
  releaseId: string;
  initialEntries: ChangelogEntry[];
}) {
  const router = useRouter();
  const [entries, setEntries] = useState<ChangelogEntry[]>(initialEntries);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [promoting, setPromoting] = useState(false);

  const regenerate = () => {
    setError(null);
    start(async () => {
      const res = await generateChangelog(releaseId);
      if (res.success) {
        setEntries(res.data);
      } else {
        setError(res.error);
      }
    });
  };

  const markdown = entries.length
    ? entries
        .map((e) => `- **${e.category}** — ${e.content}`)
        .join("\n")
    : "No items to include in changelog.";

  const copy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Promote: write each entry as a ReleaseNote on the release.
  const promote = () => {
    setPromoting(true);
    setError(null);
    let okCount = 0;
    (async () => {
      for (const e of entries) {
        const res = await addReleaseNote({
          releaseId,
          category: (e.category as "FEATURE" | "BUGFIX" | "IMPROVEMENT" | "BREAKING" | "GENERAL"),
          content: e.content,
        });
        if (res.success) okCount++;
      }
      setPromoting(false);
      if (okCount > 0) router.refresh();
    })();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={regenerate} disabled={pending}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Regenerate"}
        </Button>
        <Button size="sm" variant="outline" onClick={copy}>
          {copied ? (
            <>
              <Check className="mr-1 h-3.5 w-3.5" /> Copied
            </>
          ) : (
            <>
              <Copy className="mr-1 h-3.5 w-3.5" /> Copy markdown
            </>
          )}
        </Button>
        <Button size="sm" onClick={promote} disabled={promoting || entries.length === 0}>
          {promoting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save as notes"}
        </Button>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>

      <pre className="max-h-72 overflow-auto rounded-md border border-border bg-muted/30 p-3 text-xs leading-relaxed text-foreground">
        {markdown}
      </pre>

      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Link features, bugs, and tasks to this release to auto-generate changelog entries.
        </p>
      ) : null}
    </div>
  );
}
