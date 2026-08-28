import type { Metadata } from "next";

import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Tasks · Personal Workbench" };

export default function TasksPage() {
  return <EmptyState message="四列看板与任务 CRUD 在 V0-08 落地，视图筛选在 V0-09。" />;
}
