import type { Metadata } from "next";
import Link from "next/link";

import { NewNoteButton } from "@/components/notes/new-note-button";
import { NoteList } from "@/components/notes/note-list";
import { TagFilterBar } from "@/components/notes/tag-filter-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/current-user";
import { listNotes, NOTES_PAGE_SIZE } from "@/lib/queries/notes";
import { listTags } from "@/lib/queries/tags";

export const metadata: Metadata = { title: "Notes · Personal Workbench" };

function parsePage(value: string | undefined): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string }>;
}) {
  const { page: pageParam, tag } = await searchParams;
  const page = parsePage(pageParam);

  const user = await getCurrentUser();
  const [{ notes, total }, tags] = await Promise.all([
    listNotes(user.id, { page, tag }),
    listTags(user.id),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / NOTES_PAGE_SIZE));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted">
          {total > 0 ? `共 ${total} 条笔记` : tag ? "这个标签下还没有笔记" : "还没有笔记"}
        </p>
        <NewNoteButton />
      </div>

      <TagFilterBar tags={tags} activeSlug={tag} />

      {notes.length === 0 ? (
        <EmptyState
          message={
            tag ? "这个标签下还没有笔记。" : "还没有笔记。新建一条，或者用 Quick Capture 随手记。"
          }
          action={tag ? { label: "看全部笔记", href: "/notes" } : undefined}
        />
      ) : (
        <NoteList notes={notes} timeZone={user.timezone} />
      )}

      {totalPages > 1 ? (
        <nav className="text-muted flex items-center justify-between" aria-label="分页">
          {page > 1 ? (
            <Link
              href={`/notes?${new URLSearchParams({ ...(tag ? { tag } : {}), page: String(page - 1) })}`}
              className="hover:text-foreground"
            >
              ← 上一页
            </Link>
          ) : (
            <span />
          )}
          <span className="text-xs">
            第 {page} / {totalPages} 页
          </span>
          {page < totalPages ? (
            <Link
              href={`/notes?${new URLSearchParams({ ...(tag ? { tag } : {}), page: String(page + 1) })}`}
              className="hover:text-foreground"
            >
              下一页 →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
