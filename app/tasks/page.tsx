import type { Metadata } from "next";

import { TaskBoard } from "@/components/tasks/task-board";
import { NewTaskButton } from "@/components/tasks/task-form";
import { getCurrentUser } from "@/lib/current-user";
import { getTaskBoard } from "@/lib/queries/tasks";
import { listTags } from "@/lib/queries/tags";
import { todayInTimeZone } from "@/lib/utils/date";

export const metadata: Metadata = { title: "Tasks · Personal Workbench" };

export default async function TasksPage() {
  const user = await getCurrentUser();
  const [board, tags] = await Promise.all([getTaskBoard(user.id), listTags(user.id)]);
  const today = todayInTimeZone(user.timezone);
  const tagSuggestions = tags.map((tag) => tag.name);
  const total = Object.values(board).reduce((sum, column) => sum + column.length, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted text-xs">
          {total > 0 ? `看板上 ${total} 个任务（Done 只显示最近 7 天）` : "还没有任务"}
        </p>
        <NewTaskButton tagSuggestions={tagSuggestions} />
      </div>

      <TaskBoard board={board} today={today} tagSuggestions={tagSuggestions} />
    </div>
  );
}
