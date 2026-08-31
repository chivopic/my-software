"use client";

import { useState, useTransition } from "react";

import { unscheduleTaskAction } from "@/app/planner/actions";
import { ScheduleDialog } from "@/components/planner/schedule-dialog";
import { useToast } from "@/components/ui/toast";
import type { PlannerTask } from "@/lib/queries/planner";
import { cn } from "@/lib/utils/cn";
import { formatTime } from "@/lib/utils/date";
import { TIMELINE_END_HOUR, TIMELINE_START_HOUR } from "@/lib/validation/planner";

const HOURS = Array.from(
  { length: TIMELINE_END_HOUR - TIMELINE_START_HOUR },
  (_, index) => TIMELINE_START_HOUR + index,
);

export function DayTimeline({
  day,
  scheduled,
  unscheduled,
  timeZone,
  hourOf,
}: {
  day: string;
  scheduled: PlannerTask[];
  unscheduled: PlannerTask[];
  timeZone: string;
  /** 服务端算好的「任务 → 用户时区小时」，避免客户端再做一次时区换算 */
  hourOf: Record<string, number>;
}) {
  const [pickerHour, setPickerHour] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  function unschedule(task: PlannerTask) {
    startTransition(async () => {
      const result = await unscheduleTaskAction(task.id);
      toast({ message: result.ok ? `已取消「${task.title}」的排期` : result.error });
    });
  }

  return (
    <>
      <ol className="border-border bg-surface divide-border divide-y overflow-hidden rounded-lg border">
        {HOURS.map((hour) => {
          const blocks = scheduled.filter((task) => hourOf[task.id] === hour);

          return (
            <li key={hour} className="flex min-h-12 items-stretch">
              <span className="text-muted w-16 shrink-0 px-3 py-2 font-mono text-xs">
                {String(hour).padStart(2, "0")}:00
              </span>

              <div className="flex min-w-0 flex-1 items-stretch gap-2 py-1.5 pr-2">
                {blocks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "border-accent/40 bg-accent/10 flex min-w-0 flex-1 items-center gap-2 rounded-md border px-2.5 py-1.5",
                      task.status === "DONE" && "opacity-60",
                    )}
                  >
                    <span
                      className={cn(
                        "text-foreground min-w-0 flex-1 truncate",
                        task.status === "DONE" && "line-through",
                      )}
                    >
                      {task.title}
                    </span>
                    <span className="text-muted shrink-0 font-mono text-[11px]">
                      {task.scheduledStart ? formatTime(task.scheduledStart, timeZone) : ""}
                      {task.scheduledEnd ? `–${formatTime(task.scheduledEnd, timeZone)}` : ""}
                    </span>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => unschedule(task)}
                      aria-label={`取消「${task.title}」的排期`}
                      className="text-muted hover:text-danger shrink-0 cursor-pointer text-xs"
                    >
                      取消
                    </button>
                  </div>
                ))}

                {blocks.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => setPickerHour(hour)}
                    aria-label={`在 ${String(hour).padStart(2, "0")}:00 排一个任务`}
                    className="text-muted hover:bg-surface-hover hover:text-foreground flex-1 cursor-pointer rounded-md text-left text-xs opacity-0 transition hover:opacity-100 focus-visible:opacity-100"
                  >
                    <span className="px-2">+ 排一个任务</span>
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {pickerHour !== null ? (
        <ScheduleDialog
          day={day}
          hour={pickerHour}
          candidates={unscheduled}
          onClose={() => setPickerHour(null)}
        />
      ) : null}
    </>
  );
}
