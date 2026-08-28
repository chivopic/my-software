"use client";

import { usePathname } from "next/navigation";

import { titleForPath } from "@/components/layout/nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();

  return (
    <header className="border-border bg-background/80 sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 backdrop-blur md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onOpenMenu}
        aria-label="打开导航"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          aria-hidden
          className="size-4"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </Button>

      <h1 className="text-foreground font-medium">{titleForPath(pathname)}</h1>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
      </div>
    </header>
  );
}
