import { TaskCard } from "@/components/tasks/task-card";
import type { TaskBoard as Board } from "@/lib/queries/tasks";
import { cn } from "@/lib/utils/cn";
import { STATUS_LABEL, STATUS_ORDER, type TaskStatusValue } from "@/lib/validation/task";

const COLUMN_DOT: Record<TaskStatusValue, string> = {
  INBOX: "bg-status-inbox",
  TODO: "bg-status-todo",
  DOING: "bg-status-doing",
  DONE: "bg-status-done",
};

export function TaskBoard({
  board,
  today,
  tagSuggestions,
}: {
  board: Board;
  today: string;
  tagSuggestions: string[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {STATUS_ORDER.map((status) => {
        const tasks = board[status];
        return (
          <section key={status} className="flex min-w-0 flex-col gap-2">
            <header className="flex items-center gap-2 px-1">
              <span aria-hidden className={cn("size-2 rounded-full", COLUMN_DOT[status])} />
              <h2 className="text-foreground font-medium">{STATUS_LABEL[status]}</h2>
              <span className="text-muted text-xs">{tasks.length}</span>
            </header>

            {tasks.length === 0 ? (
              <div className="border-border h-20 rounded-md border border-dashed" />
            ) : (
              <ul className="flex flex-col gap-2">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    today={today}
                    tagSuggestions={tagSuggestions}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
