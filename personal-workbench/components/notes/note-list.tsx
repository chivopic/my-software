import { NoteCard } from "@/components/notes/note-card";
import type { NoteListItem } from "@/lib/queries/notes";

export function NoteList({ notes, timeZone }: { notes: NoteListItem[]; timeZone: string }) {
  return (
    <ul className="border-border bg-surface rounded-lg border">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} timeZone={timeZone} />
      ))}
    </ul>
  );
}
