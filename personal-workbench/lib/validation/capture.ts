import { z } from "zod";

/** 存成笔记时，用正文首行的前这么多字做标题。 */
export const NOTE_TITLE_FROM_BODY = 60;

export const MAX_CAPTURE_LENGTH = 5000;

export const captureSchema = z.object({
  kind: z.enum(["task", "note"]),
  text: z
    .string()
    .trim()
    .min(1, "写点什么再保存")
    .max(MAX_CAPTURE_LENGTH, `一次最多 ${MAX_CAPTURE_LENGTH} 个字符`),
});

export type CaptureInput = z.infer<typeof captureSchema>;
