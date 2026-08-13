import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { completeSuperAdminBootstrap, getBootstrapStatus } from "@/lib/bootstrap.functions";

export const Route = createFileRoute("/_authenticated/setup")({
  head: () => ({
    meta: [
      { title: "Super Administrator Setup — Zenith College, Jos" },
      {
        name: "description",
        content:
          "One-time protected setup screen used to assign the first super administrator for the Zenith College portal.",
      },
      { property: "og:title", content: "Super Administrator Setup — Zenith College, Jos" },
      { property: "og:description", content: "One-time administrator bootstrap." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SetupPage,
});

type Status = {
  configured: boolean;
  alreadyBootstrapped: boolean;
  eligible: boolean;
  isSuperAdmin: boolean;
};

function SetupPage() {
  const fetchStatus = useServerFn(getBootstrapStatus);
  const runBootstrap = useServerFn(completeSuperAdminBootstrap);

  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    try {
      setStatus((await fetchStatus()) as Status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load setup status.");
    }
  }, [fetchStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onClaim() {
    setBusy(true);
    setError(null);
    try {
      await runBootstrap({});
      setDone(true);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed.");
    }
    setBusy(false);
  }

  return (
    <section className="mx-auto flex max-w-xl flex-col px-4 py-16">
      <h1 className="font-display text-2xl font-bold">Super Administrator Setup</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This one-time screen assigns the first super administrator. It only works for the account
        whose email matches the server-held configuration, and it closes permanently once a super
        administrator exists.
      </p>

      <div className="mt-8 grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        {!status && !error && <p className="text-sm text-muted-foreground">Checking setup state…</p>}

        {status && (
          <ul className="grid gap-2 text-sm">
            <li>
              Configuration:{" "}
              <strong>{status.configured ? "BOOTSTRAP_ADMIN_EMAIL is set" : "not configured"}</strong>
            </li>
            <li>
              Super administrator:{" "}
              <strong>{status.alreadyBootstrapped ? "already assigned" : "not yet assigned"}</strong>
            </li>
            <li>
              This account: <strong>{status.eligible ? "authorised" : "not authorised"}</strong>
            </li>
          </ul>
        )}

        {status?.isSuperAdmin && (
          <p role="status" className="text-sm font-semibold text-primary">
            You hold the super administrator role.
          </p>
        )}

        {done && (
          <p role="status" className="text-sm font-semibold text-primary">
            Super administrator assigned. This setup is now permanently closed.
          </p>
        )}

        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        {status && !status.alreadyBootstrapped && (
          <button
            type="button"
            onClick={onClaim}
            disabled={busy || !status.eligible || !status.configured}
            className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Please wait…" : "Complete one-time super administrator setup"}
          </button>
        )}

        {status && !status.configured && (
          <p className="text-xs text-muted-foreground">
            Ask the ICT Centre to set the BOOTSTRAP_ADMIN_EMAIL configuration value in the backend
            secrets, then reload this page.
          </p>
        )}
      </div>

      <Link to="/admin" className="mt-6 text-sm font-semibold text-primary hover:underline">
        → Go to the admin dashboard
      </Link>
    </section>
  );
}
