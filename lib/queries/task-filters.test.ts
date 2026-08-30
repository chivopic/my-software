import { describe, expect, it } from "vitest";

import { buildTaskWhere, parseTaskView, taskOrderBy } from "@/lib/queries/task-filters";

const TODAY = "2026-08-28";
const args = { today: TODAY } as const;

describe("parseTaskView", () => {
  it("认识所有合法视图", () => {
    expect(parseTaskView("today")).toBe("today");
    expect(parseTaskView("completed")).toBe("completed");
  });

  it("非法或缺省一律回到看板", () => {
    expect(parseTaskView(undefined)).toBe("board");
    expect(parseTaskView("")).toBe("board");
    expect(parseTaskView("../../etc/passwd")).toBe("board");
  });
});

describe("buildTaskWhere", () => {
  it("每个视图都带上 userId 和软删除过滤", () => {
    for (const view of ["board", "list", "inbox", "today", "upcoming", "completed"] as const) {
      const where = buildTaskWhere("u1", { view, ...args });
      expect(where.userId).toBe("u1");
      expect(where.deletedAt).toBeNull();
    }
  });

  it("inbox 只要 INBOX", () => {
    expect(buildTaskWhere("u1", { view: "inbox", ...args }).status).toBe("INBOX");
  });

  it("today：今天或更早到期，且未完成（逾期的也算今天的事）", () => {
    const where = buildTaskWhere("u1", { view: "today", ...args });
    expect(where.status).toEqual({ in: ["INBOX", "TODO", "DOING"] });
    expect(where.dueDate).toEqual({ lte: new Date("2026-08-28T00:00:00.000Z") });
  });

  it("upcoming：今天之后到未来 7 天，不含今天", () => {
    const where = buildTaskWhere("u1", { view: "upcoming", ...args });
    expect(where.dueDate).toEqual({
      gt: new Date("2026-08-28T00:00:00.000Z"),
      lte: new Date("2026-09-04T00:00:00.000Z"),
    });
  });

  it("today 和 upcoming 的区间不重叠也不留缝", () => {
    const today = buildTaskWhere("u1", { view: "today", ...args }).dueDate as { lte: Date };
    const upcoming = buildTaskWhere("u1", { view: "upcoming", ...args }).dueDate as { gt: Date };
    expect(today.lte.getTime()).toBe(upcoming.gt.getTime());
  });

  it("completed 只要 DONE，且不限时间（看板才只看 7 天）", () => {
    const where = buildTaskWhere("u1", { view: "completed", ...args });
    expect(where.status).toBe("DONE");
    expect(where.completedAt).toBeUndefined();
  });

  it("board 和 list 不加状态条件", () => {
    expect(buildTaskWhere("u1", { view: "board", ...args }).status).toBeUndefined();
    expect(buildTaskWhere("u1", { view: "list", ...args }).status).toBeUndefined();
  });

  it("标签筛选可以叠加在任何视图上", () => {
    const where = buildTaskWhere("u1", { view: "today", tag: "ai-infra", ...args });
    expect(where.tags).toEqual({ some: { tag: { slug: "ai-infra" } } });
    expect(where.status).toEqual({ in: ["INBOX", "TODO", "DOING"] });
  });

  it("跨月的今天，upcoming 区间也对", () => {
    const where = buildTaskWhere("u1", { view: "upcoming", today: "2026-12-29" });
    expect(where.dueDate).toEqual({
      gt: new Date("2026-12-29T00:00:00.000Z"),
      lte: new Date("2027-01-05T00:00:00.000Z"),
    });
  });
});

describe("taskOrderBy", () => {
  it("已完成按完成时间倒序", () => {
    expect(taskOrderBy("completed")).toEqual([{ completedAt: "desc" }]);
  });

  it("其余视图先按截止日期升序，没有截止日期的排最后", () => {
    expect(taskOrderBy("today")[0]).toEqual({ dueDate: { sort: "asc", nulls: "last" } });
  });
});
