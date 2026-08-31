import { DeleteTaskButton } from "@/components/tasks/delete-task-button";
import { EditTaskButton } from "@/components/tasks/task-form";
import { TaskStatusSelect } from "@/components/tasks/task-status-select";
import { Badge } from "@/components/ui/badge";
import type { BoardTask } from "@/lib/queries/tasks";
import { cn } from "@/lib/utils/cn";
import { formatDueDate, isOverdue } from "@/lib/utils/date";
import { PRIORITY_LABEL } from "@/lib/validation/task";

export function TaskList({
  tasks,
  today,
  tagSuggestions,
}: {
  tasks: BoardTask[];
  today: string;
  tagSuggestions: string[];
}) {
  return (
    <ul className="border-border bg-surface rounded-lg border">
      {tasks.map((task) => {
        const overdue = task.status !== "DONE" && isOverdue(task.dueDate, today);
        return (
          <li
            key={task.id}
            className="border-border hover:bg-surface-hover group flex items-center gap-3 border-b px-4 py-2.5 transition-colors last:border-b-0"
          >
            <TaskStatusSelect taskId={task.id} status={task.status} title={task.title} />

            <span
              className={cn(
                "text-foreground min-w-0 flex-1 truncate",
                task.status === "DONE" && "text-muted line-through",
              )}
            >
              {task.title}
            </span>

            {task.tags.map(({ tag }) => (
              <Badge key={tag.id}>{tag.name}</Badge>
            ))}

            <span className="text-muted shrink-0 text-xs">{PRIORITY_LABEL[task.priority]}</span>

            {task.dueDate ? (
              <span className={cn("shrink-0 text-xs", overdue ? "text-danger" : "text-muted")}>
                {formatDueDate(task.dueDate, today)}
              </span>
            ) : null}

            <span className="flex shrink-0 items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <EditTaskButton task={task} tagSuggestions={tagSuggestions} />
              <DeleteTaskButton taskId={task.id} title={task.title} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
