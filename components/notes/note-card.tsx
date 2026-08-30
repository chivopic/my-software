import Link from "next/link";

import { DeleteNoteButton } from "@/components/notes/delete-note-button";
import { FavoriteButton } from "@/components/notes/favorite-button";
import { Badge } from "@/components/ui/badge";
import type { NoteListItem } from "@/lib/queries/notes";
import { excerpt, formatDateTime } from "@/lib/utils/date";

export const UNTITLED = "无标题";

export function NoteCard({ note, timeZone }: { note: NoteListItem; timeZone: string }) {
  const title = note.title.trim() || UNTITLED;
  const summary = excerpt(note.content);

  return (
    <li className="border-border hover:bg-surface-hover group border-b transition-colors last:border-b-0">
      <div className="flex items-start gap-3 px-4 py-3">
        <FavoriteButton noteId={note.id} isFavorite={note.isFavorite} className="mt-0.5" />
        <Link href={`/notes/${note.id}`} className="min-w-0 flex-1">
          <h3 className="text-foreground truncate font-medium">{title}</h3>
          {summary ? <p className="text-muted mt-0.5 line-clamp-2">{summary}</p> : null}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {note.tags.map(({ tag }) => (
              <Badge key={tag.id}>{tag.name}</Badge>
            ))}
            <span className="text-muted text-xs">{formatDateTime(note.updatedAt, timeZone)}</span>
          </div>
        </Link>

        <div className="opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <DeleteNoteButton noteId={note.id} title={title} />
        </div>
      </div>
    </li>
  );
}
