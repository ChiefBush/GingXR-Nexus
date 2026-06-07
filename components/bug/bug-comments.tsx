"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Trash2, Edit2, Check, X } from "lucide-react";
import {
  addBugComment,
  deleteBugComment,
  updateBugComment,
} from "@/app/bugs/actions";

type Author = { id: string; name: string | null; email: string; image: string | null };
type Comment = {
  id: string;
  content: string;
  createdAt: Date;
  author: Author;
};

export function BugComments({
  bugId,
  comments,
  currentUserId,
}: {
  bugId: string;
  comments: Comment[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!content.trim()) return;
    setError(null);
    start(async () => {
      const res = await addBugComment({
        entityType: "bug",
        entityId: bugId,
        content: content.trim(),
      });
      if (res.success) {
        setContent("");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="space-y-3">
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet. Be the first to chime in.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <CommentRow
              key={c.id}
              comment={c}
              isMine={c.author.id === currentUserId}
              onChanged={() => router.refresh()}
            />
          ))}
        </ul>
      )}

      <div className="space-y-2 border-t border-border pt-3">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          placeholder="Add a comment…"
        />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <div className="flex justify-end">
          <Button size="sm" onClick={submit} disabled={pending || !content.trim()}>
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Comment"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CommentRow({
  comment,
  isMine,
  onChanged,
}: {
  comment: Comment;
  isMine: boolean;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(comment.content);
  const [pending, start] = useTransition();

  const save = () => {
    start(async () => {
      const res = await updateBugComment({ id: comment.id, content: content.trim() });
      if (res.success) {
        setEditing(false);
        onChanged();
      } else {
        alert(res.error);
      }
    });
  };

  const remove = () => {
    if (!confirm("Delete this comment?")) return;
    start(async () => {
      const res = await deleteBugComment(comment.id);
      if (res.success) onChanged();
      else alert(res.error);
    });
  };

  const initials = (comment.author.name ?? comment.author.email).slice(0, 1).toUpperCase();

  return (
    <li className="flex gap-3">
      <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-primary-foreground">
        {initials}
      </div>
      <div className="min-w-0 flex-1 rounded-md border border-border bg-muted/30 p-3">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-medium text-foreground">
            {comment.author.name ?? comment.author.email}
          </span>
          <span className="text-muted-foreground">
            {new Date(comment.createdAt).toLocaleString()}
          </span>
        </div>
        {editing ? (
          <div className="mt-2 space-y-2">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={pending}>
                <X className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" onClick={save} disabled={pending || !content.trim()}>
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-1 whitespace-pre-wrap text-sm">{comment.content}</p>
            {isMine ? (
              <div className="mt-1 flex justify-end gap-1">
                <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={remove} aria-label="Delete comment">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </li>
  );
}
