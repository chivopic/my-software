"use server";

import { revalidatePath } from "next/cache";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getCurrentUserId } from "@/lib/current-user";
import { createNote } from "@/lib/mutations/notes";
import { createTask } from "@/lib/mutations/tasks";
import { captureSchema, NOTE_TITLE_FROM_BODY } from "@/lib/validation/capture";

// 只回 kind 和 id，跳转路径由调用方拼：typedRoutes 需要字面量模板才能校验。
export type CaptureResult = { kind: "task" | "note"; id: string };

/**
 * Quick Capture：一行输入直接落成任务或笔记。
 * 任务进 Inbox，笔记用首行前 60 字做标题、正文保留全文。
 */
export async function captureAction(input: unknown): Promise<ActionResult<CaptureResult>> {
  const parsed = captureSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "内容不合法");

  const { kind, text } = parsed.data;

  try {
    const userId = await getCurrentUserId();

    if (kind === "task") {
      const task = await createTask(userId, {
        title: text,
        description: "",
        status: "INBOX",
        priority: "MEDIUM",
        dueDate: "",
        tags: [],
      });
      revalidatePath("/tasks");
      revalidatePath("/");
      return ok({ kind, id: task.id });
    }

    const firstLine = text.split("\n")[0] ?? text;
    const note = await createNote(userId, {
      title: firstLine.slice(0, NOTE_TITLE_FROM_BODY),
      content: text,
    });
    revalidatePath("/notes");
    revalidatePath("/");
    return ok({ kind, id: note.id });
  } catch {
    return fail("保存失败，请重试");
  }
}
