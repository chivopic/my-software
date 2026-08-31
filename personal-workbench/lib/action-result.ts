/**
 * 所有 Server Action 的统一返回形状（见 docs/02 第 5 节）。
 * action 层不把异常抛给 UI，一律转成 ok: false。
 */
export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

export function ok(): ActionResult;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

export function fail(error: string): ActionResult<never> {
  return { ok: false, error };
}
