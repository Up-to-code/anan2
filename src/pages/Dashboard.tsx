import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { TaskList } from "../components/TaskList";
import { TaskForm } from "../components/TaskForm";

export default function Dashboard() {
  const tasks = useQuery(api.tasks.list);

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold text-[var(--text)] mb-6">
        Tasks
      </h1>
      <div className="mb-8">
        <TaskForm />
      </div>
      <TaskList tasks={tasks ?? []} />
    </main>
  );
}
