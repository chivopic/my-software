import { NextResponse, type NextRequest } from "next/server";

/** V0 has no user accounts; APP_PASSWORD is a shared deployment access gate. */
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
  if (!password) {
    return process.env.NODE_ENV === "production" ? unauthorized() : NextResponse.next();
  }

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return unauthorized();

  let decoded: string;
  try {
    decoded = atob(header.slice("Basic ".length));
  } catch {
    return unauthorized();
  }

  // Basic credentials are username:password; the username is intentionally ignored.
  const separator = decoded.indexOf(":");
  if (separator < 0) return unauthorized();
  const supplied = decoded.slice(separator + 1);
  return safeEqual(supplied, password) ? NextResponse.next() : unauthorized();
}
