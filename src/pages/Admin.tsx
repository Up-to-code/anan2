import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Admin() {
  const users = useQuery(api.admin.listAllUsers) ?? [];
  const sendTest = useAction(api.admin.sendTestNotification);
  const [sending, setSending] = useState(false);

  const handleSendTest = async (userId: string) => {
    setSending(true);
    try {
      await sendTest({ userId });
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold text-[var(--text)] mb-6">
        Admin
      </h1>
      <div className="space-y-6">
        {users.length === 0 ? (
          <p className="text-[var(--muted)]">
            No users with push subscriptions yet.
          </p>
        ) : (
          <ul className="space-y-4">
            {users.map(({ userId, channels }: { userId: string; channels: string[] }) => (
              <li
                key={userId}
                className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]"
              >
                <div className="flex justify-between items-center mb-2">
                  <code className="text-sm text-[var(--muted)] truncate max-w-[180px]">
                    {userId}
                  </code>
                  <button
                    onClick={() => handleSendTest(userId)}
                    disabled={sending}
                    className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium min-h-[44px] disabled:opacity-50"
                  >
                    Send test
                  </button>
                </div>
                <p className="text-xs text-[var(--muted)]">
                  Channels: {channels.length ? channels.join(", ") : "none"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
