import { prisma } from "@/lib/db";

const plannerSelect = {
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

export type PlannerTask = Awaited<ReturnType<typeof getPlannerDay>>[number];

/** 某天已排期的任务，按开始时间升序。day 是 YYYY-MM-DD（@db.Date）。 */
export async function getPlannerDay(userId: string, day: string) {
  return prisma.task.findMany({
    where: {
      userId,
      deletedAt: null,
      scheduledFor: new Date(`${day}T00:00:00.000Z`),
    },
    select: plannerSelect,
    orderBy: [{ scheduledStart: "asc" }],
  });
}

/** 待排期抽屉：还没排期的进行中任务。 */
export async function getUnscheduledTasks(userId: string) {
  return prisma.task.findMany({
    where: {
      userId,
      deletedAt: null,
      status: { in: ["TODO", "DOING"] },
      scheduledFor: null,
    },
    select: plannerSelect,
    orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { order: "asc" }],
  });
}
