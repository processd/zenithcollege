import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { claimFirstAdmin, getAdminStatus } from "@/lib/admissions.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Administrator Login — Zenith College of Health Science, Jos" },
      {
        name: "description",
        content:
          "Secure administrator login for staff of Zenith College of Health Science and Technology, Jos.",
      },
      { property: "og:title", content: "Administrator Login — Zenith College, Jos" },
      { property: "og:description", content: "Staff and administrator sign-in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getUser().then(({ data }) => {
      if (!cancelled && data.user) void navigate({ to: "/admin", replace: true });
    });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (signUpError) throw signUpError;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      await claimFirstAdmin();
      const { isAdmin } = await getAdminStatus();
      if (!isAdmin) {
        setNotice(
          "Your account was created but has not been granted administrator access yet. Contact the ICT Centre.",
        );
        setBusy(false);
        return;
      }
      void navigate({ to: "/admin", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed. Please try again.");
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="font-display text-2xl font-bold">Administrator Login</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Restricted area for college administrators. Applications and download files are managed
        here.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-8 grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-card"
      >
        <div className="grid gap-1.5">
          <label
            htmlFor="admin-email"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Email Address
          </label>
          <input
            id="admin-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
          />
        </div>
        <div className="grid gap-1.5">
          <label
            htmlFor="admin-password"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="text-sm font-medium text-primary">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Please wait…" : mode === "signin" ? "Login" : "Create admin account"}
        </button>

        <button
          type="button"
          onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
          className="text-sm font-semibold text-primary hover:underline"
        >
          {mode === "signin"
            ? "First time? Create the administrator account"
            : "I already have an account — log in"}
        </button>
      </form>

      <Link to="/" className="mt-6 text-sm font-semibold text-primary hover:underline">
        ← Back to the website
      </Link>
    </section>
  );
}
