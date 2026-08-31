import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { TaskStatusValue } from "@/lib/validation/task";

const UNFINISHED: TaskStatusValue[] = ["INBOX", "TODO", "DOING"];

const focusSelect = {
  id: true,
  title: true,
  status: true,
  priority: true,
  dueDate: true,
  scheduledFor: true,
  scheduledStart: true,
  scheduledEnd: true,
  tags: { select: { tag: { select: { id: true, name: true } } } },
} as const;

export type FocusTask = Awaited<ReturnType<typeof getTodayFocus>>[number];

function day(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/** 今天该干的事：今天（或更早）到期、或排期在今天，且还没完成。 */
export async function getTodayFocus(userId: string, today: string, limit = 5) {
  const where: Prisma.TaskWhereInput = {
    userId,
    deletedAt: null,
    status: { in: UNFINISHED },
    OR: [{ dueDate: { lte: day(today) } }, { scheduledFor: day(today) }],
  };

  return prisma.task.findMany({
    where,
    select: focusSelect,
    orderBy: [
      { priority: "desc" },
      { dueDate: { sort: "asc", nulls: "last" } },
      { scheduledStart: { sort: "asc", nulls: "last" } },
    ],
    take: limit,
  });
}

/** 今天的时间表：排期在今天且有具体时间的。 */
export async function getTodaySchedule(userId: string, today: string) {
  return prisma.task.findMany({
    where: {
      userId,
      deletedAt: null,
      scheduledFor: day(today),
      scheduledStart: { not: null },
    },
    select: focusSelect,
    orderBy: { scheduledStart: "asc" },
  });
}

export async function getRecentNotes(userId: string, limit = 5) {
  return prisma.note.findMany({
    where: { userId, deletedAt: null },
    select: { id: true, title: true, content: true, updatedAt: true, isFavorite: true },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}

export type RecentNote = Awaited<ReturnType<typeof getRecentNotes>>[number];

/** 顶部统计行。notesRecent 统计的是近 7 天新建的笔记。 */
export async function getDashboardStats(userId: string, today: string) {
  const weekAgo = new Date(day(today).getTime() - 7 * 24 * 60 * 60 * 1000);

  const [tasksDue, planned, notesRecent, inbox] = await Promise.all([
    prisma.task.count({
      where: { userId, deletedAt: null, status: { in: UNFINISHED }, dueDate: { lte: day(today) } },
    }),
    prisma.task.count({ where: { userId, deletedAt: null, scheduledFor: day(today) } }),
    prisma.note.count({ where: { userId, deletedAt: null, createdAt: { gte: weekAgo } } }),
    prisma.task.count({ where: { userId, deletedAt: null, status: "INBOX" } }),
  ]);

  return { tasksDue, planned, notesRecent, inbox };
}
