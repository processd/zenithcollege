import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * One-time Super Admin bootstrap.
 *
 * Security model:
 * - Requires an authenticated session (bearer token validated server-side).
 * - The caller's verified token email must equal the server-held
 *   BOOTSTRAP_ADMIN_EMAIL secret. The secret is never sent to the browser.
 * - Refuses to run once ANY super_admin row exists, so it can only ever
 *   create the first administrator.
 * - The insert goes through the service-role client server-side only; the
 *   existing user_roles trigger writes the assignment into user_role_audit.
 */

function normalise(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export const getBootstrapStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const configured = normalise(process.env["BOOTSTRAP_ADMIN_EMAIL"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "super_admin");

    const { count: mine } = await context.supabase
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId)
      .eq("role", "super_admin");

    return {
      configured: configured.length > 0,
      alreadyBootstrapped: (count ?? 0) > 0,
      eligible:
        configured.length > 0 && normalise(context.claims["email"] as unknown) === configured,
      isSuperAdmin: (mine ?? 0) > 0,
    };
  });

export const completeSuperAdminBootstrap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const configured = normalise(process.env["BOOTSTRAP_ADMIN_EMAIL"]);
    if (!configured) {
      throw new Error("Bootstrap is not configured. Set BOOTSTRAP_ADMIN_EMAIL in Cloud secrets.");
    }

    const callerEmail = normalise(context.claims["email"] as unknown);
    if (!callerEmail || callerEmail !== configured) {
      throw new Error("This account is not authorised to complete the administrator setup.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count, error: countError } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "super_admin");

    if (countError) throw new Error("Could not verify administrator state. Please try again.");
    if ((count ?? 0) > 0) {
      throw new Error("A super administrator already exists. This setup is permanently closed.");
    }

    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "super_admin" });

    if (error) throw new Error("Could not assign the super administrator role.");

    return { ok: true as const };
  });
