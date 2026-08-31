"use client";

import { useState, useTransition } from "react";

import { toggleNoteFavoriteAction } from "@/app/notes/actions";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";

export function FavoriteButton({
  noteId,
  isFavorite: initial,
  className,
}: {
  noteId: string;
  isFavorite: boolean;
  className?: string;
}) {
  const [isFavorite, setIsFavorite] = useState(initial);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  function toggle() {
    const next = !isFavorite;
    setIsFavorite(next); // 乐观更新

    startTransition(async () => {
      const result = await toggleNoteFavoriteAction(noteId, next);
      if (!result.ok) {
        setIsFavorite(!next);
        toast({ message: result.error });
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? "取消收藏" : "收藏"}
      className={cn(
        "cursor-pointer leading-none transition-colors",
        isFavorite ? "text-priority-high" : "text-muted hover:text-foreground",
        className,
      )}
    >
      {isFavorite ? "★" : "☆"}
    </button>
  );
}
