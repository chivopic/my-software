import type { Route } from "next";
import type { SVGProps } from "react";

function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="size-4 shrink-0"
      {...props}
    />
  );
}

export type NavItem = {
  href: Route;
  label: string;
  icon: (props: SVGProps<SVGSVGElement>) => React.ReactElement;
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: (props) => (
      <Icon {...props}>
        <path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z" />
      </Icon>
    ),
  },
  {
    href: "/notes",
    label: "Notes",
    icon: (props) => (
      <Icon {...props}>
        <path d="M6 3h9l4 4v14H6z" />
        <path d="M14 3v5h5M9 12h7M9 16h7" />
      </Icon>
    ),
  },
  {
    href: "/tasks",
    label: "Tasks",
    icon: (props) => (
      <Icon {...props}>
        <path d="M4 5h4v4H4zM4 15h4v4H4z" />
        <path d="M11 7h9M11 17h9" />
      </Icon>
    ),
  },
  {
    href: "/planner",
    label: "Planner",
    icon: (props) => (
      <Icon {...props}>
        <path d="M4 6h16v14H4z" />
        <path d="M4 10h16M9 3v4M15 3v4" />
      </Icon>
    ),
  },
];

export const SETTINGS_ITEM: NavItem = {
  href: "/settings",
  label: "Settings",
  icon: (props) => (
    <Icon {...props}>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </Icon>
  ),
};

const ALL_ITEMS = [...NAV_ITEMS, SETTINGS_ITEM];

/** 当前路径对应的页面标题，用于 Topbar。 */
export function titleForPath(pathname: string): string {
  const match = ALL_ITEMS.filter((item) => item.href !== "/").find((item) =>
    pathname.startsWith(item.href),
  );
  return match?.label ?? "Dashboard";
}
