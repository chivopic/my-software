"use server";

import { revalidatePath } from "next/cache";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getCurrentUserId } from "@/lib/current-user";
import {
  createTask,
  restoreTask,
  setTaskStatus,
  softDeleteTask,
  updateTask,
} from "@/lib/mutations/tasks";
import {
  createTaskSchema,
  taskIdSchema,
  taskStatusSchema,
  updateTaskSchema,
} from "@/lib/validation/task";

function revalidateTaskViews(id?: string) {
  revalidatePath("/tasks");
  revalidatePath("/planner");
  revalidatePath("/");
  if (id) revalidatePath(`/tasks/${id}`);
}

export async function createTaskAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "内容不合法");

  try {
    const userId = await getCurrentUserId();
    const task = await createTask(userId, parsed.data);
    revalidateTaskViews();
    return ok({ id: task.id });
  } catch {
    return fail("创建失败，请重试");
  }
}

export async function updateTaskAction(id: string, input: unknown): Promise<ActionResult> {
  const parsedId = taskIdSchema.safeParse(id);
  if (!parsedId.success) return fail(parsedId.error.issues[0]?.message ?? "参数错误");

  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "内容不合法");

  try {
    const userId = await getCurrentUserId();
    const updated = await updateTask(userId, parsedId.data, parsed.data);
    if (!updated) return fail("任务不存在或已被删除");

    revalidateTaskViews(parsedId.data);
    return ok();
  } catch {
    return fail("保存失败，请重试");
  }
}

export async function setTaskStatusAction(id: string, status: unknown): Promise<ActionResult> {
  const parsedId = taskIdSchema.safeParse(id);
  if (!parsedId.success) return fail(parsedId.error.issues[0]?.message ?? "参数错误");

  const parsedStatus = taskStatusSchema.safeParse(status);
  if (!parsedStatus.success) return fail("状态不合法");

  try {
    const userId = await getCurrentUserId();
    const updated = await setTaskStatus(userId, parsedId.data, parsedStatus.data);
    if (!updated) return fail("任务不存在或已被删除");

    revalidateTaskViews(parsedId.data);
    return ok();
  } catch {
    return fail("操作失败，请重试");
  }
}

export async function deleteTaskAction(id: string): Promise<ActionResult> {
  const parsed = taskIdSchema.safeParse(id);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "参数错误");

  try {
    const userId = await getCurrentUserId();
    const deleted = await softDeleteTask(userId, parsed.data);
    if (!deleted) return fail("任务不存在或已被删除");

    revalidateTaskViews();
    return ok();
  } catch {
    return fail("删除失败，请重试");
  }
}

export async function restoreTaskAction(id: string): Promise<ActionResult> {
  const parsed = taskIdSchema.safeParse(id);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "参数错误");

  try {
    const userId = await getCurrentUserId();
    const restored = await restoreTask(userId, parsed.data);
    if (!restored) return fail("任务不存在");

    revalidateTaskViews();
    return ok();
  } catch {
    return fail("撤销失败，请重试");
  }
}
