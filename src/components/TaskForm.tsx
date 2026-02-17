import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function TaskForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("12:00");
  const createTask = useMutation(api.tasks.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const due = new Date(`${dueDate}T${dueTime}`);
    if (isNaN(due.getTime())) return;
    await createTask({
      title: title.trim(),
      description: description.trim() || undefined,
      dueAt: due.getTime(),
    });
    setTitle("");
    setDescription("");
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] placeholder-[var(--muted)] min-h-[44px]"
      />
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] placeholder-[var(--muted)] resize-none"
      />
      <div className="flex gap-2">
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          min={today}
          className="flex-1 px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] min-h-[44px]"
        />
        <input
          type="time"
          value={dueTime}
          onChange={(e) => setDueTime(e.target.value)}
          className="flex-1 px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] min-h-[44px]"
        />
      </div>
      <button
        type="submit"
        className="w-full py-3 rounded-lg bg-[var(--accent)] text-white font-medium min-h-[44px] hover:opacity-90"
      >
        Add Task
      </button>
    </form>
  );
}
