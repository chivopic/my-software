import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { FocusTask } from "@/lib/queries/dashboard";
import { cn } from "@/lib/utils/cn";
import { formatTime } from "@/lib/utils/date";

export function TodaySchedule({ tasks, timeZone }: { tasks: FocusTask[]; timeZone: string }) {
  return (
    <Card>
      <CardHeader title="Today's Schedule" />
      {tasks.length === 0 ? (
        <div className="border-border border-t p-4">
          <EmptyState
            message="今天还没有排期。"
            action={{ label: "去 Planner", href: "/planner" }}
            className="border-0 py-6"
          />
        </div>
      ) : (
        <ul className="border-border divide-border divide-y border-t">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="text-muted w-24 shrink-0 font-mono text-xs">
                {task.scheduledStart ? formatTime(task.scheduledStart, timeZone) : ""}
                {task.scheduledEnd ? `–${formatTime(task.scheduledEnd, timeZone)}` : ""}
              </span>
              <span
                className={cn(
                  "text-foreground min-w-0 flex-1 truncate",
                  task.status === "DONE" && "text-muted line-through",
                )}
              >
                {task.title}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
