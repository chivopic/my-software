import type { Metadata } from "next";

import { DailyBriefPlaceholder } from "@/components/dashboard/daily-brief-placeholder";
import { Greeting } from "@/components/dashboard/greeting";
import { RecentNotes } from "@/components/dashboard/recent-notes";
import { StatRow } from "@/components/dashboard/stat-row";
import { TodayFocus } from "@/components/dashboard/today-focus";
import { TodaySchedule } from "@/components/dashboard/today-schedule";
import { getCurrentUser } from "@/lib/current-user";
import {
  getDashboardStats,
  getRecentNotes,
  getTodayFocus,
  getTodaySchedule,
} from "@/lib/queries/dashboard";
import { todayInTimeZone } from "@/lib/utils/date";

export const metadata: Metadata = { title: "Dashboard · Personal Workbench" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const today = todayInTimeZone(user.timezone);

  const [stats, focus, schedule, notes] = await Promise.all([
    getDashboardStats(user.id, today),
    getTodayFocus(user.id, today),
    getTodaySchedule(user.id, today),
    getRecentNotes(user.id),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <Greeting timeZone={user.timezone} today={today} />
      <StatRow stats={stats} />

      <div className="grid gap-4 xl:grid-cols-2">
        <TodayFocus tasks={focus} today={today} />
        <TodaySchedule tasks={schedule} timeZone={user.timezone} />
        <RecentNotes notes={notes} timeZone={user.timezone} />
        <DailyBriefPlaceholder />
      </div>
    </div>
  );
}
