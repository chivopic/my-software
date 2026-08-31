import type { Ref, TextareaHTMLAttributes } from "react";

import { fieldClassName } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

export function Textarea({
  className,
  ref,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: Ref<HTMLTextAreaElement> }) {
  return <textarea ref={ref} className={cn(fieldClassName, "resize-y", className)} {...props} />;
}
