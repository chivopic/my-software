import { describe, expect, it } from "vitest";

import { slugify } from "@/lib/utils/slug";

describe("slugify", () => {
  it("小写并把空白转成连字符", () => {
    expect(slugify("AI Infra")).toBe("ai-infra");
    expect(slugify("  Deep   Learning  ")).toBe("deep-learning");
  });

  it("保留中文", () => {
    expect(slugify("算法")).toBe("算法");
    expect(slugify("AI 基础设施")).toBe("ai-基础设施");
  });

  it("去掉标点，不留下多余连字符", () => {
    expect(slugify("C++/Rust!")).toBe("crust");
    expect(slugify("a -- b")).toBe("a-b");
  });

  it("全是标点时返回空串，调用方据此拒绝", () => {
    expect(slugify("!!!")).toBe("");
  });
});
