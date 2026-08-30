import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteNoteButton } from "@/components/notes/delete-note-button";
import { NoteEditor } from "@/components/notes/note-editor";
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

  return (
    <article className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <Link href="/notes" className="text-muted hover:text-foreground text-xs">
          ← 全部笔记
        </Link>
        <DeleteNoteButton noteId={note.id} title={note.title.trim() || UNTITLED} redirectToList />
      </div>

      <NoteEditor
        noteId={note.id}
        initialTitle={note.title}
        initialContent={note.content}
        timeZone={user.timezone}
      />

      <div className="flex flex-wrap items-center gap-2">
        {note.tags.map(({ tag }) => (
          <Badge key={tag.id}>{tag.name}</Badge>
        ))}
        <span className="text-muted text-xs">
          创建于 {formatDateTime(note.createdAt, user.timezone)} · 更新于{" "}
          {formatDateTime(note.updatedAt, user.timezone)}
        </span>
      </div>
    </article>
  );
}
