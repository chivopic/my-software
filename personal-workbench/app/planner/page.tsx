import type { Metadata } from "next";
import Link from "next/link";

import { DayTimeline } from "@/components/planner/day-timeline";
import { UnscheduledDrawer } from "@/components/planner/unscheduled-drawer";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/current-user";
import { getPlannerDay, getUnscheduledTasks } from "@/lib/queries/planner";
import { addDays, hourInTimeZone, todayInTimeZone } from "@/lib/utils/date";
import { daySchema } from "@/lib/validation/planner";

// 读当前用户的实时数据，必须按需渲染：否则 next build 会在构建时连数据库，
// 构建环境（比如 Vercel）通常没有数据库，部署会直接失败。
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Planner · Personal Workbench" };

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await getCurrentUser();
  const today = todayInTimeZone(user.timezone);

  const parsed = daySchema.safeParse((await searchParams).date ?? today);
  const day = parsed.success ? parsed.data : today;

  const [scheduled, unscheduled] = await Promise.all([
    getPlannerDay(user.id, day),
    getUnscheduledTasks(user.id),
  ]);

  // 时区换算放在服务端做一次，客户端组件只按小时分组
  const hourOf = Object.fromEntries(
    scheduled.map((task) => [
      task.id,
      task.scheduledStart ? hourInTimeZone(task.scheduledStart, user.timezone) : -1,
    ]),
  );

  const weekday = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "UTC",
    weekday: "long",
  }).format(new Date(`${day}T00:00:00.000Z`));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={`/planner?date=${addDays(day, -1)}`} aria-label="前一天">
            <Button size="icon" aria-hidden>
              ←
            </Button>
          </Link>
          <div>
            <p className="text-foreground font-medium">
              {day} <span className="text-muted text-xs">{weekday}</span>
            </p>
            {day !== today ? <p className="text-muted text-xs">今天是 {today}</p> : null}
          </div>
          <Link href={`/planner?date=${addDays(day, 1)}`} aria-label="后一天">
            <Button size="icon" aria-hidden>
              →
            </Button>
          </Link>
          {day !== today ? (
            <Link href="/planner">
              <Button size="sm">回到今天</Button>
            </Link>
          ) : null}
        </div>

        <p className="text-muted text-xs">
          {scheduled.length > 0 ? `这天排了 ${scheduled.length} 个任务` : "这天还没有排期"}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <DayTimeline
          day={day}
          scheduled={scheduled}
          unscheduled={unscheduled}
          timeZone={user.timezone}
          hourOf={hourOf}
        />
        <UnscheduledDrawer tasks={unscheduled} today={today} />
      </div>
    </div>
  );
}
