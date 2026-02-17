import type { Id } from "../../convex/_generated/dataModel";

type Task = {
  _id: Id<"tasks">;
  title: string;
  description?: string;
  status: string;
  dueAt: number;
};

export function TaskCard({ task }: { task: Task }) {
  const due = new Date(task.dueAt).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
  return (
    <div
      className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] active:opacity-90"
      role="button"
    >
      <div className="flex justify-between items-start">
        <h3 className="font-medium text-[var(--text)]">{task.title}</h3>
        {task.status === "completed" && (
          <span className="text-xs text-green-600 dark:text-green-400">Done</span>
        )}
      </div>
      {task.description && (
        <p className="text-sm text-[var(--muted)] mt-1 line-clamp-2">
          {task.description}
        </p>
      )}
      <p className="text-xs text-[var(--muted)] mt-2">Due: {due}</p>
    </div>
  );
}
