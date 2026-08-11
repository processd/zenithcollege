import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const applicationSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(30),
  programme: z.string().trim().min(2).max(120),
  dateOfBirth: z.string().trim().max(20).optional().or(z.literal("")),
  gender: z.string().trim().max(20).optional().or(z.literal("")),
  stateOfOrigin: z.string().trim().max(80).optional().or(z.literal("")),
  examType: z.string().trim().max(40).optional().or(z.literal("")),
  examYear: z.string().trim().max(10).optional().or(z.literal("")),
  examNumber: z.string().trim().max(40).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

function randomCode(length: number, alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789") {
  let out = "";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i += 1) out += alphabet[bytes[i]! % alphabet.length];
  return out;
}

export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => applicationSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const year = new Date().getFullYear();
    const applicationNumber = `ZC/${year}/${randomCode(6, "0123456789")}`;
    const accessCode = randomCode(6);

    const { error } = await supabaseAdmin.from("applications").insert({
      application_number: applicationNumber,
      access_code: accessCode,
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      programme: data.programme,
      date_of_birth: data.dateOfBirth ? data.dateOfBirth : null,
      gender: data.gender || null,
      state_of_origin: data.stateOfOrigin || null,
      exam_type: data.examType || null,
      exam_year: data.examYear || null,
      exam_number: data.examNumber || null,
      address: data.address || null,
      message: data.message || null,
    });

    if (error) throw new Error("We could not save your application. Please try again.");

    return { applicationNumber, accessCode };
  });

export const checkApplicationStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        applicationNumber: z.string().trim().min(4).max(40),
        accessCode: z.string().trim().min(4).max(20),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row } = await supabaseAdmin
      .from("applications")
      .select(
        "application_number, full_name, programme, status, admin_notes, created_at, updated_at, access_code",
      )
      .eq("application_number", data.applicationNumber.toUpperCase())
      .maybeSingle();

    if (!row || row.access_code !== data.accessCode.toUpperCase()) {
      return { found: false as const };
    }

    return {
      found: true as const,
      applicationNumber: row.application_number,
      fullName: row.full_name,
      programme: row.programme,
      status: row.status,
      adminNotes: row.admin_notes,
      submittedAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Role checks read the user_roles table directly under RLS (users can read their own roles). */
async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { count } = await supabase
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("role", "admin");
  return (count ?? 0) > 0;
}

async function assertAdmin(supabase: any, userId: string) {
  if (!(await isAdmin(supabase, userId))) {
    throw new Error("Forbidden: administrator access required.");
  }
}

export const getAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return { isAdmin: await isAdmin(context.supabase, context.userId) };
  });

/**
 * Bootstrap the first administrator. Requires the server-side ADMIN_SETUP_CODE
 * secret so a random visitor cannot race to claim the admin role.
 */
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ setupCode: z.string().trim().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const expected = process.env["ADMIN_SETUP_CODE"];
    if (!expected || data.setupCode !== expected) {
      throw new Error("Invalid administrator setup code.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    if ((count ?? 0) > 0) return { claimed: false };

    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) return { claimed: false };
    return { claimed: true };
  });

export const listApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);

    const { data, error } = await context.supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "under_review", "admitted", "rejected"]),
        adminNotes: z.string().trim().max(1000).optional().or(z.literal("")),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    const { error } = await context.supabase
      .from("applications")
      .update({ status: data.status, admin_notes: data.adminNotes || null })
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("applications").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
