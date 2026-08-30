import Link from "next/link";

import { TASK_VIEWS, TASK_VIEW_LABEL, type TaskView } from "@/lib/queries/task-filters";
import { cn } from "@/lib/utils/cn";

export function TaskViewTabs({ current, tag }: { current: TaskView; tag?: string }) {
  return (
    <nav aria-label="任务视图" className="flex flex-wrap items-center gap-1">
      {TASK_VIEWS.map((view) => {
        const params = new URLSearchParams({ view, ...(tag ? { tag } : {}) });
        const active = view === current;
        return (
          <Link
            key={view}
            href={`/tasks?${params}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs transition-colors",
              active
                ? "bg-surface-hover text-foreground font-medium"
                : "text-muted hover:text-foreground",
            )}
          >
            {TASK_VIEW_LABEL[view]}
          </Link>
        );
      })}
    </nav>
  );
}
