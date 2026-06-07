"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { History, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { restoreVersion } from "@/app/knowledge-base/actions";

type Version = {
  id: string;
  version: number;
  content: string;
  createdAt: Date;
  createdById: string;
};

export function ArticleVersionHistory({
  articleId,
  currentVersion,
  versions,
}: {
  articleId: string;
  currentVersion: number;
  versions: Version[];
}) {
  const router = useRouter();
  const [previewing, setPreviewing] = useState<Version | null>(null);
  const [confirming, setConfirming] = useState<Version | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const restore = (v: Version) => {
    setError(null);
    start(async () => {
      const res = await restoreVersion({ articleId, version: v.version });
      if (res.success) {
        setConfirming(null);
        setPreviewing(null);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  if (versions.length === 0) {
    return <p className="text-xs text-muted-foreground">No versions.</p>;
  }

  return (
    <div className="space-y-1">
      <ul className="space-y-1">
        {versions.map((v) => {
          const isCurrent = v.version === currentVersion;
          return (
            <li
              key={v.id}
              className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-xs"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <History className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">v{v.version}</span>
                  {isCurrent ? (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-medium text-primary-foreground">
                      current
                    </span>
                  ) : null}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(v.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPreviewing(v)}
                >
                  View
                </Button>
                {!isCurrent ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirming(v)}
                    aria-label="Restore this version"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog
        open={previewing !== null}
        onOpenChange={(o) => !o && setPreviewing(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Version {previewing?.version}</DialogTitle>
            <DialogDescription>
              {previewing
                ? new Date(previewing.createdAt).toLocaleString()
                : ""}
            </DialogDescription>
          </DialogHeader>
          <pre className="max-h-96 overflow-auto rounded-md border border-border bg-muted/30 p-3 text-xs leading-relaxed">
            {previewing?.content}
          </pre>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPreviewing(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirming !== null}
        onOpenChange={(o) => !o && setConfirming(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore version {confirming?.version}?</DialogTitle>
            <DialogDescription>
              This copies the content of v{confirming?.version} into a new
              revision (v{(confirming?.version ?? 0) + 0} → v{currentVersion + 1}).
              The current version is preserved.
            </DialogDescription>
          </DialogHeader>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirming(null)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => confirming && restore(confirming)}
              disabled={pending}
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Restore"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
