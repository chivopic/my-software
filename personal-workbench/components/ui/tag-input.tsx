"use client";

import { useId, useState, type KeyboardEvent } from "react";

import { fieldClassName } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

export function TagInput({
  value,
  onChange,
  suggestions = [],
  disabled = false,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const listId = useId();

  function add(raw: string) {
    const name = raw.trim();
    if (!name) return;
    if (value.some((existing) => existing.toLowerCase() === name.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...value, name]);
    setDraft("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      add(draft);
    } else if (event.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className={cn(fieldClassName, "flex flex-wrap items-center gap-1.5 py-1.5")}>
      {value.map((name) => (
        <span
          key={name}
          className="border-border text-muted inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
        >
          {name}
          <button
            type="button"
            onClick={() => onChange(value.filter((item) => item !== name))}
            disabled={disabled}
            aria-label={`移除标签 ${name}`}
            className="hover:text-foreground cursor-pointer leading-none"
          >
            ×
          </button>
        </span>
      ))}

      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => add(draft)}
        disabled={disabled}
        list={listId}
        placeholder={value.length === 0 ? "加标签，回车确认" : ""}
        aria-label="添加标签"
        className="text-foreground placeholder:text-muted min-w-32 flex-1 bg-transparent outline-none"
      />

      <datalist id={listId}>
        {suggestions
          .filter((name) => !value.includes(name))
          .map((name) => (
            <option key={name} value={name} />
          ))}
      </datalist>
    </div>
  );
}
