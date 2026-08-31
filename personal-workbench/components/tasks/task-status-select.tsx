"use client";

import { useTransition } from "react";

import { setTaskStatusAction } from "@/app/tasks/actions";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { STATUS_LABEL, STATUS_ORDER, type TaskStatusValue } from "@/lib/validation/task";

export function TaskStatusSelect({
  taskId,
  status,
  title,
}: {
  taskId: string;
  status: TaskStatusValue;
  title: string;
}) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  return (
    <Select
      value={status}
      disabled={pending}
      aria-label={`「${title}」的状态`}
      className="h-7 w-24 text-xs"
      onChange={(event) => {
        const next = event.target.value;
        startTransition(async () => {
          const result = await setTaskStatusAction(taskId, next);
          if (!result.ok) toast({ message: result.error });
        });
      }}
    >
      {STATUS_ORDER.map((value) => (
        <option key={value} value={value}>
          {STATUS_LABEL[value]}
        </option>
      ))}
    </Select>
  );
}
