import Link from "next/link";
import type { Route } from "next";

const ITEMS: {
  key: "tasksDue" | "planned" | "notesRecent" | "inbox";
  label: string;
  href: Route;
}[] = [
  { key: "tasksDue", label: "今天到期", href: "/tasks?view=today" },
  { key: "planned", label: "已排期", href: "/planner" },
  { key: "inbox", label: "Inbox 待整理", href: "/tasks?view=inbox" },
  { key: "notesRecent", label: "近 7 天笔记", href: "/notes" },
];

export function StatRow({
  stats,
}: {
  stats: { tasksDue: number; planned: number; notesRecent: number; inbox: number };
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className="border-border bg-surface hover:bg-surface-hover rounded-lg border px-4 py-3 transition-colors"
        >
          <p className="text-foreground text-2xl font-semibold tabular-nums">{stats[item.key]}</p>
          <p className="text-muted text-xs">{item.label}</p>
        </Link>
      ))}
    </div>
  );
}
