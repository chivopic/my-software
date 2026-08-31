import { createNoteAction } from "@/app/notes/actions";
import { Button } from "@/components/ui/button";

/**
 * 用 form + Server Action 而不是链接到 /notes/new：
 * 新建是写操作，走 GET 会被 Link 预取误触发。
 */
export function NewNoteButton() {
  return (
    <form action={createNoteAction}>
      <Button type="submit" variant="primary" size="sm">
        新建笔记
      </Button>
    </form>
  );
}
