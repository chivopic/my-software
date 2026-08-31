"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { deleteNoteAction, restoreNoteAction } from "@/app/notes/actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function DeleteNoteButton({
  noteId,
  title,
  redirectToList = false,
}: {
  noteId: string;
  title: string;
  redirectToList?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteNoteAction(noteId);
      if (!result.ok) {
        toast({ message: result.error });
        return;
      }

      // 软删除，所以不做二次确认，改为在 toast 里给撤销（见 docs/02 第 6 节）
      toast({
        message: `已删除「${title}」`,
        action: {
          label: "撤销",
          onClick: () => {
            startTransition(async () => {
              const restored = await restoreNoteAction(noteId);
              if (!restored.ok) toast({ message: restored.error });
            });
          },
        },
      });

      if (redirectToList) router.push("/notes");
    });
  }

  return (
    <Button
      variant="danger"
      size="sm"
      onClick={handleDelete}
      disabled={pending}
      aria-label={`删除「${title}」`}
    >
      删除
    </Button>
  );
}
