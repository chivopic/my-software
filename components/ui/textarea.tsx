import type { TextareaHTMLAttributes } from "react";

import { fieldClassName } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClassName, "resize-y", className)} {...props} />;
}
