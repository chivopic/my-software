import { loadEnvFile } from "node:process";

import { defineConfig } from "prisma/config";

// Prisma 7 不再自动读取 .env，用 Node 内建的 loadEnvFile，不额外引入 dotenv。
// 生产环境由平台注入环境变量，没有 .env 文件是正常的。
try {
  loadEnvFile(".env");
} catch {
  // .env 不存在：忽略
}

const url = process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  // 只在有连接串时才声明 datasource：干净克隆上 pnpm install 会触发 prisma generate，
  // 那时还没有 .env，用 env() 会直接抛错让安装失败。migrate 等命令缺了它会自己报错。
  ...(url ? { datasource: { url } } : {}),
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});
