"use client";

import { useState, useTransition } from "react";

import { createTaskAction, updateTaskAction } from "@/app/tasks/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TagInput } from "@/components/ui/tag-input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import type { BoardTask } from "@/lib/queries/tasks";
import { toDateInputValue } from "@/lib/utils/date";
import {
  PRIORITY_LABEL,
  STATUS_LABEL,
  STATUS_ORDER,
  type TaskPriorityValue,
  type TaskStatusValue,
} from "@/lib/validation/task";

type FormValues = {
  title: string;
  description: string;
  status: TaskStatusValue;
  priority: TaskPriorityValue;
  dueDate: string;
  tags: string[];
};

const PRIORITIES: TaskPriorityValue[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function emptyValues(status: TaskStatusValue): FormValues {
  return { title: "", description: "", status, priority: "MEDIUM", dueDate: "", tags: [] };
}

function TaskDialog({
  open,
  onClose,
  heading,
  initial,
  tagSuggestions,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  heading: string;
  initial: FormValues;
  tagSuggestions: string[];
  onSubmit: (values: FormValues) => Promise<string | null>;
}) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <Dialog open={open} onClose={onClose} title={heading}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const message = await onSubmit(values);
            if (message) {
              setError(message);
              return;
            }
            setError(null);
            onClose();
          });
        }}
        className="flex flex-col gap-3"
      >
        <h2 className="text-foreground font-semibold">{heading}</h2>

        <Input
          value={values.title}
          onChange={(event) => set("title", event.target.value)}
          placeholder="要做什么？"
          aria-label="任务标题"
          autoFocus
          required
        />

        <Textarea
          value={values.description}
          onChange={(event) => set("description", event.target.value)}
          placeholder="补充说明（可选）"
          aria-label="任务描述"
          rows={3}
        />

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-muted text-xs">状态</span>
            <Select
              value={values.status}
              onChange={(event) => set("status", event.target.value as TaskStatusValue)}
              aria-label="状态"
            >
              {STATUS_ORDER.map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABEL[value]}
                </option>
              ))}
            </Select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-muted text-xs">优先级</span>
            <Select
              value={values.priority}
              onChange={(event) => set("priority", event.target.value as TaskPriorityValue)}
              aria-label="优先级"
            >
              {PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {PRIORITY_LABEL[value]}
                </option>
              ))}
            </Select>
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-muted text-xs">截止日期</span>
          <Input
            type="date"
            value={values.dueDate}
            onChange={(event) => set("dueDate", event.target.value)}
            aria-label="截止日期"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-muted text-xs">标签</span>
          <TagInput
            value={values.tags}
            onChange={(next) => set("tags", next)}
            suggestions={tagSuggestions}
          />
        </label>

        {error ? <p className="text-danger text-xs">{error}</p> : null}

        <div className="mt-1 flex justify-end gap-2">
          <Button onClick={onClose} disabled={pending}>
            取消
          </Button>
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "保存中…" : "保存"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export function NewTaskButton({
  status = "INBOX",
  tagSuggestions,
  label = "新建任务",
}: {
  status?: TaskStatusValue;
  tagSuggestions: string[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const toast = useToast();

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
      {open ? (
        <TaskDialog
          open={open}
          onClose={() => setOpen(false)}
          heading="新建任务"
          initial={emptyValues(status)}
          tagSuggestions={tagSuggestions}
          onSubmit={async (values) => {
            const result = await createTaskAction(values);
            if (!result.ok) return result.error;
            toast({ message: `已创建「${values.title}」` });
            return null;
          }}
        />
      ) : null}
    </>
  );
}

export function EditTaskButton({
  task,
  tagSuggestions,
}: {
  task: BoardTask;
  tagSuggestions: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`编辑「${task.title}」`}
        className="text-muted hover:text-foreground cursor-pointer text-xs transition-colors"
      >
        编辑
      </button>
      {open ? (
        <TaskDialog
          open={open}
          onClose={() => setOpen(false)}
          heading="编辑任务"
          initial={{
            title: task.title,
            description: task.description ?? "",
            status: task.status,
            priority: task.priority,
            dueDate: toDateInputValue(task.dueDate),
            tags: task.tags.map(({ tag }) => tag.name),
          }}
          tagSuggestions={tagSuggestions}
          onSubmit={async (values) => {
            const result = await updateTaskAction(task.id, values);
            return result.ok ? null : result.error;
          }}
        />
      ) : null}
    </>
  );
}
