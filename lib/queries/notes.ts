import { prisma } from "@/lib/db";
import { type Prisma } from "@/lib/generated/prisma/client";

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

export type NoteListFilters = {
  page?: number;
  tag?: string;
  q?: string;
  favorite?: boolean;
};

export function buildNoteWhere(
  userId: string,
  { tag, q, favorite }: Omit<NoteListFilters, "page"> = {},
): Prisma.NoteWhereInput {
  const keyword = q?.trim();

  return {
    userId,
    deletedAt: null,
    ...(tag ? { tags: { some: { tag: { slug: tag } } } } : {}),
    ...(favorite ? { isFavorite: true } : {}),
    // V0 用 ILIKE 做包含匹配，语义搜索是 V5
    ...(keyword
      ? {
          OR: [
            { title: { contains: keyword, mode: "insensitive" as const } },
            { content: { contains: keyword, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
}

export async function listNotes(userId: string, { page = 1, ...filters }: NoteListFilters = {}) {
  const skip = (page - 1) * NOTES_PAGE_SIZE;
  const where = buildNoteWhere(userId, filters);

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
