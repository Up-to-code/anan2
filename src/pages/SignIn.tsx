import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";

export default function SignIn() {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", password);
      formData.set("flow", step);
      await signIn("password", formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-[var(--text)] mb-6 text-center">
          {step === "signIn" ? "Sign in" : "Sign up"}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] placeholder-[var(--muted)] min-h-[44px]"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] placeholder-[var(--muted)] min-h-[44px]"
          />
          {error && (
            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[var(--accent)] text-white font-medium min-h-[44px] hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "..." : step === "signIn" ? "Sign in" : "Sign up"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            setStep(step === "signIn" ? "signUp" : "signIn");
            setError(null);
          }}
          className="mt-4 w-full text-sm text-[var(--muted)] hover:text-[var(--text)]"
        >
          {step === "signIn" ? "Sign up instead" : "Sign in instead"}
        </button>
      </div>
    </main>
  );
}
