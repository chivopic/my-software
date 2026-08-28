import type { Metadata } from "next";

import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Notes · Personal Workbench" };

export default function NotesPage() {
  return <EmptyState message="笔记的增删改查在 V0-04 落地，Markdown 编辑器在 V0-05。" />;
}
