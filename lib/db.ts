import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/lib/generated/prisma/client";

// Prisma 7 通过 driver adapter 连接数据库，连接串不再从 schema 读取。
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("缺少 DATABASE_URL，复制 .env.example 为 .env 后再启动");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

// 开发环境下 Next 的热更新会反复求值模块，挂到 globalThis 上避免连接数爆掉。
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
