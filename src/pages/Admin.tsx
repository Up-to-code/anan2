import { useState, useRef, useEffect } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

type UserItem = {
  userId: string;
  email?: string;
  name?: string;
  channels: string[];
  hasPushSubscription?: boolean;
};

export default function Admin() {
  const users = useQuery(api.admin.listAllUsers) ?? [];
  const settings = useQuery(api.admin.getSettings) ?? {};
  const documents = useQuery(api.admin.listDocuments) ?? [];
  const sendTest = useAction(api.admin.sendTestNotification);
  const createTask = useMutation(api.admin.createTask);
  const updateSettings = useMutation(api.admin.updateSettings);
  const generateUploadUrl = useMutation(api.admin.generateUploadUrl);
  const ingestDocument = useAction(api.ingestDocument.ingest);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [assigneeId, setAssigneeId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("12:00");
  const [dailyPostTime, setDailyPostTime] = useState("09:00");
  const [timezone, setTimezone] = useState("America/New_York");

  useEffect(() => {
    if (settings.dailyPostTime) setDailyPostTime(settings.dailyPostTime as string);
    if (settings.timezone) setTimezone(settings.timezone as string);
  }, [settings.dailyPostTime, settings.timezone]);

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

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigneeId || !title.trim()) return;
    const due = new Date(`${dueDate}T${dueTime}`);
    if (isNaN(due.getTime())) return;
    setCreating(true);
    try {
      await createTask({
        assigneeId,
        title: title.trim(),
        description: description.trim() || undefined,
        dueAt: due.getTime(),
      });
      setTitle("");
      setDescription("");
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await updateSettings({ dailyPostTime, timezone });
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "md", "txt"].includes(ext ?? "")) {
      alert("Only PDF, MD, and TXT files are supported.");
      return;
    }
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { storageId } = await res.json();
      await ingestDocument({ storageId, name: file.name });
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error(err);
      alert("Upload failed. Check console.");
    } finally {
      setUploading(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const userItems = users as UserItem[];

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold text-[var(--text)] mb-6">
        Admin
      </h1>
      <div className="space-y-8">
        <section>
          <h2 className="text-base font-medium text-[var(--text)] mb-4">
            Daily Post Schedule
          </h2>
          <form onSubmit={handleSaveSettings} className="space-y-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">
                Time
              </label>
              <input
                type="time"
                value={dailyPostTime}
                onChange={(e) => setDailyPostTime(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] min-h-[44px]"
              >
                <option value="America/New_York">America/New_York</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Europe/Paris">Europe/Paris</option>
                <option value="Asia/Dubai">Asia/Dubai</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={savingSettings}
              className="w-full py-3 rounded-lg bg-[var(--accent)] text-white font-medium min-h-[44px] hover:opacity-90 disabled:opacity-50"
            >
              {savingSettings ? "Saving..." : "Save settings"}
            </button>
          </form>
          <p className="text-xs text-[var(--muted)] mt-2">
            Daily workflow creates &quot;Post to [channel] today&quot; tasks for users with channels at this time.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-[var(--text)] mb-4">
            Knowledge Base (RAG)
          </h2>
          <p className="text-sm text-[var(--muted)] mb-4">
            Upload PDF, MD, or TXT files. The AI uses this content when generating social posts.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.md,.txt"
            onChange={handleDocumentUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full py-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] font-medium min-h-[44px] hover:opacity-90 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload document"}
          </button>
          {documents.length > 0 && (
            <ul className="mt-4 space-y-2">
              {documents.map((d) => (
                <li
                  key={d._id}
                  className="text-sm text-[var(--muted)] flex items-center gap-2"
                >
                  <span>{d.name}</span>
                  <span className="text-xs">
                    {new Date(d.uploadedAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-base font-medium text-[var(--text)] mb-4">
            Create Task
          </h2>
          <form onSubmit={handleCreateTask} className="space-y-3">
            <label className="block text-sm text-[var(--muted)]">
              Assign to
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] min-h-[44px]"
            >
              <option value="">Select user...</option>
              {userItems.map((u) => (
                <option key={u.userId} value={u.userId}>
                  {u.email || u.name || u.userId}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
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
                required
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
              disabled={creating}
              className="w-full py-3 rounded-lg bg-[var(--accent)] text-white font-medium min-h-[44px] hover:opacity-90 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Task"}
            </button>
          </form>
        </section>

        <section>
          <h2 className="text-base font-medium text-[var(--text)] mb-4">
            Users
          </h2>
          {userItems.length === 0 ? (
            <p className="text-[var(--muted)]">
              No users yet. Users appear after signing up.
            </p>
          ) : (
            <ul className="space-y-4">
              {userItems.map((u) => (
                <li
                  key={u.userId}
                  className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="font-medium text-[var(--text)]">
                        {u.email || u.name || u.userId.slice(0, 12) + "..."}
                      </p>
                      {u.email && u.name && (
                        <p className="text-xs text-[var(--muted)]">{u.email}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleSendTest(u.userId)}
                      disabled={sending || !u.hasPushSubscription}
                      className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send test
                    </button>
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    Channels: {u.channels.length ? u.channels.join(", ") : "none"}
                    {!u.hasPushSubscription && " • No push subscription"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
