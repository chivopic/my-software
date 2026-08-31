import { CompleteTaskCheckbox } from "@/components/dashboard/complete-task-checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { FocusTask } from "@/lib/queries/dashboard";
import { cn } from "@/lib/utils/cn";
import { formatDueDate, isOverdue } from "@/lib/utils/date";
import { PRIORITY_LABEL } from "@/lib/validation/task";

export function TodayFocus({ tasks, today }: { tasks: FocusTask[]; today: string }) {
  return (
    <Card>
      <CardHeader title="Today's Focus" />
      {tasks.length === 0 ? (
        <div className="border-border border-t p-4">
          <EmptyState
            message="今天没有安排。要不要先看看 Inbox？"
            action={{ label: "打开 Inbox", href: "/tasks?view=inbox" }}
            className="border-0 py-6"
          />
        </div>
      ) : (
        <ul className="border-border divide-border divide-y border-t">
          {tasks.map((task) => {
            const overdue = isOverdue(task.dueDate, today);
            return (
              <li key={task.id} className="flex items-center gap-3 px-4 py-2.5">
                <CompleteTaskCheckbox taskId={task.id} title={task.title} />
                <span className="text-foreground min-w-0 flex-1 truncate">{task.title}</span>
                {task.tags.map(({ tag }) => (
                  <Badge key={tag.id}>{tag.name}</Badge>
                ))}
                <span className="text-muted shrink-0 text-xs">{PRIORITY_LABEL[task.priority]}</span>
                {task.dueDate ? (
                  <span className={cn("shrink-0 text-xs", overdue ? "text-danger" : "text-muted")}>
                    {overdue ? "已逾期 " : ""}
                    {formatDueDate(task.dueDate, today)}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
