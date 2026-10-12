import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — Zenith College of Health Science, Jos" },
      {
        name: "description",
        content: "Set a new password for your Zenith College staff or administrator account.",
      },
      { property: "og:title", content: "Reset Password — Zenith College, Jos" },
      { property: "og:description", content: "Set a new account password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // The recovery link lands here with type=recovery in the URL hash.
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      setInvalid(true);
      return;
    }
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // Fallback: the session may already be established from the hash.
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("The two passwords do not match. Please re-enter them.");
      return;
    }
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setDone(true);
    await supabase.auth.signOut();
  }

  return (
    <section className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="font-display text-2xl font-bold">Set a New Password</h1>

      {invalid && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
          <p className="text-sm text-muted-foreground">
            This password reset link is invalid or has expired. Please request a new one from the
            login page.
          </p>
          <Link to="/auth" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
            ← Back to login
          </Link>
        </div>
      )}

      {done && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
          <p role="status" className="text-sm font-medium text-primary">
            Your password has been changed successfully. You can now sign in with your new
            password.
          </p>
          <button
            type="button"
            onClick={() => void navigate({ to: "/auth" })}
            className="mt-4 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            Go to login
          </button>
        </div>
      )}

      {ready && !done && (
        <form
          onSubmit={onSubmit}
          className="mt-8 grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          <div className="grid gap-1.5">
            <label
              htmlFor="new-password"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
            />
          </div>
          <div className="grid gap-1.5">
            <label
              htmlFor="confirm-password"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save new password"}
          </button>
          <Link to="/auth" className="text-sm font-semibold text-primary hover:underline">
            ← Back to login
          </Link>
        </form>
      )}

      {!ready && !invalid && !done && (
        <p className="mt-6 text-sm text-muted-foreground">Checking your reset link…</p>
      )}
    </section>
  );
}
