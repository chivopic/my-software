"use client";

import { useEffect, useState, type ReactNode } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

/**
 * 三档布局（见 docs/02 第 3 节）：
 *   ≥1280px  240px 常驻侧边栏
 *   768–1279 64px 图标栏
 *   <768px   抽屉
 * 前两档纯靠 CSS 断点切换，只有抽屉需要状态。
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  return (
    <div className="flex min-h-dvh">
      <aside className="border-border hidden h-dvh w-16 shrink-0 border-r md:sticky md:top-0 md:block xl:hidden">
        <Sidebar compact />
      </aside>
      <aside className="border-border hidden h-dvh w-60 shrink-0 border-r xl:sticky xl:top-0 xl:block">
        <Sidebar />
      </aside>

      {drawerOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="关闭导航"
            className="absolute inset-0 h-full w-full cursor-default bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="border-border bg-surface absolute inset-y-0 left-0 w-60 border-r">
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMenu={() => setDrawerOpen(true)} />
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
