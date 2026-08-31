import Link from "next/link";

import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { RecentNote } from "@/lib/queries/dashboard";
import { excerpt, formatDateTime } from "@/lib/utils/date";

export function RecentNotes({ notes, timeZone }: { notes: RecentNote[]; timeZone: string }) {
  return (
    <Card>
      <CardHeader
        title="Recent Notes"
        action={
          <Link href="/notes" className="text-muted hover:text-foreground text-xs">
            全部 →
          </Link>
        }
      />
      {notes.length === 0 ? (
        <div className="border-border border-t p-4">
          <EmptyState
            message="还没有笔记。"
            action={{ label: "去写一条", href: "/notes" }}
            className="border-0 py-6"
          />
        </div>
      ) : (
        <ul className="border-border divide-border divide-y border-t">
          {notes.map((note) => (
            <li key={note.id}>
              <Link href={`/notes/${note.id}`} className="hover:bg-surface-hover block px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-foreground truncate font-medium">
                    {note.title.trim() || "无标题"}
                  </span>
                  {note.isFavorite ? <span aria-label="已收藏">★</span> : null}
                  <span className="text-muted ml-auto shrink-0 text-xs">
                    {formatDateTime(note.updatedAt, timeZone)}
                  </span>
                </div>
                <p className="text-muted truncate text-xs">{excerpt(note.content, 80)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
