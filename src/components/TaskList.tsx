import { Link } from "react-router-dom";
import type { Id } from "../../convex/_generated/dataModel";
import { TaskCard } from "./TaskCard";

type Task = {
  _id: Id<"tasks">;
  title: string;
  description?: string;
  status: string;
  dueAt: number;
  createdAt: number;
};

export function TaskList({ tasks }: { tasks: Task[] }) {
  const pending = tasks.filter((t) => t.status === "pending");
  const completed = tasks.filter((t) => t.status === "completed");
  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-[var(--muted)] mb-3">
            Pending
          </h2>
          <ul className="space-y-2">
            {pending.map((t) => (
              <li key={t._id}>
                <Link to={`/task/${t._id}`}>
                  <TaskCard task={t} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {completed.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-[var(--muted)] mb-3">
            Completed
          </h2>
          <ul className="space-y-2">
            {completed.map((t) => (
              <li key={t._id}>
                <Link to={`/task/${t._id}`}>
                  <TaskCard task={t} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {tasks.length === 0 && (
        <p className="text-center text-[var(--muted)] py-12">
          No tasks yet. Create one below.
        </p>
      )}
    </div>
  );
}
