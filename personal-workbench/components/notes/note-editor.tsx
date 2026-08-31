"use client";

import { useEffect, useRef, useState } from "react";

import { updateNoteAction } from "@/app/notes/actions";
import { Markdown } from "@/components/notes/markdown";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";

const AUTOSAVE_DELAY_MS = 800;

type SaveState =
  | { kind: "idle" }
  | { kind: "unsaved" }
  | { kind: "saving" }
  | { kind: "saved"; at: Date }
  | { kind: "error"; message: string };

function statusText(state: SaveState, timeZone: string): string {
  switch (state.kind) {
    case "saving":
      return "保存中…";
    case "saved":
      return `已保存 ${new Intl.DateTimeFormat("zh-CN", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(state.at)}`;
    case "unsaved":
      return "未保存";
    case "error":
      return state.message;
    default:
      return "";
  }
}

export function NoteEditor({
  noteId,
  initialTitle,
  initialContent,
  timeZone,
}: {
  noteId: string;
  initialTitle: string;
  initialContent: string;
  timeZone: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [state, setState] = useState<SaveState>({ kind: "idle" });

  // 只有用户真的改过才触发保存，避免打开页面就写一次库
  const dirty = useRef(false);

  useEffect(() => {
    if (!dirty.current) return;

    const timer = setTimeout(async () => {
      setState({ kind: "saving" });
      const result = await updateNoteAction(noteId, { title, content });
      if (result.ok) {
        dirty.current = false;
        setState({ kind: "saved", at: new Date(result.data.savedAt) });
      } else {
        setState({ kind: "error", message: result.error });
      }
    }, AUTOSAVE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [noteId, title, content]);

  // 还有没落库的改动时拦一下关闭/刷新
  useEffect(() => {
    if (state.kind !== "unsaved" && state.kind !== "saving" && state.kind !== "error") return;

    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [state.kind]);

  function onEdit(next: { title?: string; content?: string }) {
    dirty.current = true;
    setState({ kind: "unsaved" });
    if (next.title !== undefined) setTitle(next.title);
    if (next.content !== undefined) setContent(next.content);
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        value={title}
        onChange={(event) => onEdit({ title: event.target.value })}
        placeholder="无标题"
        aria-label="笔记标题"
        className="text-foreground placeholder:text-muted w-full bg-transparent text-xl font-semibold outline-none"
      />

      <div className="border-border flex items-center gap-1 border-b">
        {(["edit", "preview"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            aria-current={tab === value ? "true" : undefined}
            className={cn(
              "-mb-px cursor-pointer border-b-2 px-3 py-1.5 transition-colors",
              tab === value
                ? "border-accent text-foreground"
                : "text-muted hover:text-foreground border-transparent",
            )}
          >
            {value === "edit" ? "编辑" : "预览"}
          </button>
        ))}
        <span
          aria-live="polite"
          className={cn("ml-auto text-xs", state.kind === "error" ? "text-danger" : "text-muted")}
        >
          {statusText(state, timeZone)}
        </span>
      </div>

      {tab === "edit" ? (
        <Textarea
          value={content}
          onChange={(event) => onEdit({ content: event.target.value })}
          placeholder="用 Markdown 写点什么…"
          aria-label="笔记正文"
          rows={20}
          className="font-mono leading-relaxed"
        />
      ) : content.trim() ? (
        <div className="border-border bg-surface rounded-md border px-4 py-3">
          <Markdown>{content}</Markdown>
        </div>
      ) : (
        <p className="text-muted border-border rounded-md border border-dashed px-4 py-8 text-center">
          还没有内容。
        </p>
      )}
    </div>
  );
}
