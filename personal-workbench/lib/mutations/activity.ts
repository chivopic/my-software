import { prisma } from "@/lib/db";
import type { ActivityAction, ActivityEntityType, Prisma } from "@/lib/generated/prisma/client";

export type ActivityInput = {
  userId: string;
  entityType: ActivityEntityType;
  entityId: string;
  action: ActivityAction;
  /** 当时的标题快照：条目后来改名或删除后，日志仍然读得懂 */
  summary?: string | null;
  metadata?: Prisma.InputJsonValue;
};

/**
 * 记一条行为日志。
 *
 * 这里刻意吞掉异常：日志是给 V2 的统计用的副产物，写失败不应该让用户的
 * 删除、排期这些正经操作跟着失败。失败会打到服务端日志，不会静默消失。
 */
export async function logActivity(input: ActivityInput): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId: input.userId,
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        summary: input.summary ?? null,
        ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
      },
    });
  } catch (error) {
    console.error("[activity] 写入行为日志失败", error);
  }
}
