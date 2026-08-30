/**
 * 时间格式化统一走这里：数据库存 UTC，展示按用户时区。
 * 用 Intl 而不是 date-fns，是因为要按 IANA 时区格式化，date-fns 本体做不到。
 */
export function formatDateTime(date: Date, timeZone: string, now: Date = new Date()): string {
  const sameYear = yearIn(date, timeZone) === yearIn(now, timeZone);
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone,
    year: sameYear ? undefined : "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function yearIn(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric" }).format(date);
}

/** 列表里的正文摘要：去掉 Markdown 标记，压平空白，截断。 */
export function excerpt(markdown: string, length = 120): string {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}[-*+]\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  return plain.length > length ? `${plain.slice(0, length)}…` : plain;
}

/** 用户时区下的「今天」，YYYY-MM-DD。所有“今天/过期/本周”的判断都以它为准。 */
export function todayInTimeZone(timeZone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** <input type="date"> 的值 → @db.Date 字段要存的 Date（UTC 零点）。 */
export function parseDateInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** @db.Date 字段 → <input type="date"> 的值。这类字段不做时区换算，直接读 UTC。 */
export function toDateInputValue(date: Date | null | undefined): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

/** 日期字段（@db.Date）按用户时区的今天来判断是否过期。 */
export function isOverdue(dueDate: Date | null | undefined, today: string): boolean {
  return dueDate ? toDateInputValue(dueDate) < today : false;
}

/** 把 @db.Date 显示成「今天 / 明天 / 08/30」。 */
export function formatDueDate(dueDate: Date, today: string): string {
  const value = toDateInputValue(dueDate);
  if (value === today) return "今天";

  const tomorrow = new Date(`${today}T00:00:00.000Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  if (value === toDateInputValue(tomorrow)) return "明天";

  const sameYear = value.slice(0, 4) === today.slice(0, 4);
  return sameYear ? value.slice(5).replace("-", "/") : value;
}

/** today 之后第 n 天，YYYY-MM-DD。用于 upcoming 这类区间。 */
export function addDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateInputValue(date);
}
