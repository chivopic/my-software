import { type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type Tone =
  "neutral" | "accent" | "inbox" | "todo" | "doing" | "done" | "low" | "medium" | "high" | "urgent";

const tones: Record<Tone, string> = {
  neutral: "text-muted border-border",
  accent: "text-accent border-accent/40",
  inbox: "text-status-inbox border-status-inbox/40",
  todo: "text-status-todo border-status-todo/40",
  doing: "text-status-doing border-status-doing/40",
  done: "text-status-done border-status-done/40",
  low: "text-priority-low border-priority-low/40",
  medium: "text-priority-medium border-priority-medium/40",
  high: "text-priority-high border-priority-high/40",
  urgent: "text-priority-urgent border-priority-urgent/40",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs leading-5",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
