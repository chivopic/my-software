import { z } from "zod";

export const MAX_TASK_TITLE_LENGTH = 200;

export const taskIdSchema = z.string().min(1, "缺少任务 id");

export const taskStatusSchema = z.enum(["INBOX", "TODO", "DOING", "DONE"]);
export const taskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export type TaskStatusValue = z.infer<typeof taskStatusSchema>;
export type TaskPriorityValue = z.infer<typeof taskPrioritySchema>;

/** <input type="date"> 的值或空串 */
const dateInput = z
  .string()
  .regex(/^(\d{4}-\d{2}-\d{2})?$/, "日期格式应为 YYYY-MM-DD")
  .optional()
  .default("");

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "标题不能为空").max(MAX_TASK_TITLE_LENGTH, "标题过长"),
  description: z.string().trim().default(""),
  status: taskStatusSchema.default("INBOX"),
  priority: taskPrioritySchema.default("MEDIUM"),
  dueDate: dateInput,
  tags: z.array(z.string()).default([]),
});

export const updateTaskSchema = createTaskSchema;

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const STATUS_LABEL: Record<TaskStatusValue, string> = {
  INBOX: "Inbox",
  TODO: "Todo",
  DOING: "Doing",
  DONE: "Done",
};

export const PRIORITY_LABEL: Record<TaskPriorityValue, string> = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
  URGENT: "紧急",
};

export const STATUS_ORDER: TaskStatusValue[] = ["INBOX", "TODO", "DOING", "DONE"];
