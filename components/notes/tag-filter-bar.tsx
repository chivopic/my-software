import Link from "next/link";

import type { TagWithCount } from "@/lib/queries/tags";
import { cn } from "@/lib/utils/cn";

export function TagFilterBar({ tags, activeSlug }: { tags: TagWithCount[]; activeSlug?: string }) {
  const withNotes = tags.filter((tag) => tag.noteCount > 0);
  if (withNotes.length === 0) return null;

  return (
    <nav aria-label="按标签筛选" className="flex flex-wrap items-center gap-1.5">
      <Link
        href="/notes"
        className={cn(
          "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
          activeSlug
            ? "border-border text-muted hover:text-foreground"
            : "border-accent text-accent",
        )}
      >
        全部
      </Link>
      {withNotes.map((tag) => {
        const active = tag.slug === activeSlug;
        return (
          <Link
            key={tag.id}
            href={`/notes?tag=${encodeURIComponent(tag.slug)}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
              active
                ? "border-accent text-accent"
                : "border-border text-muted hover:text-foreground",
            )}
          >
            {tag.name}
            <span className="ml-1 opacity-60">{tag.noteCount}</span>
          </Link>
        );
      })}
    </nav>
  );
}
