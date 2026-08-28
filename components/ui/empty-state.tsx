import Link from "next/link";
import { type Route } from "next";

import { cn } from "@/lib/utils/cn";

/**
 * 每个列表都必须有空状态：一句话 + 一个行动入口（见 docs/02 第 6 节）。
 */
export function EmptyState({
  message,
  action,
  className,
}: {
  message: string;
  action?: { label: string; href: Route };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center",
        className,
      )}
    >
      <p className="text-muted">{message}</p>
      {action ? (
        <Link
          href={action.href}
          className="text-accent hover:text-accent-hover font-medium transition-colors"
        >
          {action.label} →
        </Link>
      ) : null}
    </div>
  );
}
