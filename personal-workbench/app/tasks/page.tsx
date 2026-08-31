import type { Metadata } from "next";

import { TaskBoard } from "@/components/tasks/task-board";
import { NewTaskButton } from "@/components/tasks/task-form";
import { TaskList } from "@/components/tasks/task-list";
import { TaskViewTabs } from "@/components/tasks/task-view-tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/current-user";
import { listTags } from "@/lib/queries/tags";
import { parseTaskView, TASK_VIEW_LABEL } from "@/lib/queries/task-filters";
import { getTaskBoard, listTasks } from "@/lib/queries/tasks";
import { todayInTimeZone } from "@/lib/utils/date";

// 读当前用户的实时数据，必须按需渲染：否则 next build 会在构建时连数据库，
// 构建环境（比如 Vercel）通常没有数据库，部署会直接失败。
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Tasks · Personal Workbench" };

const EMPTY_MESSAGE: Record<string, string> = {
  list: "还没有任务。新建一个，或者用 Quick Capture 随手记。",
  inbox: "Inbox 是空的。随手记下的东西会先落在这里。",
  today: "今天没有要做的任务。",
  upcoming: "未来 7 天没有排期的任务。",
  completed: "还没有完成任何任务。",
};

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; tag?: string }>;
}) {
  const { view: viewParam, tag } = await searchParams;
  const view = parseTaskView(viewParam);

  const user = await getCurrentUser();
  const today = todayInTimeZone(user.timezone);
  const tags = await listTags(user.id);
  const tagSuggestions = tags.map((item) => item.name);

  const board = view === "board" ? await getTaskBoard(user.id, tag) : null;
  const list = view === "board" ? null : await listTasks(user.id, { view, tag, today });

  const total = board
    ? Object.values(board).reduce((sum, column) => sum + column.length, 0)
    : (list?.total ?? 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TaskViewTabs current={view} tag={tag} />
        <NewTaskButton tagSuggestions={tagSuggestions} />
      </div>

      <p className="text-muted text-xs">
        {view === "board"
          ? total > 0
            ? `看板上 ${total} 个任务（Done 只显示最近 7 天）`
            : "看板是空的"
          : `${TASK_VIEW_LABEL[view]}：${total} 个任务`}
      </p>

      {board ? (
        <TaskBoard board={board} today={today} tagSuggestions={tagSuggestions} />
      ) : list && list.tasks.length > 0 ? (
        <TaskList tasks={list.tasks} today={today} tagSuggestions={tagSuggestions} />
      ) : (
        <EmptyState message={EMPTY_MESSAGE[view] ?? "没有任务。"} />
      )}
    </div>
  );
}
