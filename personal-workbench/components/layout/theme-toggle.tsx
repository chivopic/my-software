"use client";

import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

type Theme = "system" | "light" | "dark";

const ORDER: Theme[] = ["system", "light", "dark"];
const LABEL: Record<Theme, string> = { system: "跟随系统", light: "浅色", dark: "深色" };

export const THEME_STORAGE_KEY = "theme";

// localStorage 是 React 之外的状态，用 useSyncExternalStore 订阅：
// 服务端和 hydration 阶段一律当作 system，挂载后再读真实值，不会有 hydration 警告。
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

function getServerSnapshot(): Theme {
  return "system";
}

function setTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (theme !== "system") root.classList.add(theme);

  try {
    if (theme === "system") {
      localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  } catch {
    // 隐私模式下写不进去：本次会话内仍然生效，但下次打开回到跟随系统
  }
  listeners.forEach((listener) => listener());
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length] ?? "system")}
      title={`主题：${LABEL[theme]}`}
      aria-label={`主题：${LABEL[theme]}，点击切换`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className="size-4"
      >
        {theme === "dark" ? (
          <path d="M20 13a8 8 0 1 1-9-9 6.5 6.5 0 0 0 9 9z" />
        ) : theme === "light" ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          <>
            <circle cx="12" cy="12" r="8" />
            <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none" />
          </>
        )}
      </svg>
    </Button>
  );
}
