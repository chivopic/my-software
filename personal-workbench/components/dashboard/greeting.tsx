import { hourInTimeZone } from "@/lib/utils/date";

function greetingFor(hour: number): string {
  if (hour < 5) return "还没睡？";
  if (hour < 12) return "早上好";
  if (hour < 18) return "下午好";
  return "晚上好";
}

export function Greeting({ timeZone, today }: { timeZone: string; today: string }) {
  const hour = hourInTimeZone(new Date(), timeZone);
  const weekday = new Intl.DateTimeFormat("zh-CN", { timeZone: "UTC", weekday: "long" }).format(
    new Date(`${today}T00:00:00.000Z`),
  );

  return (
    <div>
      {/* 页面级 h1 在 Topbar，这里用 h2，一页只留一个 h1 */}
      <h2 className="text-foreground text-xl font-semibold">{greetingFor(hour)}</h2>
      <p className="text-muted text-xs">
        {today} {weekday}
      </p>
    </div>
  );
}
