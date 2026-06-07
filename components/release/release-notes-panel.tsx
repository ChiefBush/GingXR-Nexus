"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Loader2 } from "lucide-react";
import {
  addReleaseNote,
  deleteReleaseNote,
  updateReleaseNote,
} from "@/app/releases/actions";

type Note = {
  id: string;
  category: string;
  content: string;
  createdAt: Date;
};

const CATEGORY_OPTIONS = [
  { value: "FEATURE", label: "Feature" },
  { value: "BUGFIX", label: "Bugfix" },
  { value: "IMPROVEMENT", label: "Improvement" },
  { value: "BREAKING", label: "Breaking" },
  { value: "GENERAL", label: "General" },
];

export function ReleaseNotesPanel({
  releaseId,
  notes,
}: {
  releaseId: string;
  notes: Note[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [category, setCategory] = useState("GENERAL");
  const [content, setContent] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!content.trim()) return;
    setError(null);
    start(async () => {
      const res = await addReleaseNote({ releaseId, category, content: content.trim() });
      if (res.success) {
        setAdding(false);
        setContent("");
        setCategory("GENERAL");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  const remove = (id: string) => {
    start(async () => {
      const res = await deleteReleaseNote(id);
      if (!res.success) alert(res.error);
      else router.refresh();
    });
  };

  return (
    <div className="space-y-2">
      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes yet.</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <NoteRow key={n.id} note={n} releaseId={releaseId} onRemove={remove} />
          ))}
        </ul>
      )}
      {adding ? (
        <Card className="space-y-2 border-dashed bg-muted/20 p-3">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="e.g. Added dark mode across the app"
          />
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)} disabled={pending}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={pending || !content.trim()}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add"}
            </Button>
          </div>
        </Card>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-1.5"
          onClick={() => setAdding(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Add note
        </Button>
      )}
    </div>
  );
}

function NoteRow({
  note,
  releaseId,
  onRemove,
}: {
  note: Note;
  releaseId: string;
  onRemove: (id: string) => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [category, setCategory] = useState(note.category);
  const [content, setContent] = useState(note.content);
  const [pending, start] = useTransition();

  const save = () => {
    start(async () => {
      const res = await updateReleaseNote({
        id: note.id,
        category: category as "FEATURE" | "BUGFIX" | "IMPROVEMENT" | "BREAKING" | "GENERAL",
        content: content.trim(),
      });
      if (res.success) {
        setEditing(false);
        router.refresh();
      } else {
        alert(res.error);
      }
    });
  };

  return (
    <li className="rounded-md border border-border bg-muted/30 p-3 text-sm">
      {editing ? (
        <div className="space-y-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input value={content} onChange={(e) => setContent(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={pending}>
              Cancel
            </Button>
            <Button size="sm" onClick={save} disabled={pending || !content.trim()}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {note.category}
            </span>
            <p className="mt-0.5">{note.content}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemove(note.id)}
              aria-label="Delete note"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
