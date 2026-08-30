import type { Prisma } from "@/lib/generated/prisma/client";
import { addDays } from "@/lib/utils/date";
import type { TaskStatusValue } from "@/lib/validation/task";

/** 列表视图。board 是看板，其余都是单列列表。 */
export const TASK_VIEWS = ["board", "list", "inbox", "today", "upcoming", "completed"] as const;
export type TaskView = (typeof TASK_VIEWS)[number];

export const TASK_VIEW_LABEL: Record<TaskView, string> = {
  board: "看板",
  list: "全部",
  inbox: "Inbox",
  today: "今天",
  upcoming: "近 7 天",
  completed: "已完成",
};

export const UPCOMING_DAYS = 7;

export function parseTaskView(value: string | undefined): TaskView {
  return TASK_VIEWS.includes(value as TaskView) ? (value as TaskView) : "board";
}

/** @db.Date 字段的比较值：UTC 零点的 Date。 */
function day(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

const UNFINISHED: TaskStatusValue[] = ["INBOX", "TODO", "DOING"];

/**
 * 各视图的 where 条件。today 传用户时区下的今天（YYYY-MM-DD），
 * 这样「今天到期」不会因为服务器时区而偏一天。
 */
export function buildTaskWhere(
  userId: string,
  { view, tag, today }: { view: TaskView; tag?: string; today: string },
): Prisma.TaskWhereInput {
  const base: Prisma.TaskWhereInput = {
    userId,
    deletedAt: null,
    ...(tag ? { tags: { some: { tag: { slug: tag } } } } : {}),
  };

  switch (view) {
    case "inbox":
      return { ...base, status: "INBOX" };

    case "today":
      // 到期日在今天或更早、且还没完成的（逾期的也要出现在今天）
      return { ...base, status: { in: UNFINISHED }, dueDate: { lte: day(today) } };

    case "upcoming":
      return {
        ...base,
        status: { in: UNFINISHED },
        dueDate: { gt: day(today), lte: day(addDays(today, UPCOMING_DAYS)) },
      };

    case "completed":
      return { ...base, status: "DONE" };

    default:
      return base;
  }
}

/** 列表排序：先看优先级和截止日期，完成的按完成时间倒序。 */
export function taskOrderBy(view: TaskView): Prisma.TaskOrderByWithRelationInput[] {
  if (view === "completed") return [{ completedAt: "desc" }];
  return [{ dueDate: { sort: "asc", nulls: "last" } }, { order: "asc" }, { createdAt: "desc" }];
}
