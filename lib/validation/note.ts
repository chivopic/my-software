import { z } from "zod";

export const MAX_TITLE_LENGTH = 200;

export const noteIdSchema = z.string().min(1, "缺少笔记 id");

export const createNoteSchema = z.object({
  title: z.string().trim().max(MAX_TITLE_LENGTH, `标题不能超过 ${MAX_TITLE_LENGTH} 个字符`),
  content: z.string().default(""),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
