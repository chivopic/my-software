/**
 * 标签 slug：小写、空白转连字符、去掉标点。中日韩字符原样保留，
 * 这样「AI Infra」→ ai-infra，「算法」→ 算法，都能作为 URL 参数用。
 */
export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{Letter}\p{Number}-]+/gu, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}
