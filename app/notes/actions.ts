"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getCurrentUserId } from "@/lib/current-user";
import {
  createNote,
  restoreNote,
  setNoteFavorite,
  softDeleteNote,
  updateNote,
} from "@/lib/mutations/notes";
import { setNoteTags } from "@/lib/mutations/tags";
import { createNoteSchema, noteIdSchema, updateNoteSchema } from "@/lib/validation/note";
import { tagNamesSchema } from "@/lib/validation/tag";

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

export async function updateNoteAction(
  id: string,
  input: { title: string; content: string },
): Promise<ActionResult<{ savedAt: string }>> {
  const parsedId = noteIdSchema.safeParse(id);
  if (!parsedId.success) return fail(parsedId.error.issues[0]?.message ?? "参数错误");

  const parsed = updateNoteSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "内容不合法");

  try {
    const userId = await getCurrentUserId();
    const updated = await updateNote(userId, parsedId.data, parsed.data);
    if (!updated) return fail("笔记不存在或已被删除");

    revalidatePath("/notes");
    return ok({ savedAt: new Date().toISOString() });
  } catch {
    return fail("保存失败，请重试");
  }
}

export async function setNoteTagsAction(id: string, names: string[]): Promise<ActionResult> {
  const parsedId = noteIdSchema.safeParse(id);
  if (!parsedId.success) return fail(parsedId.error.issues[0]?.message ?? "参数错误");

  const parsed = tagNamesSchema.safeParse(names);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "标签不合法");

  try {
    const userId = await getCurrentUserId();
    const updated = await setNoteTags(userId, parsedId.data, parsed.data);
    if (!updated) return fail("笔记不存在或已被删除");

    revalidatePath("/notes");
    revalidatePath(`/notes/${parsedId.data}`);
    return ok();
  } catch {
    return fail("保存标签失败，请重试");
  }
}

export async function toggleNoteFavoriteAction(
  id: string,
  isFavorite: boolean,
): Promise<ActionResult> {
  const parsed = noteIdSchema.safeParse(id);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "参数错误");

  try {
    const userId = await getCurrentUserId();
    const updated = await setNoteFavorite(userId, parsed.data, isFavorite);
    if (!updated) return fail("笔记不存在或已被删除");

    revalidatePath("/notes");
    revalidatePath(`/notes/${parsed.data}`);
    return ok();
  } catch {
    return fail("操作失败，请重试");
  }
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
