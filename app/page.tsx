import type { Metadata } from "next";

import { Card, CardHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard · Personal Workbench" };

const SECTIONS = [
  { title: "Today's Focus", note: "今天到期或已排期的未完成任务", task: "V0-12" },
  { title: "Today's Schedule", note: "今天已排期任务的时间列表", task: "V0-12" },
  { title: "Recent Notes", note: "最近编辑的 5 条笔记", task: "V0-12" },
  { title: "Daily Brief", note: "每日信息摘要", task: "V3" },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted">
        骨架已就位。Dashboard 的内容依赖 Notes、Tasks 和 Planner 的数据，在 V0-12 一起落地。
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <Card key={section.title}>
            <CardHeader
              title={section.title}
              action={<span className="text-muted font-mono text-xs">{section.task}</span>}
            />
            <p className="text-muted border-border border-t px-4 py-3">{section.note}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
