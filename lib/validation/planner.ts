import { z } from "zod";

/** 时间轴显示的区间（用户时区的小时）。 */
export const TIMELINE_START_HOUR = 6;
export const TIMELINE_END_HOUR = 24;

export const daySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式应为 YYYY-MM-DD")
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()), "日期不存在");

export const scheduleSchema = z.object({
  taskId: z.string().min(1, "缺少任务 id"),
  day: daySchema,
  hour: z
    .number()
    .int("小时必须是整数")
    .min(TIMELINE_START_HOUR, "超出时间轴范围")
    .max(TIMELINE_END_HOUR - 1, "超出时间轴范围"),
});
