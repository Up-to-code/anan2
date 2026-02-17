import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthActions } from "@convex-dev/auth/react";
import { ConvexError } from "convex/values";

function getUserFriendlyError(msg: string, step: "signIn" | "signUp"): string {
  const lower = msg.toLowerCase();
  if (lower.includes("invalid password")) {
    return "Password must be at least 8 characters.";
  }
  if (lower.includes("invalid credentials")) {
    return step === "signIn"
      ? "Invalid email or password. Please try again."
      : "Invalid email or password.";
  }
  if (lower.includes("already exists")) {
    return "This email is already registered. Log in instead.";
  }
  if (lower.includes("missing") || lower.includes("param")) {
    return "Please fill in all required fields.";
  }
  if (lower.includes("network") || lower.includes("fetch") || lower.includes("connection")) {
    return "Connection failed. Please check your internet and try again.";
  }
  return msg;
}

export default function SignIn() {
  const navigate = useNavigate();
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8 && step === "signUp") {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", password);
      formData.set("flow", step);
      if (step === "signUp" && name.trim()) formData.set("name", name.trim());
      await signIn("password", formData);
      navigate("/", { replace: true });
      return;
    } catch (err) {
      setLoading(false);
      let rawMsg = "Something went wrong. Please try again.";
      if (err instanceof ConvexError) {
        const data = err.data as { message?: string; [k: string]: unknown };
        rawMsg = data?.message ?? (typeof data === "string" ? data : rawMsg);
      } else if (err instanceof Error) {
        rawMsg = err.message;
      }
      setError(getUserFriendlyError(rawMsg, step));
    }
  };

  const switchStep = () => {
    setStep(step === "signIn" ? "signUp" : "signIn");
    setError(null);
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-[var(--text)] mb-6 text-center">
          {step === "signIn" ? "Log in" : "Create account"}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] placeholder-[var(--muted)] min-h-[44px]"
          />
          {step === "signUp" && (
            <input
              type="text"
              name="name"
              placeholder="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] placeholder-[var(--muted)] min-h-[44px]"
            />
          )}
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={step === "signIn" ? "current-password" : "new-password"}
            className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] placeholder-[var(--muted)] min-h-[44px]"
          />
          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-600 dark:text-red-400"
            >
              {error}
              {error.includes("already registered") && (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep("signIn");
                  }}
                  className="block mt-2 font-medium underline hover:no-underline"
                >
                  Go to log in
                </button>
              )}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[var(--accent)] text-white font-medium min-h-[44px] hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Please wait..." : step === "signIn" ? "Log in" : "Sign up"}
          </button>
        </form>
        <button
          type="button"
          onClick={switchStep}
          className="mt-4 w-full text-sm text-[var(--muted)] hover:text-[var(--text)]"
        >
          {step === "signIn" ? "Create account instead" : "Log in instead"}
        </button>
      </div>
    </main>
  );
}
