import { prisma } from "@/lib/db";

export const NOTES_PAGE_SIZE = 50;

const noteListSelect = {
  id: true,
  title: true,
  content: true,
  isFavorite: true,
  updatedAt: true,
  tags: { select: { tag: { select: { id: true, name: true, slug: true, color: true } } } },
} as const;

export type NoteListItem = Awaited<ReturnType<typeof listNotes>>["notes"][number];

export async function listNotes(userId: string, { page = 1 }: { page?: number } = {}) {
  const skip = (page - 1) * NOTES_PAGE_SIZE;
  const where = { userId, deletedAt: null };

  const [notes, total] = await Promise.all([
    prisma.note.findMany({
      where,
      select: noteListSelect,
      orderBy: { updatedAt: "desc" },
      skip,
      take: NOTES_PAGE_SIZE,
    }),
    prisma.note.count({ where }),
  ]);

  return { notes, total, page, pageSize: NOTES_PAGE_SIZE };
}

export async function getNote(userId: string, id: string) {
  return prisma.note.findFirst({
    where: { id, userId, deletedAt: null },
    select: {
      id: true,
      title: true,
      content: true,
      isFavorite: true,
      createdAt: true,
      updatedAt: true,
      tags: { select: { tag: { select: { id: true, name: true, slug: true, color: true } } } },
    },
  });
}
