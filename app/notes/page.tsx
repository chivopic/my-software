import type { Metadata } from "next";
import Link from "next/link";

import { NewNoteButton } from "@/components/notes/new-note-button";
import { NoteList } from "@/components/notes/note-list";
import { NoteSearch } from "@/components/notes/note-search";
import { TagFilterBar } from "@/components/notes/tag-filter-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/current-user";
import { listNotes, NOTES_PAGE_SIZE } from "@/lib/queries/notes";
import { listTags } from "@/lib/queries/tags";
import { cn } from "@/lib/utils/cn";

// 读当前用户的实时数据，必须按需渲染：否则 next build 会在构建时连数据库，
// 构建环境（比如 Vercel）通常没有数据库，部署会直接失败。
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Notes · Personal Workbench" };

function parsePage(value: string | undefined): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string; q?: string; filter?: string }>;
}) {
  const { page: pageParam, tag, q, filter } = await searchParams;
  const page = parsePage(pageParam);
  const favorite = filter === "favorite";

  const user = await getCurrentUser();
  const [{ notes, total }, tags] = await Promise.all([
    listNotes(user.id, { page, tag, q, favorite }),
    listTags(user.id),
  ]);

  const baseParams = {
    ...(tag ? { tag } : {}),
    ...(q ? { q } : {}),
    ...(favorite ? { filter: "favorite" } : {}),
  };
  const totalPages = Math.max(1, Math.ceil(total / NOTES_PAGE_SIZE));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <NoteSearch />
        <div className="flex items-center gap-3">
          <Link
            href={favorite ? "/notes" : "/notes?filter=favorite"}
            aria-pressed={favorite}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs transition-colors",
              favorite
                ? "border-accent text-accent"
                : "border-border text-muted hover:text-foreground",
            )}
          >
            ★ 收藏
          </Link>
          <NewNoteButton />
        </div>
      </div>

      <p className="text-muted text-xs">
        {total > 0
          ? `共 ${total} 条笔记`
          : q
            ? `没有匹配「${q}」的笔记`
            : favorite
              ? "还没有收藏的笔记"
              : tag
                ? "这个标签下还没有笔记"
                : "还没有笔记"}
      </p>

      <TagFilterBar tags={tags} activeSlug={tag} />

      {notes.length === 0 ? (
        <EmptyState
          message={
            q
              ? `没有匹配「${q}」的笔记。`
              : favorite
                ? "还没有收藏的笔记。列表里点 ☆ 就能收藏。"
                : tag
                  ? "这个标签下还没有笔记。"
                  : "还没有笔记。新建一条，或者用 Quick Capture 随手记。"
          }
          action={q || favorite || tag ? { label: "看全部笔记", href: "/notes" } : undefined}
        />
      ) : (
        <NoteList notes={notes} timeZone={user.timezone} />
      )}

      {totalPages > 1 ? (
        <nav className="text-muted flex items-center justify-between" aria-label="分页">
          {page > 1 ? (
            <Link
              href={`/notes?${new URLSearchParams({ ...baseParams, page: String(page - 1) })}`}
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
              href={`/notes?${new URLSearchParams({ ...baseParams, page: String(page + 1) })}`}
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
