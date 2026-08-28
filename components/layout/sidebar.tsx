"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS, SETTINGS_ITEM, type NavItem } from "@/components/layout/nav";
import { cn } from "@/lib/utils/cn";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavLink({
  item,
  active,
  compact,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  compact: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={compact ? item.label : undefined}
      className={cn(
        "flex h-9 items-center gap-3 rounded-md px-3 transition-colors",
        compact && "justify-center px-0",
        active
          ? "bg-surface-hover text-foreground font-medium"
          : "text-muted hover:bg-surface-hover hover:text-foreground",
      )}
    >
      <item.icon />
      <span className={cn(compact && "sr-only")}>{item.label}</span>
    </Link>
  );
}

export function Sidebar({
  compact = false,
  onNavigate,
}: {
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col gap-1 px-3 py-4">
      <div className={cn("mb-4 px-3", compact && "px-0 text-center")}>
        <span className="text-foreground font-semibold">{compact ? "PW" : "Workbench"}</span>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
            compact={compact}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1">
        <div className="border-border my-2 border-t" />
        <NavLink
          item={SETTINGS_ITEM}
          active={isActive(pathname, SETTINGS_ITEM.href)}
          compact={compact}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}
