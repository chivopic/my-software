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
