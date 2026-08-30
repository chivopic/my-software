import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/mutations/activity";
import type { CreateNoteInput, UpdateNoteInput } from "@/lib/validation/note";

export async function createNote(userId: string, input: CreateNoteInput) {
  const note = await prisma.note.create({
    data: { userId, title: input.title, content: input.content },
    select: { id: true },
  });

  await logActivity({
    userId,
    entityType: "NOTE",
    entityId: note.id,
    action: "CREATED",
    summary: input.title || null,
  });

  return note;
}

export async function updateNote(userId: string, id: string, input: UpdateNoteInput) {
  const result = await prisma.note.updateMany({
    where: { id, userId, deletedAt: null },
    data: { title: input.title, content: input.content },
  });
  if (result.count === 0) return false;

  await logActivity({
    userId,
    entityType: "NOTE",
    entityId: id,
    action: "UPDATED",
    summary: input.title || null,
    metadata: { contentLength: input.content.length },
  });
  return true;
}

export async function setNoteFavorite(userId: string, id: string, isFavorite: boolean) {
  const result = await prisma.note.updateMany({
    where: { id, userId, deletedAt: null },
    data: { isFavorite },
  });
  if (result.count === 0) return false;

  await logActivity({
    userId,
    entityType: "NOTE",
    entityId: id,
    action: "UPDATED",
    metadata: { isFavorite },
  });
  return true;
}

/** 软删除：只打 deletedAt，列表默认过滤掉，撤销时清空即可。 */
export async function softDeleteNote(userId: string, id: string) {
  const note = await prisma.note.findFirst({
    where: { id, userId, deletedAt: null },
    select: { title: true },
  });
  if (!note) return false;

  await prisma.note.update({ where: { id }, data: { deletedAt: new Date() } });
  await logActivity({
    userId,
    entityType: "NOTE",
    entityId: id,
    action: "DELETED",
    summary: note.title || null,
  });
  return true;
}

export async function restoreNote(userId: string, id: string) {
  const result = await prisma.note.updateMany({
    where: { id, userId, deletedAt: { not: null } },
    data: { deletedAt: null },
  });
  if (result.count === 0) return false;

  await logActivity({ userId, entityType: "NOTE", entityId: id, action: "RESTORED" });
  return true;
}
