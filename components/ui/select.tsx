import type { SelectHTMLAttributes } from "react";

import { fieldClassName } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldClassName, "h-9 cursor-pointer py-0", className)} {...props} />;
}
