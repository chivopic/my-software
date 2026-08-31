"use client";

import { useTransition } from "react";

import { deleteTaskAction, restoreTaskAction } from "@/app/tasks/actions";
import { useToast } from "@/components/ui/toast";

export function DeleteTaskButton({ taskId, title }: { taskId: string; title: string }) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`删除「${title}」`}
      className="text-muted hover:text-danger cursor-pointer text-xs transition-colors"
      onClick={() => {
        startTransition(async () => {
          const result = await deleteTaskAction(taskId);
          if (!result.ok) {
            toast({ message: result.error });
            return;
          }
          toast({
            message: `已删除「${title}」`,
            action: {
              label: "撤销",
              onClick: () => {
                startTransition(async () => {
                  const restored = await restoreTaskAction(taskId);
                  if (!restored.ok) toast({ message: restored.error });
                });
              },
            },
          });
        });
      }}
    >
      删除
    </button>
  );
}
