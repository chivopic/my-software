import { DeleteTaskButton } from "@/components/tasks/delete-task-button";
import { TaskStatusSelect } from "@/components/tasks/task-status-select";
import { EditTaskButton } from "@/components/tasks/task-form";
import { Badge } from "@/components/ui/badge";
import type { BoardTask } from "@/lib/queries/tasks";
import { formatDueDate, isOverdue } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { PRIORITY_LABEL, type TaskPriorityValue } from "@/lib/validation/task";

const PRIORITY_BAR: Record<TaskPriorityValue, string> = {
  LOW: "bg-priority-low",
  MEDIUM: "bg-priority-medium",
  HIGH: "bg-priority-high",
  URGENT: "bg-priority-urgent",
};

export function TaskCard({
  task,
  today,
  tagSuggestions,
}: {
  task: BoardTask;
  today: string;
  tagSuggestions: string[];
}) {
  const overdue = task.status !== "DONE" && isOverdue(task.dueDate, today);

  return (
    <li className="border-border bg-surface group relative flex flex-col gap-2 rounded-md border p-3">
      <span
        aria-hidden
        className={cn("absolute inset-y-0 left-0 w-0.5 rounded-l-md", PRIORITY_BAR[task.priority])}
      />

      <div className="flex items-start justify-between gap-2">
        <h3
          className={cn(
            "text-foreground min-w-0 font-medium",
            task.status === "DONE" && "text-muted line-through",
          )}
        >
          {task.title}
        </h3>
        <span
          className="text-muted shrink-0 text-xs"
          title={`优先级：${PRIORITY_LABEL[task.priority]}`}
        >
          {PRIORITY_LABEL[task.priority]}
        </span>
      </div>

      {task.description ? (
        <p className="text-muted line-clamp-2 text-xs">{task.description}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-1.5">
        {task.tags.map(({ tag }) => (
          <Badge key={tag.id}>{tag.name}</Badge>
        ))}
        {task.dueDate ? (
          <span className={cn("text-xs", overdue ? "text-danger" : "text-muted")}>
            {overdue ? "已逾期 " : "截止 "}
            {formatDueDate(task.dueDate, today)}
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <TaskStatusSelect taskId={task.id} status={task.status} title={task.title} />
        <div className="ml-auto flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <EditTaskButton task={task} tagSuggestions={tagSuggestions} />
          <DeleteTaskButton taskId={task.id} title={task.title} />
        </div>
      </div>
    </li>
  );
}
