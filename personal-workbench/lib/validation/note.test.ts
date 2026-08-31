import { describe, expect, it } from "vitest";

import { createNoteSchema, MAX_TITLE_LENGTH, noteIdSchema } from "@/lib/validation/note";

describe("createNoteSchema", () => {
  it("允许空标题（新建的空笔记）", () => {
    const parsed = createNoteSchema.safeParse({ title: "", content: "" });
    expect(parsed.success).toBe(true);
  });

  it("去掉标题首尾空白", () => {
    const parsed = createNoteSchema.safeParse({ title: "  PagedAttention  ", content: "" });
    expect(parsed.success && parsed.data.title).toBe("PagedAttention");
  });

  it("标题超长报错", () => {
    const parsed = createNoteSchema.safeParse({ title: "a".repeat(MAX_TITLE_LENGTH + 1) });
    expect(parsed.success).toBe(false);
  });

  it("content 缺省为空串", () => {
    const parsed = createNoteSchema.safeParse({ title: "x" });
    expect(parsed.success && parsed.data.content).toBe("");
  });
});

describe("noteIdSchema", () => {
  it("空字符串不合法", () => {
    expect(noteIdSchema.safeParse("").success).toBe(false);
  });
});
