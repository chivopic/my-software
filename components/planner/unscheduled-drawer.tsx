import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { PlannerTask } from "@/lib/queries/planner";
import { cn } from "@/lib/utils/cn";
import { formatDueDate, isOverdue } from "@/lib/utils/date";

export function UnscheduledDrawer({ tasks, today }: { tasks: PlannerTask[]; today: string }) {
  return (
    <aside className="flex flex-col gap-2">
      <h2 className="text-foreground px-1 font-medium">
        未排期 <span className="text-muted text-xs">{tasks.length}</span>
      </h2>

      {tasks.length === 0 ? (
        <EmptyState
          message="没有待排期的任务。"
          action={{ label: "去 Tasks 看看", href: "/tasks" }}
        />
      ) : (
        <ul className="border-border bg-surface divide-border divide-y rounded-lg border">
          {tasks.map((task) => (
            <li key={task.id} className="flex flex-col gap-1 px-3 py-2">
              <span className="text-foreground truncate">{task.title}</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {task.tags.map(({ tag }) => (
                  <Badge key={tag.id}>{tag.name}</Badge>
                ))}
                {task.dueDate ? (
                  <span
                    className={cn(
                      "text-xs",
                      isOverdue(task.dueDate, today) ? "text-danger" : "text-muted",
                    )}
                  >
                    截止 {formatDueDate(task.dueDate, today)}
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
