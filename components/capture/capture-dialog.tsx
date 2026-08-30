"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { captureAction } from "@/app/capture/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";

type Kind = "task" | "note";

const KIND_LABEL: Record<Kind, string> = { task: "任务", note: "笔记" };

/** 顶栏的 + Capture 按钮，连带全局 ⌘K 监听和弹窗本体。 */
export function CaptureButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        + Capture
        <kbd className="ml-1 font-mono text-[10px] opacity-70">⌘K</kbd>
      </Button>
      {open ? <CaptureDialog onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function CaptureDialog({ onClose }: { onClose: () => void }) {
  const [kind, setKind] = useState<Kind>("task");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const toast = useToast();
  const router = useRouter();

  // Dialog 是在 effect 里 showModal 的，比 React 的 autoFocus 晚，
  // 所以这里显式抢一次焦点，否则打开后第一次按键会落在弹窗外面。
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function submit() {
    if (pending) return;
    setPending(true);
    const result = await captureAction({ kind, text });
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    const { id } = result.data;
    toast({
      message: `已保存为${KIND_LABEL[kind]}`,
      action: {
        label: "查看",
        onClick: () => router.push(kind === "task" ? "/tasks?view=inbox" : `/notes/${id}`),
      },
    });
    router.refresh(); // 当前页如果正好在看这些数据，立刻刷新
    onClose();
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void submit();
      return;
    }
    // 输入框里按 Tab 切换类型（Shift+Tab 仍然是正常的焦点后退）
    if (event.key === "Tab" && !event.shiftKey) {
      event.preventDefault();
      setKind((current) => (current === "task" ? "note" : "task"));
    }
  }

  return (
    <Dialog open onClose={onClose} title="Quick Capture">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1" role="group" aria-label="保存为">
          {(["task", "note"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setKind(value);
                inputRef.current?.focus();
              }}
              aria-pressed={kind === value}
              className={cn(
                "cursor-pointer rounded-md px-2.5 py-1 text-xs transition-colors",
                kind === value
                  ? "bg-accent text-accent-foreground"
                  : "text-muted hover:text-foreground",
              )}
            >
              {KIND_LABEL[value]}
            </button>
          ))}
          <span className="text-muted ml-auto text-[11px]">Tab 切换 · ⌘Enter 保存</span>
        </div>

        <Textarea
          ref={inputRef}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={kind === "task" ? "要做什么？" : "记点什么？"}
          aria-label="Quick Capture 输入"
          rows={4}
        />

        {error ? <p className="text-danger text-xs">{error}</p> : null}

        <div className="flex items-center justify-end gap-2">
          <Button onClick={onClose} disabled={pending}>
            取消
          </Button>
          <Button
            variant="primary"
            onClick={() => void submit()}
            disabled={pending || !text.trim()}
          >
            {pending ? "保存中…" : `保存为${KIND_LABEL[kind]}`}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
