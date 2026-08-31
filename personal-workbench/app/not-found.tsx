import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <p className="text-muted font-mono text-xs">404</p>
      <h2 className="text-foreground text-xl font-semibold">这个页面不存在</h2>
      <p className="text-muted">链接可能过期了，或者这条笔记/任务已经被删除。</p>
      <Link href="/">
        <Button variant="primary">回到 Dashboard</Button>
      </Link>
    </div>
  );
}
