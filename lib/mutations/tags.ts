import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils/slug";

/** 按 slug 找不到就建，返回 tag id。标签在用户内唯一。 */
export async function ensureTags(userId: string, names: string[]): Promise<string[]> {
  const ids: string[] = [];

  for (const name of names) {
    const slug = slugify(name);
    if (!slug) continue;

    const tag = await prisma.tag.upsert({
      where: { userId_slug: { userId, slug } },
      update: {},
      create: { userId, name: name.trim(), slug },
      select: { id: true },
    });
    ids.push(tag.id);
  }

  return ids;
}

/** 整组替换某条笔记的标签。 */
export async function setNoteTags(userId: string, noteId: string, names: string[]) {
  const note = await prisma.note.findFirst({
    where: { id: noteId, userId, deletedAt: null },
    select: { id: true },
  });
  if (!note) return false;

  const tagIds = await ensureTags(userId, names);

  await prisma.$transaction([
    prisma.noteTag.deleteMany({ where: { noteId, tagId: { notIn: tagIds } } }),
    prisma.noteTag.createMany({
      data: tagIds.map((tagId) => ({ noteId, tagId })),
      skipDuplicates: true,
    }),
  ]);

  return true;
}
