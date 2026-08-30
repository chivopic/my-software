import { prisma } from "@/lib/db";
import { type CreateNoteInput, type UpdateNoteInput } from "@/lib/validation/note";

export async function createNote(userId: string, input: CreateNoteInput) {
  return prisma.note.create({
    data: { userId, title: input.title, content: input.content },
    select: { id: true },
  });
}

export async function updateNote(userId: string, id: string, input: UpdateNoteInput) {
  const result = await prisma.note.updateMany({
    where: { id, userId, deletedAt: null },
    data: { title: input.title, content: input.content },
  });
  return result.count > 0;
}

/** 软删除：只打 deletedAt，列表默认过滤掉，撤销时清空即可。 */
export async function softDeleteNote(userId: string, id: string) {
  const result = await prisma.note.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return result.count > 0;
}

export async function restoreNote(userId: string, id: string) {
  const result = await prisma.note.updateMany({
    where: { id, userId, deletedAt: { not: null } },
    data: { deletedAt: null },
  });
  return result.count > 0;
}
