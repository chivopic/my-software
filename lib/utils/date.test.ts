import { describe, expect, it } from "vitest";

import { excerpt, formatDateTime } from "@/lib/utils/date";

const SHANGHAI = "Asia/Shanghai";

describe("formatDateTime", () => {
  const now = new Date("2026-08-28T00:00:00Z");

  it("按用户时区换算，而不是服务器时区", () => {
    // UTC 01:00 在 UTC+8 是当天 09:00
    expect(formatDateTime(new Date("2026-08-28T01:00:00Z"), SHANGHAI, now)).toBe("08/28 09:00");
  });

  it("跨日：UTC 的前一天晚上是本地的第二天", () => {
    expect(formatDateTime(new Date("2026-08-27T20:00:00Z"), SHANGHAI, now)).toBe("08/28 04:00");
  });

  it("同一年不显示年份，跨年才显示", () => {
    expect(formatDateTime(new Date("2026-01-02T03:00:00Z"), SHANGHAI, now)).not.toMatch(/2026/);
    expect(formatDateTime(new Date("2025-06-01T00:00:00Z"), SHANGHAI, now)).toMatch(/2025/);
  });

  it("跨年判断按用户时区算：UTC 还在去年，上海已是今年，就不显示年份", () => {
    expect(formatDateTime(new Date("2025-12-31T20:00:00Z"), SHANGHAI, now)).toBe("01/01 04:00");
  });

  it("换时区结果跟着变", () => {
    const at = new Date("2026-08-28T01:00:00Z");
    expect(formatDateTime(at, "UTC", now)).toBe("08/28 01:00");
    expect(formatDateTime(at, "America/New_York", now)).toBe("08/27 21:00");
  });
});

describe("excerpt", () => {
  it("去掉标题、列表和强调标记", () => {
    expect(excerpt("# 标题\n\n- 一项\n- 另一项\n\n**加粗**文字")).toBe("标题 一项 另一项 加粗文字");
  });

  it("去掉代码块，保留链接文字", () => {
    expect(excerpt("看这个 [文档](https://example.com)\n\n```ts\nconst a = 1;\n```")).toBe(
      "看这个 文档",
    );
  });

  it("超长截断并加省略号", () => {
    const result = excerpt("a".repeat(200), 10);
    expect(result).toBe(`${"a".repeat(10)}…`);
  });

  it("不足长度不加省略号", () => {
    expect(excerpt("短文本", 10)).toBe("短文本");
  });
});
