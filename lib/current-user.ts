import { prisma } from "@/lib/db";

/**
 * V0 是单用户的，没有认证：所有查询都用 seed 出来的这一行。
 * V1 接入认证时只改这个文件，业务代码照旧调用 getCurrentUser()。
 */
export const LOCAL_USER_ID = "local-user";

export async function getCurrentUserId(): Promise<string> {
  return LOCAL_USER_ID;
}

export async function getCurrentUser() {
  const user = await prisma.user.findUnique({ where: { id: LOCAL_USER_ID } });
  if (!user) {
    throw new Error("找不到 local-user，先跑 pnpm db:seed");
  }
  return user;
}
