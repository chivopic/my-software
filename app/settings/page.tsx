import type { Metadata } from "next";

import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Settings · Personal Workbench" };

export default function SettingsPage() {
  return <EmptyState message="数据统计与 JSON 导出在 V0-13 落地。" />;
}
