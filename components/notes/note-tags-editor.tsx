"use client";

import { useState, useTransition } from "react";

import { setNoteTagsAction } from "@/app/notes/actions";
import { TagInput } from "@/components/ui/tag-input";
import { useToast } from "@/components/ui/toast";

export function NoteTagsEditor({
  noteId,
  initialTags,
  suggestions,
}: {
  noteId: string;
  initialTags: string[];
  suggestions: string[];
}) {
  const [tags, setTags] = useState(initialTags);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  function save(next: string[]) {
    const previous = tags;
    setTags(next); // 乐观更新，失败回滚

    startTransition(async () => {
      const result = await setNoteTagsAction(noteId, next);
      if (!result.ok) {
        setTags(previous);
        toast({ message: result.error });
      }
    });
  }

  return <TagInput value={tags} onChange={save} suggestions={suggestions} disabled={pending} />;
}
