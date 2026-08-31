"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";

const DEBOUNCE_MS = 300;

export function NoteSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("q") ?? "";
  const [value, setValue] = useState(current);

  useEffect(() => {
    if (value === current) return;

    const timer = setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (value.trim()) {
        next.set("q", value.trim());
      } else {
        next.delete("q");
      }
      next.delete("page"); // 换了关键词就回到第一页
      router.replace(`/notes?${next}`);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [value, current, router, searchParams]);

  return (
    <Input
      type="search"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder="搜索标题和正文…"
      aria-label="搜索笔记"
      className="max-w-64"
    />
  );
}
