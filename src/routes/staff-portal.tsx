import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHero, Section } from "@/components/site/PageHero";

export const Route = createFileRoute("/staff-portal")({
  head: () => ({
    meta: [
      { title: "Staff Portal — Zenith College of Health Science, Jos" },
      {
        name: "description",
        content:
          "Staff portal for uploading results, managing students, attendance, timetables and internal communication.",
      },
      { property: "og:title", content: "Staff Portal — Zenith College, Jos" },
      { property: "og:description", content: "Result upload, attendance and internal memos." },
      { property: "og:url", content: "/staff-portal" },
    ],
    links: [{ rel: "canonical", href: "/staff-portal" }],
  }),
  component: StaffPortal,
});

const services = [
  "Upload Results",
  "Manage Students",
  "Attendance",
  "Timetable",
  "News Update",
  "Internal Communication",
];

function StaffPortal() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setBusy(false);
      return;
    }
    void navigate({ to: "/staff" });
  }

  async function onForgotPassword() {
    if (!email.trim()) {
      setError("Enter your staff email address above first, then tap “Forgot password?”.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    // Deliberately vague: never reveal whether the email belongs to an account.
    setNotice(
      "If an account exists for that email address, a password reset link has been sent. Please check your inbox and spam folder.",
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Staff Portal"
        title="Tools for lecturers and administrators"
        subtitle="Secure access for academic and administrative staff of the College."
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <form
            className="rounded-2xl border border-border bg-card p-8 shadow-card"
            onSubmit={onLogin}
          >
            <h2 className="font-display text-xl font-bold">Staff Login</h2>
            <div className="mt-6 grid gap-4">
              <div className="grid gap-1.5">
                <label
                  htmlFor="staffid"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Staff Email
                </label>
                <input
                  id="staffid"
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
                  htmlFor="staffpass"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Password
                </label>
                <input
                  id="staffpass"
                  type="password"
                  autoComplete="current-password"
                  required
                  maxLength={64}
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
                {busy ? "Signing in…" : "Login"}
              </button>
              <button
                type="button"
                onClick={() => void onForgotPassword()}
                disabled={busy}
                className="text-sm font-semibold text-primary hover:underline disabled:opacity-60"
              >
                Forgot password? Reset it by email
              </button>
              <p className="text-xs text-muted-foreground">
                Staff accounts and roles are issued by the ICT Centre / Registry.
              </p>
            </div>
          </form>

          <div>
            <h2 className="font-display text-xl font-bold">Staff Services</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {services.map((s) => (
                <div
                  key={s}
                  className="rounded-xl border border-border bg-card px-5 py-4 text-sm font-semibold shadow-card"
                >
                  {s}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
