import type { Metadata } from "next";

import { Card, CardHeader } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/current-user";
import { getDataStats } from "@/lib/queries/export";
import { formatDateTime } from "@/lib/utils/date";

// 这一页读的是当前用户的实时数据，不能静态预渲染：
// 否则构建时会把当时数据库里的内容烤进页面，部署后一直显示旧数据。
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Settings · Personal Workbench" };

const APP_VERSION = "V0";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const stats = await getDataStats(user.id);

  const rows: { label: string; value: string | number }[] = [
    { label: "笔记", value: stats.notes },
    { label: "任务", value: stats.tasks },
    { label: "已完成任务", value: stats.completed },
    { label: "已排期任务", value: stats.scheduled },
    { label: "标签", value: stats.tags },
    { label: "项目", value: stats.projects },
    { label: "已删除（笔记 / 任务）", value: `${stats.notesDeleted} / ${stats.tasksDeleted}` },
    {
      label: "行为日志",
      value: stats.trackingSince
        ? `${stats.activities} 条 · 自 ${formatDateTime(stats.trackingSince, user.timezone)}`
        : `${stats.activities} 条`,
    },
  ];

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Card>
        <CardHeader
          title="数据"
          action={<span className="text-muted font-mono text-xs">{APP_VERSION}</span>}
        />
        <dl className="border-border divide-border divide-y border-t">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
              <dt className="text-muted">{row.label}</dt>
              <dd className="text-foreground tabular-nums">{row.value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card>
        <CardHeader title="备份" />
        <div className="border-border flex flex-col gap-3 border-t px-4 py-4">
          <p className="text-muted text-xs">
            导出全部笔记、任务、标签、项目和行为日志（含已删除的），JSON 格式。 这是 V0
            唯一的备份手段，换机器或清库前记得先导一份。
          </p>
          <a
            href="/api/export"
            download
            className="bg-accent text-accent-foreground hover:bg-accent-hover inline-flex h-9 w-fit items-center rounded-md px-3.5 font-medium transition-colors"
          >
            导出 JSON
          </a>
        </div>
      </Card>

      <Card>
        <CardHeader title="偏好" />
        <dl className="border-border divide-border divide-y border-t">
          <div className="flex items-center justify-between px-4 py-2.5">
            <dt className="text-muted">时区</dt>
            <dd className="text-foreground font-mono text-xs">{user.timezone}</dd>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5">
            <dt className="text-muted">主题</dt>
            <dd className="text-muted text-xs">在右上角切换（跟随系统 / 浅色 / 深色）</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
