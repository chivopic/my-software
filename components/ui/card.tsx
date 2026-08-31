import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-border bg-surface rounded-lg border", className)} {...props} />;
}

export function CardHeader({
  title,
  action,
  className,
}: {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3 px-4 py-3", className)}>
      <h2 className="text-foreground text-sm font-semibold">{title}</h2>
      {action}
    </div>
  );
}
