"use server";

import { revalidatePath } from "next/cache";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/current-user";
import { scheduleTask, unscheduleTask } from "@/lib/mutations/tasks";
import { scheduleSchema } from "@/lib/validation/planner";
import { taskIdSchema } from "@/lib/validation/task";

export async function scheduleTaskAction(input: unknown): Promise<ActionResult> {
  const parsed = scheduleSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "参数错误");

  try {
    const user = await getCurrentUser();
    const scheduled = await scheduleTask(user.id, parsed.data.taskId, {
      day: parsed.data.day,
      hour: parsed.data.hour,
      timeZone: user.timezone,
    });
    if (!scheduled) return fail("任务不存在或已被删除");

    revalidatePath("/planner");
    revalidatePath("/tasks");
    revalidatePath("/");
    return ok();
  } catch {
    return fail("排期失败，请重试");
  }
}

export async function unscheduleTaskAction(taskId: string): Promise<ActionResult> {
  const parsed = taskIdSchema.safeParse(taskId);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "参数错误");

  try {
    const user = await getCurrentUser();
    const done = await unscheduleTask(user.id, parsed.data);
    if (!done) return fail("任务不存在或已被删除");

    revalidatePath("/planner");
    revalidatePath("/tasks");
    revalidatePath("/");
    return ok();
  } catch {
    return fail("取消排期失败，请重试");
  }
}
