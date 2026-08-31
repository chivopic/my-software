import { prisma } from "@/lib/db";

export type TagWithCount = Awaited<ReturnType<typeof listTags>>[number];

/** 全部标签，带笔记数和任务数，按笔记数倒序。 */
export async function listTags(userId: string) {
  const tags = await prisma.tag.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      slug: true,
      color: true,
      _count: { select: { notes: true, tasks: true } },
    },
    orderBy: { name: "asc" },
  });

  return tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    color: tag.color,
    noteCount: tag._count.notes,
    taskCount: tag._count.tasks,
  }));
}
