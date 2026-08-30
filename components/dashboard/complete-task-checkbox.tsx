"use client";

import { useTransition } from "react";

import { setTaskStatusAction } from "@/app/tasks/actions";
import { useToast } from "@/components/ui/toast";

/** Dashboard 上直接勾完成。 */
export function CompleteTaskCheckbox({ taskId, title }: { taskId: string; title: string }) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  return (
    <input
      type="checkbox"
      disabled={pending}
      aria-label={`标记「${title}」为完成`}
      className="accent-accent size-4 cursor-pointer"
      onChange={() => {
        startTransition(async () => {
          const result = await setTaskStatusAction(taskId, "DONE");
          toast({ message: result.ok ? `已完成「${title}」` : result.error });
        });
      }}
    />
  );
}
