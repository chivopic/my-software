"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getCurrentUserId } from "@/lib/current-user";
import { createNote, restoreNote, softDeleteNote } from "@/lib/mutations/notes";
import { createNoteSchema, noteIdSchema } from "@/lib/validation/note";

/** 新建一条空笔记并跳到它的详情页。 */
export async function createNoteAction() {
  const userId = await getCurrentUserId();
  const parsed = createNoteSchema.safeParse({ title: "", content: "" });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "创建失败");
  }

  const note = await createNote(userId, parsed.data);
  revalidatePath("/notes");
  // redirect 靠抛出特殊异常实现，必须放在 try/catch 之外
  redirect(`/notes/${note.id}`);
}

export async function deleteNoteAction(id: string): Promise<ActionResult> {
  const parsed = noteIdSchema.safeParse(id);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "参数错误");

  try {
    const userId = await getCurrentUserId();
    const deleted = await softDeleteNote(userId, parsed.data);
    if (!deleted) return fail("笔记不存在或已被删除");

    revalidatePath("/notes");
    return ok();
  } catch {
    return fail("删除失败，请重试");
  }
}

export async function restoreNoteAction(id: string): Promise<ActionResult> {
  const parsed = noteIdSchema.safeParse(id);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "参数错误");

  try {
    const userId = await getCurrentUserId();
    const restored = await restoreNote(userId, parsed.data);
    if (!restored) return fail("笔记不存在");

    revalidatePath("/notes");
    return ok();
  } catch {
    return fail("撤销失败，请重试");
  }
}
