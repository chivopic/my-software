import { describe, expect, it } from "vitest";

import {
  addDays,
  excerpt,
  formatDateTime,
  formatDueDate,
  isOverdue,
  parseDateInput,
  toDateInputValue,
  todayInTimeZone,
} from "@/lib/utils/date";

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

describe("todayInTimeZone", () => {
  it("按时区给出不同的今天", () => {
    const at = new Date("2026-08-28T18:00:00Z");
    expect(todayInTimeZone("Asia/Shanghai", at)).toBe("2026-08-29");
    expect(todayInTimeZone("UTC", at)).toBe("2026-08-28");
    expect(todayInTimeZone("America/New_York", at)).toBe("2026-08-28");
  });
});

describe("parseDateInput / toDateInputValue", () => {
  it("往返不丢", () => {
    const date = parseDateInput("2026-08-30");
    expect(date?.toISOString()).toBe("2026-08-30T00:00:00.000Z");
    expect(toDateInputValue(date)).toBe("2026-08-30");
  });

  it("非法输入返回 null", () => {
    expect(parseDateInput("")).toBeNull();
    expect(parseDateInput("2026/08/30")).toBeNull();
    expect(parseDateInput("2026-13-01")).toBeNull();
  });

  it("空值转成空串", () => {
    expect(toDateInputValue(null)).toBe("");
    expect(toDateInputValue(undefined)).toBe("");
  });
});

describe("isOverdue", () => {
  const today = "2026-08-28";

  it("昨天算过期，今天和明天不算", () => {
    expect(isOverdue(parseDateInput("2026-08-27"), today)).toBe(true);
    expect(isOverdue(parseDateInput("2026-08-28"), today)).toBe(false);
    expect(isOverdue(parseDateInput("2026-08-29"), today)).toBe(false);
  });

  it("没有截止日期就不会过期", () => {
    expect(isOverdue(null, today)).toBe(false);
  });
});

describe("formatDueDate", () => {
  const today = "2026-08-28";

  it("今天和明天用文字", () => {
    expect(formatDueDate(parseDateInput("2026-08-28")!, today)).toBe("今天");
    expect(formatDueDate(parseDateInput("2026-08-29")!, today)).toBe("明天");
  });

  it("跨月跨年", () => {
    expect(formatDueDate(parseDateInput("2026-09-01")!, today)).toBe("09/01");
    expect(formatDueDate(parseDateInput("2027-01-05")!, today)).toBe("2027-01-05");
  });
});

describe("addDays", () => {
  it("跨月和跨年都对", () => {
    expect(addDays("2026-08-28", 7)).toBe("2026-09-04");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-08-28", -1)).toBe("2026-08-27");
  });
});
