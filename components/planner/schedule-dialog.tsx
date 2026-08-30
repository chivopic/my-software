"use client";

import { useState, useTransition } from "react";

import { scheduleTaskAction } from "@/app/planner/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import type { PlannerTask } from "@/lib/queries/planner";

export function ScheduleDialog({
  day,
  hour,
  candidates,
  onClose,
}: {
  day: string;
  hour: number;
  candidates: PlannerTask[];
  onClose: () => void;
}) {
  const [taskId, setTaskId] = useState(candidates[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const label = `${String(hour).padStart(2, "0")}:00`;

  return (
    <Dialog open onClose={onClose} title={`排到 ${label}`}>
      <div className="flex flex-col gap-3">
        <h2 className="text-foreground font-semibold">
          排到 {day} {label}
        </h2>

        {candidates.length === 0 ? (
          <p className="text-muted">
            没有待排期的任务。Planner 只排 Todo 和 Doing 状态、且还没排期的任务。
          </p>
        ) : (
          <label className="flex flex-col gap-1">
            <span className="text-muted text-xs">选择任务</span>
            <Select
              value={taskId}
              onChange={(event) => setTaskId(event.target.value)}
              aria-label="选择任务"
            >
              {candidates.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </Select>
          </label>
        )}

        {error ? <p className="text-danger text-xs">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <Button onClick={onClose} disabled={pending}>
            取消
          </Button>
          <Button
            variant="primary"
            disabled={pending || !taskId}
            onClick={() => {
              startTransition(async () => {
                const result = await scheduleTaskAction({ taskId, day, hour });
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                toast({ message: `已排到 ${label}` });
                onClose();
              });
            }}
          >
            {pending ? "排期中…" : "确定"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
