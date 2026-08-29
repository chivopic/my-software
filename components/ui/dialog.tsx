"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * 基于原生 <dialog>：Esc 关闭和焦点陷阱由浏览器提供，不需要额外依赖。
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(event) => {
        // 点击 backdrop（事件目标是 dialog 本身而非内容）时关闭
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        "bg-surface text-foreground border-border m-auto w-[min(32rem,calc(100vw-2rem))] rounded-lg border p-0",
        "backdrop:bg-black/40",
        className,
      )}
    >
      <div className="p-4">{children}</div>
    </dialog>
  );
}
