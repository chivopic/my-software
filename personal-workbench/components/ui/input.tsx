import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export const fieldClassName = cn(
  "border-border bg-surface text-foreground placeholder:text-muted w-full rounded-md border px-3 py-2",
  "transition-colors disabled:cursor-not-allowed disabled:opacity-50",
);

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClassName, "h-9 py-0", className)} {...props} />;
}
