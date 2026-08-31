import { prisma } from "@/lib/db";

/**
 * /settings 的数据概览。软删除的单独计数，方便判断「回收站」里还有多少东西。
 */
export async function getDataStats(userId: string) {
  const [
    notes,
    notesDeleted,
    tasks,
    tasksDeleted,
    tags,
    projects,
    scheduled,
    completed,
    activities,
    firstActivity,
  ] = await Promise.all([
    prisma.note.count({ where: { userId, deletedAt: null } }),
    prisma.note.count({ where: { userId, deletedAt: { not: null } } }),
    prisma.task.count({ where: { userId, deletedAt: null } }),
    prisma.task.count({ where: { userId, deletedAt: { not: null } } }),
    prisma.tag.count({ where: { userId } }),
    prisma.project.count({ where: { userId, deletedAt: null } }),
    prisma.task.count({ where: { userId, deletedAt: null, scheduledFor: { not: null } } }),
    prisma.task.count({ where: { userId, deletedAt: null, status: "DONE" } }),
    prisma.activityLog.count({ where: { userId } }),
    prisma.activityLog.findFirst({
      where: { userId },
      orderBy: { at: "asc" },
      select: { at: true },
    }),
  ]);

  return {
    notes,
    notesDeleted,
    tasks,
    tasksDeleted,
    tags,
    projects,
    scheduled,
    completed,
    activities,
    trackingSince: firstActivity?.at ?? null,
  };
}

/**
 * 全量导出。这是 V0 唯一的备份手段（见 PRD 第 5 节），所以包含软删除的数据，
 * 导出的内容要足以重建整个库。
 */
export async function exportAll(userId: string) {
  const [user, tags, projects, notes, tasks, activities] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, timezone: true, createdAt: true },
    }),
    prisma.tag.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    prisma.project.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.note.findMany({
      where: { userId },
      include: { tags: { select: { tag: { select: { slug: true } } } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.task.findMany({
      where: { userId },
      include: { tags: { select: { tag: { select: { slug: true } } } } },
      orderBy: { createdAt: "asc" },
    }),
    // 行为日志也要导出：备份丢了历史，V2 的统计就没有原始数据了
    prisma.activityLog.findMany({ where: { userId }, orderBy: { at: "asc" } }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    user,
    tags,
    projects,
    notes: notes.map(({ tags: noteTags, ...note }) => ({
      ...note,
      tags: noteTags.map(({ tag }) => tag.slug),
    })),
    tasks: tasks.map(({ tags: taskTags, ...task }) => ({
      ...task,
      tags: taskTags.map(({ tag }) => tag.slug),
    })),
    activities,
  };
}
