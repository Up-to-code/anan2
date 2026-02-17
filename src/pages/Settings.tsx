import { ChannelSelector } from "../components/ChannelSelector";
import { ThemeToggle } from "../components/ThemeToggle";
import { usePushNotifications } from "../hooks/usePushNotifications";

export default function Settings() {
  const { isSupported, isSubscribed, subscribe } = usePushNotifications();

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold text-[var(--text)] mb-6">
        Settings
      </h1>
      <div className="space-y-8">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-[var(--text)]">
              Theme
            </h2>
            <ThemeToggle />
          </div>
        </section>

        <section>
          <h2 className="text-base font-medium text-[var(--text)] mb-4">
            Channels
          </h2>
          <ChannelSelector />
        </section>

        {isSupported && (
          <section>
            <h2 className="text-base font-medium text-[var(--text)] mb-4">
              Notifications
            </h2>
            {isSubscribed ? (
              <p className="text-sm text-[var(--muted)]">
                Push notifications are enabled.
              </p>
            ) : (
              <button
                onClick={subscribe}
                className="w-full py-3 rounded-lg bg-[var(--accent)] text-white font-medium min-h-[44px] hover:opacity-90"
              >
                Enable push notifications
              </button>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
