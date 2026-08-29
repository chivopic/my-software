import type { Metadata } from "next";

import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Planner · Personal Workbench" };

export default function PlannerPage() {
  return <EmptyState message="单日时间轴与排期在 V0-11 落地，它依赖 Tasks。" />;
}
