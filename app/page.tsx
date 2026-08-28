const milestones = [
  { id: "V0-01", title: "项目骨架", done: true },
  { id: "V0-02", title: "Prisma + Postgres", done: false },
  { id: "V0-03", title: "布局与基础组件", done: false },
  { id: "V0-04", title: "Notes CRUD", done: false },
  { id: "V0-08", title: "Tasks 看板", done: false },
  { id: "V0-11", title: "Planner 单日视图", done: false },
  { id: "V0-12", title: "Dashboard", done: false },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-2">
        <p className="text-muted text-xs tracking-[0.2em] uppercase">V0 · 骨架</p>
        <h1 className="text-foreground text-2xl font-semibold">Personal Workbench</h1>
        <p className="text-muted">
          把笔记、任务、计划和信息流集中到一个地方的个人工作台。这里是首页占位，Dashboard 在 V0-12
          落地。
        </p>
      </div>

      <ul className="border-border divide-border divide-y rounded-lg border">
        {milestones.map((m) => (
          <li key={m.id} className="flex items-center gap-3 px-4 py-3">
            <span
              aria-hidden
              className={
                m.done
                  ? "bg-accent size-2 rounded-full"
                  : "border-border size-2 rounded-full border"
              }
            />
            <span className="text-muted font-mono text-xs">{m.id}</span>
            <span className="text-foreground">{m.title}</span>
            <span className="text-muted ml-auto text-xs">{m.done ? "已完成" : "待办"}</span>
          </li>
        ))}
      </ul>

      <p className="text-muted text-xs">
        规范见 <code className="font-mono">AGENTS.md</code>，需求见{" "}
        <code className="font-mono">docs/01-v0-prd.md</code>。
      </p>
    </main>
  );
}
