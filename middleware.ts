import { NextResponse, type NextRequest } from "next/server";

/**
 * V0 没有认证系统（见 docs/01 第 3.2 节），但部署到公网后总得有一道门，
 * 否则拿到链接的人就能读写你的全部笔记和任务。
 *
 * 这里用 HTTP Basic：设了 APP_PASSWORD 就要求输入，不设就完全不拦
 * （本地开发默认不设）。这不是认证系统，只是一把挂锁——真正的多用户
 * 认证是 V1 的事，那时会替换掉这个文件。
 */
export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.svg).*)"],
};

/** 逐字符比较到底，不因为提前发现不同就返回，避免按响应时间猜密码。 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function unauthorized() {
  return new NextResponse("需要密码", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Personal Workbench", charset="UTF-8"' },
  });
}

export function middleware(request: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next();

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return unauthorized();

  let decoded: string;
  try {
    decoded = atob(header.slice("Basic ".length));
  } catch {
    return unauthorized();
  }

  // 用户名不校验，只认密码
  const supplied = decoded.slice(decoded.indexOf(":") + 1);
  return safeEqual(supplied, password) ? NextResponse.next() : unauthorized();
}
