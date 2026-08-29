import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteNoteButton } from "@/components/notes/delete-note-button";
import { UNTITLED } from "@/components/notes/note-card";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/current-user";
import { getNote } from "@/lib/queries/notes";
import { formatDateTime } from "@/lib/utils/date";

export const metadata: Metadata = { title: "Note · Personal Workbench" };

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const note = await getNote(user.id, id);

  if (!note) notFound();

  const title = note.title.trim() || UNTITLED;

  return (
    <article className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link href="/notes" className="text-muted hover:text-foreground text-xs">
            ← 全部笔记
          </Link>
          <h2 className="text-foreground mt-1 text-xl font-semibold">{title}</h2>
        </div>
        <DeleteNoteButton noteId={note.id} title={title} redirectToList />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {note.tags.map(({ tag }) => (
          <Badge key={tag.id}>{tag.name}</Badge>
        ))}
        <span className="text-muted text-xs">
          创建于 {formatDateTime(note.createdAt, user.timezone)} · 更新于{" "}
          {formatDateTime(note.updatedAt, user.timezone)}
        </span>
      </div>

      {note.content.trim() ? (
        <pre className="border-border bg-surface text-foreground overflow-x-auto rounded-lg border p-4 font-sans whitespace-pre-wrap">
          {note.content}
        </pre>
      ) : (
        <p className="text-muted border-border rounded-lg border border-dashed px-4 py-8 text-center">
          还没有内容。Markdown 编辑器在 V0-05 落地。
        </p>
      )}
    </article>
  );
}
