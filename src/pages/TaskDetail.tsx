import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SnoozeButtons } from "../components/SnoozeButtons";
import type { Id } from "../../convex/_generated/dataModel";

export default function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const task = useQuery(
    api.tasks.getById,
    taskId ? { taskId: taskId as Id<"tasks"> } : "skip"
  );
  const completeTask = useMutation(api.tasks.complete);

  const handleComplete = async () => {
    if (!task) return;
    await completeTask({ taskId: task._id });
    navigate("/");
  };

  if (task === undefined) {
    return (
      <main className="max-w-lg mx-auto px-4 py-6">
        <p className="text-[var(--muted)]">Loading...</p>
      </main>
    );
  }
  if (task === null) {
    return (
      <main className="max-w-lg mx-auto px-4 py-6">
        <p className="text-[var(--muted)]">Task not found.</p>
      </main>
    );
  }

  const due = new Date(task.dueAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-[var(--text)]">
          {task.title}
        </h1>
        {task.description && (
          <p className="text-[var(--muted)]">{task.description}</p>
        )}
        <p className="text-sm text-[var(--muted)]">Due: {due}</p>

        {task.status === "pending" && (
          <>
            <div>
              <p className="text-sm font-medium text-[var(--muted)] mb-2">
                Snooze
              </p>
              <SnoozeButtons taskId={task._id as Id<"tasks">} />
            </div>
            <button
              onClick={handleComplete}
              className="w-full py-3 rounded-lg bg-green-600 text-white font-medium min-h-[44px] hover:opacity-90"
            >
              Mark complete
            </button>
          </>
        )}

        {task.status === "completed" && (
          <p className="text-green-600 dark:text-green-400 font-medium">
            Completed
          </p>
        )}
      </div>
    </main>
  );
}
