import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteNoteButton } from "@/components/notes/delete-note-button";
import { FavoriteButton } from "@/components/notes/favorite-button";
import { NoteEditor } from "@/components/notes/note-editor";
import { NoteTagsEditor } from "@/components/notes/note-tags-editor";
import { UNTITLED } from "@/components/notes/note-card";
import { getCurrentUser } from "@/lib/current-user";
import { getNote } from "@/lib/queries/notes";
import { listTags } from "@/lib/queries/tags";
import { formatDateTime } from "@/lib/utils/date";

// 读当前用户的实时数据，必须按需渲染：否则 next build 会在构建时连数据库，
// 构建环境（比如 Vercel）通常没有数据库，部署会直接失败。
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Note · Personal Workbench" };

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const [note, tags] = await Promise.all([getNote(user.id, id), listTags(user.id)]);

  if (!note) notFound();

  return (
    <article className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <Link href="/notes" className="text-muted hover:text-foreground text-xs">
          ← 全部笔记
        </Link>
        <div className="flex items-center gap-3">
          <FavoriteButton noteId={note.id} isFavorite={note.isFavorite} />
          <DeleteNoteButton noteId={note.id} title={note.title.trim() || UNTITLED} redirectToList />
        </div>
      </div>

      <NoteEditor
        noteId={note.id}
        initialTitle={note.title}
        initialContent={note.content}
        timeZone={user.timezone}
      />

      <NoteTagsEditor
        noteId={note.id}
        initialTags={note.tags.map(({ tag }) => tag.name)}
        suggestions={tags.map((tag) => tag.name)}
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted text-xs">
          创建于 {formatDateTime(note.createdAt, user.timezone)} · 更新于{" "}
          {formatDateTime(note.updatedAt, user.timezone)}
        </span>
      </div>
    </article>
  );
}
