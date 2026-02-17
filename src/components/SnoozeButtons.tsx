import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const INTERVALS = [
  { minutes: 15, label: "15m" },
  { minutes: 30, label: "30m" },
  { minutes: 60, label: "1h" },
  { minutes: 120, label: "2h" },
] as const;

export function SnoozeButtons({ taskId }: { taskId: Id<"tasks"> }) {
  const snooze = useMutation(api.tasks.snooze);

  return (
    <div className="flex flex-wrap gap-2">
      {INTERVALS.map(({ minutes, label }) => (
        <button
          key={minutes}
          type="button"
          onClick={() => snooze({ taskId, minutes })}
          className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] text-sm font-medium min-h-[44px] hover:bg-[var(--border)]"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
