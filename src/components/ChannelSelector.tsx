import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const CHANNELS = [
  { id: "snapchat", label: "Snapchat" },
  { id: "tiktok", label: "TikTok" },
  { id: "instagram", label: "Instagram" },
];

export function ChannelSelector() {
  const channels = useQuery(api.channels.getMine) ?? [];
  const updateChannels = useMutation(api.channels.updateMine);
  const [selected, setSelected] = useState<Set<string>>(new Set(channels));

  useEffect(() => {
    setSelected(new Set(channels));
  }, [channels]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
    updateChannels({ channels: [...next] });
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[var(--muted)]">
        Select channels for content
      </p>
      <div className="flex flex-wrap gap-2">
        {CHANNELS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => toggle(id)}
            className={`px-4 py-2 rounded-lg border min-h-[44px] font-medium ${
              selected.has(id)
                ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                : "bg-[var(--card)] text-[var(--text)] border-[var(--border)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
