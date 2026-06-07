"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteBug, updateBug } from "@/app/bugs/actions";
import type { BugPriority, BugSeverity, BugStatus } from "@prisma/client";

type Product = { id: string; name: string };
type ReleaseOpt = { id: string; label: string };
type Initial = {
  title: string;
  description: string | null;
  severity: BugSeverity;
  priority: BugPriority;
  status: BugStatus;
  platform: string | null;
  productId: string | null;
  releaseId: string | null;
  version: string | null;
  assigneeId: string | null;
  steps: string | null;
};

export function BugActionsMenu({
  bugId,
  initial,
  products,
  releases,
}: {
  bugId: string;
  initial: Initial;
  products: Product[];
  releases: ReleaseOpt[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description ?? "");
  const [severity, setSeverity] = useState<BugSeverity>(initial.severity);
  const [priority, setPriority] = useState<BugPriority>(initial.priority);
  const [status, setStatus] = useState<BugStatus>(initial.status);
  const [platform, setPlatform] = useState(initial.platform ?? "");
  const [productId, setProductId] = useState<string>(initial.productId ?? "__none__");
  const [releaseId, setReleaseId] = useState<string>(initial.releaseId ?? "__none__");
  const [version, setVersion] = useState(initial.version ?? "");
  const [steps, setSteps] = useState(initial.steps ?? "");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, startDelete] = useTransition();

  const save = () => {
    setError(null);
    start(async () => {
      const res = await updateBug({
        id: bugId,
        title: title.trim(),
        description: description || null,
        severity,
        priority,
        status,
        platform: platform || null,
        productId: productId === "__none__" ? null : productId,
        releaseId: releaseId === "__none__" ? null : releaseId,
        version: version || null,
        steps: steps || null,
      });
      if (res.success) {
        setEditOpen(false);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  const onDelete = () => {
    if (!confirm("Delete this bug? It will be hidden, not removed.")) return;
    startDelete(async () => {
      const res = await deleteBug(bugId);
      if (res.success) {
        router.push("/bugs");
        router.refresh();
      } else {
        alert(res.error);
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>Edit bug</DropdownMenuItem>
          <DropdownMenuItem
            onSelect={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Bug</DialogTitle>
            <DialogDescription>Update bug fields.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="ettitle">Title</Label>
              <Input id="ettitle" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="etdesc">Description</Label>
              <Textarea
                id="etdesc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Severity</Label>
                <Select value={severity} onValueChange={(v) => setSeverity(v as BugSeverity)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                    <SelectItem value="MAJOR">Major</SelectItem>
                    <SelectItem value="MINOR">Minor</SelectItem>
                    <SelectItem value="TRIVIAL">Trivial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as BugPriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as BugStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="INVESTIGATING">Investigating</SelectItem>
                    <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                    <SelectItem value="TESTING">Testing</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="etplat">Platform</Label>
                <Input
                  id="etplat"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="etver">Version</Label>
                <Input
                  id="etver"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                />
              </div>
              <div>
                <Label>Product</Label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Release</Label>
                <Select value={releaseId} onValueChange={setReleaseId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {releases.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="etsteps">Steps to reproduce</Label>
              <Textarea
                id="etsteps"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                rows={3}
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={save} disabled={pending || !title.trim()}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {pendingDelete ? (
        <span className="ml-2 text-xs text-muted-foreground">Deleting…</span>
      ) : null}
    </>
  );
}
