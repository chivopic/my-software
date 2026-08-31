"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/** 路由级兜底。最常见的原因是数据库连不上（.env 没配或 Postgres 没起）。 */
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <h2 className="text-foreground text-xl font-semibold">出错了</h2>
      <p className="text-muted max-w-md">
        页面没能加载出来。如果是刚起项目，先确认 <code className="font-mono">.env</code> 里的{" "}
        <code className="font-mono">DATABASE_URL</code> 指向一个跑着的 Postgres， 并且已经执行过{" "}
        <code className="font-mono">pnpm db:migrate</code>。
      </p>
      <Button variant="primary" onClick={reset}>
        重试
      </Button>
    </div>
  );
}
