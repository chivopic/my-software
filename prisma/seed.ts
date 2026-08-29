import { loadEnvFile } from "node:process";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../lib/generated/prisma/client";

try {
  loadEnvFile(".env");
} catch {
  // .env 不存在：依赖进程里已有的环境变量
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("缺少 DATABASE_URL，复制 .env.example 为 .env 后再跑 seed");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const LOCAL_USER_ID = "local-user";

/** 相对今天的第 n 天，只保留日期部分（对应 schema 里的 @db.Date 字段）。 */
function dateOffset(days: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** 今天的某个整点，用于 scheduledStart / scheduledEnd。 */
function todayAt(hour: number): Date {
  const d = new Date();
  d.setUTCHours(hour, 0, 0, 0);
  return d;
}

async function main() {
  const user = await prisma.user.upsert({
    where: { id: LOCAL_USER_ID },
    update: {},
    create: {
      id: LOCAL_USER_ID,
      name: "Me",
      timezone: "Asia/Shanghai",
    },
  });
  console.log(`✓ user ${user.id}`);

  const tagSeeds = [
    { slug: "ai-infra", name: "AI Infra", color: "#6366f1" },
    { slug: "algorithms", name: "Algorithms", color: "#f59e0b" },
    { slug: "project", name: "Project", color: "#10b981" },
  ];

  const tags = new Map<string, string>();
  for (const t of tagSeeds) {
    const tag = await prisma.tag.upsert({
      where: { userId_slug: { userId: user.id, slug: t.slug } },
      update: { name: t.name, color: t.color },
      create: { userId: user.id, ...t },
    });
    tags.set(t.slug, tag.id);
  }
  console.log(`✓ ${tags.size} tags`);

  if (process.env.NODE_ENV === "production") {
    console.log("生产环境：跳过示例数据");
    return;
  }

  // 示例数据用固定 id，重复跑 seed 不会堆出一大堆重复条目。
  const taskSeeds = [
    {
      id: "seed-task-leetcode",
      title: "刷 LeetCode 239 滑动窗口最大值",
      status: "TODO" as const,
      priority: "HIGH" as const,
      dueDate: dateOffset(0),
      scheduledFor: dateOffset(0),
      scheduledStart: todayAt(1), // 09:00 Asia/Shanghai
      scheduledEnd: todayAt(2),
      tag: "algorithms",
    },
    {
      id: "seed-task-api",
      title: "完成 Personal Workbench 的 Notes API",
      description: "先把 CRUD 打通，标签留到 V0-06。",
      status: "DOING" as const,
      priority: "URGENT" as const,
      dueDate: dateOffset(1),
      tag: "project",
    },
    {
      id: "seed-task-paper",
      title: "读一篇 Agent 相关论文",
      status: "TODO" as const,
      priority: "MEDIUM" as const,
      dueDate: dateOffset(3),
      tag: "ai-infra",
    },
    {
      id: "seed-task-capture",
      title: "研究一下 speculative decoding",
      status: "INBOX" as const,
      priority: "LOW" as const,
      tag: "ai-infra",
    },
    {
      id: "seed-task-deploy",
      title: "把骨架部署到 Vercel",
      status: "DONE" as const,
      priority: "MEDIUM" as const,
      completedAt: new Date(),
      tag: "project",
    },
  ];

  for (const [index, t] of taskSeeds.entries()) {
    const { tag, ...task } = t;
    await prisma.task.upsert({
      where: { id: task.id },
      update: {},
      create: {
        ...task,
        userId: user.id,
        order: index,
        tags: { create: [{ tagId: tags.get(tag)! }] },
      },
    });
  }
  console.log(`✓ ${taskSeeds.length} tasks`);

  const noteSeeds = [
    {
      id: "seed-note-paged-attention",
      title: "PagedAttention",
      content:
        "# PagedAttention\n\n本质是把 KV cache 分块管理，像操作系统的分页一样，\n用块表把逻辑上连续的 KV cache 映射到物理上不连续的显存块。\n\n- 避免了为最大序列长度预留显存造成的浪费\n- 块可以在请求之间共享（比如同一个 prompt 的多个采样）\n",
      isFavorite: true,
      tag: "ai-infra",
    },
    {
      id: "seed-note-sliding-window",
      title: "滑动窗口小结",
      content:
        "# 滑动窗口\n\n两个指针，右指针扩张、左指针收缩，维护窗口内的不变量。\n\n判断能不能用：\n\n1. 问题问的是**连续**子数组 / 子串\n2. 窗口扩张时答案单调变差、收缩时单调变好\n",
      tag: "algorithms",
    },
    {
      id: "seed-note-workbench",
      title: "Personal Workbench 设计要点",
      content:
        "# 设计要点\n\n- AI 是能力层，不是一个页面\n- dueDate（什么时候之前做完）和 scheduledFor（打算哪天做）必须分开\n- 每天打开第一屏就知道今天该干什么\n",
      tag: "project",
    },
  ];

  for (const n of noteSeeds) {
    const { tag, ...note } = n;
    await prisma.note.upsert({
      where: { id: note.id },
      update: {},
      create: {
        ...note,
        userId: user.id,
        tags: { create: [{ tagId: tags.get(tag)! }] },
      },
    });
  }
  console.log(`✓ ${noteSeeds.length} notes`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
