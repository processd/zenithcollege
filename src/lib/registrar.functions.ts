import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { canGrantRole, canUseRegistrar } from "./registrar-rules";

/* eslint-disable @typescript-eslint/no-explicit-any */

async function scope(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.from("user_roles").select("role").eq("user_id", ctx.userId);
  const roles: string[] = (data ?? []).map((r: any) => r.role);
  if (!canUseRegistrar(roles)) throw new Error("Registrar access required.");
  return roles;
}

function fail(error: any): never {
  const msg = String(error?.message ?? error);
  if (msg.includes("students_matric_number_unique") || msg.includes("duplicate key"))
    throw new Error("That number or code already exists. Duplicates are not allowed.");
  throw new Error(msg);
}

const uuidOrEmpty = z.string().uuid().optional().or(z.literal("")).transform((v) => v || null);

export const getRegistrarWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await scope(context);
    const db = context.supabase as any;
    const [st, dep, prog, crs, prof, rl, sp, asg, ses, ms, ch, apps] = await Promise.all([
      db.from("students").select("id, full_name, email, phone, matric_number, programme_id, level, session, entry_year, admission_date, status, application_id, created_at").order("created_at", { ascending: false }).limit(1000),
      db.from("departments").select("id, code, name, hod_user_id, is_active").order("name"),
      db.from("programmes").select("id, code, name, department_id, duration_years, is_active").order("name"),
      db.from("courses").select("id, code, title, programme_id, level, semester, credit_units, is_active").order("code"),
      db.from("profiles").select("id, full_name, email, phone, is_active").order("full_name"),
      db.from("user_roles").select("user_id, role"),
      db.from("staff_profiles").select("id, user_id, staff_number, department_id, designation"),
      db.from("course_assignments").select("id, course_id, lecturer_user_id, session"),
      db.from("academic_sessions").select("*").order("name", { ascending: false }),
      db.from("matric_settings").select("*").eq("id", 1).maybeSingle(),
      db.from("student_changes").select("*").order("created_at", { ascending: false }).limit(100),
      db.from("applications").select("id, application_number, full_name, email, phone, programme, status").eq("status", "admitted"),
    ]);
    const linked = new Set((st.data ?? []).map((s: any) => s.application_id).filter(Boolean));
    return {
      roles,
      isSuper: roles.includes("super_admin") || roles.includes("admin"),
      students: st.data ?? [],
      departments: dep.data ?? [],
      programmes: prog.data ?? [],
      courses: crs.data ?? [],
      profiles: prof.data ?? [],
      userRoles: rl.data ?? [],
      staffProfiles: sp.data ?? [],
      assignments: asg.data ?? [],
      sessions: ses.data ?? [],
      matricSettings: ms.data ?? null,
      changes: ch.data ?? [],
      pendingAdmissions: (apps.data ?? []).filter((a: any) => !linked.has(a.id)),
    };
  });

async function nextMatric(db: any, year: number) {
  const { data, error } = await db.rpc("registrar_next_matric", { _year: year });
  if (error) fail(error);
  return data as string;
}

export const saveStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      fullName: z.string().trim().min(3).max(160),
      email: z.string().trim().email().max(200).optional().or(z.literal("")),
      phone: z.string().trim().max(30).optional().or(z.literal("")),
      programmeId: uuidOrEmpty,
      level: z.string().trim().max(20).optional().or(z.literal("")),
      session: z.string().trim().max(20).optional().or(z.literal("")),
      entryYear: z.number().int().min(2000).max(2100),
      admissionDate: z.string().optional().or(z.literal("")),
      status: z.enum(["active", "suspended", "withdrawn", "graduated", "deferred"]),
      matricMode: z.enum(["keep", "auto", "manual"]),
      matricNumber: z.string().trim().max(40).optional().or(z.literal("")),
      reason: z.string().trim().max(300).optional().or(z.literal("")),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await scope(context);
    const db = context.supabase as any;
    const row: any = {
      full_name: data.fullName,
      email: data.email || null,
      phone: data.phone || null,
      programme_id: data.programmeId,
      level: data.level || null,
      session: data.session || null,
      entry_year: data.entryYear,
      admission_date: data.admissionDate || null,
      status: data.status,
      change_reason: data.reason || null,
    };
    if (data.matricMode === "auto") row.matric_number = await nextMatric(db, data.entryYear);
    if (data.matricMode === "manual") {
      if (!data.matricNumber) throw new Error("Enter the matriculation number.");
      row.matric_number = data.matricNumber.toUpperCase();
    }
    const q = data.id
      ? db.from("students").update(row).eq("id", data.id).select("id, matric_number").single()
      : db.from("students").insert(row).select("id, matric_number").single();
    const { data: saved, error } = await q;
    if (error) fail(error);
    return saved;
  });

export const enrolAdmittedApplicant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ applicationId: z.string().uuid(), session: z.string().max(20).optional() }).parse(i))
  .handler(async ({ data, context }) => {
    await scope(context);
    const db = context.supabase as any;
    const { data: app, error } = await db.from("applications").select("*").eq("id", data.applicationId).single();
    if (error || !app) throw new Error("Application not found.");
    if (app.status !== "admitted") throw new Error("Only admitted applicants can be enrolled.");
    const { data: existing } = await db.from("students").select("id").eq("application_id", app.id).maybeSingle();
    if (existing) throw new Error("This applicant is already a student.");
    const { data: progs } = await db.from("programmes").select("id, code, name");
    const p = (progs ?? []).find((x: any) =>
      [x.name, x.code].some((v: string) => v && app.programme.toLowerCase().includes(v.toLowerCase())),
    );
    const year = new Date().getFullYear();
    const matric = await nextMatric(db, year);
    const { data: saved, error: e2 } = await db.from("students").insert({
      application_id: app.id,
      full_name: app.full_name,
      email: app.email,
      phone: app.phone,
      programme_id: p?.id ?? null,
      entry_year: year,
      session: data.session || null,
      admission_date: new Date().toISOString().slice(0, 10),
      status: "active",
      level: "Year 1",
      matric_number: matric,
    }).select("id, matric_number").single();
    if (e2) fail(e2);
    return saved;
  });

export const saveMatricSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      prefix: z.string().trim().min(1).max(12).regex(/^[A-Za-z0-9]+$/),
      separator: z.enum(["/", "-", ""]),
      serialLength: z.number().int().min(3).max(8),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await scope(context);
    const { error } = await (context.supabase as any).from("matric_settings")
      .update({ prefix: data.prefix.toUpperCase(), separator: data.separator, serial_length: data.serialLength, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) fail(error);
    return { ok: true };
  });

export const saveDepartment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid().optional(), code: z.string().trim().min(2).max(20), name: z.string().trim().min(2).max(160), hodUserId: uuidOrEmpty, isActive: z.boolean() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await scope(context);
    const db = context.supabase as any;
    const row = { code: data.code.toUpperCase(), name: data.name, hod_user_id: data.hodUserId, is_active: data.isActive };
    const { error } = data.id ? await db.from("departments").update(row).eq("id", data.id) : await db.from("departments").insert(row);
    if (error) fail(error);
    return { ok: true };
  });

export const saveProgramme = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid().optional(), code: z.string().trim().min(2).max(20), name: z.string().trim().min(2).max(160), departmentId: uuidOrEmpty, durationYears: z.number().min(0.5).max(8), isActive: z.boolean() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await scope(context);
    const db = context.supabase as any;
    const row = { code: data.code.toUpperCase(), name: data.name, department_id: data.departmentId, duration_years: data.durationYears, is_active: data.isActive };
    const { error } = data.id ? await db.from("programmes").update(row).eq("id", data.id) : await db.from("programmes").insert(row);
    if (error) fail(error);
    return { ok: true };
  });

export const saveCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      id: z.string().uuid().optional(), code: z.string().trim().min(2).max(20), title: z.string().trim().min(2).max(160),
      programmeId: uuidOrEmpty, level: z.string().trim().max(20).optional().or(z.literal("")),
      semester: z.enum(["First", "Second"]), creditUnits: z.number().int().min(1).max(6), isActive: z.boolean(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await scope(context);
    const db = context.supabase as any;
    const row = { code: data.code.toUpperCase(), title: data.title, programme_id: data.programmeId, level: data.level || null, semester: data.semester, credit_units: data.creditUnits, is_active: data.isActive };
    const { error } = data.id ? await db.from("courses").update(row).eq("id", data.id) : await db.from("courses").insert(row);
    if (error) fail(error);
    return { ok: true };
  });

export const inviteStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      email: z.string().trim().email().max(200), fullName: z.string().trim().min(3).max(160),
      role: z.string().min(2), departmentId: uuidOrEmpty,
      designation: z.string().trim().max(120).optional().or(z.literal("")),
      staffNumber: z.string().trim().max(40).optional().or(z.literal("")),
      redirectTo: z.string().url(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const roles = await scope(context);
    if (!canGrantRole(roles, data.role)) throw new Error("You are not allowed to grant that role.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();
    const { data: existing } = await supabaseAdmin.from("profiles").select("id").ilike("email", email).maybeSingle();
    let userId = existing?.id as string | undefined;
    let invited = false;
    if (!userId) {
      const { data: inv, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { full_name: data.fullName },
        redirectTo: data.redirectTo,
      });
      if (error) throw new Error(`Invitation failed: ${error.message}`);
      userId = inv.user?.id;
      invited = true;
    }
    if (!userId) throw new Error("Could not create the staff account.");
    const db = context.supabase as any;
    // Role grant runs as the signed-in registrar so RLS and the role guard apply.
    const { error: rErr } = await db.from("user_roles").insert({ user_id: userId, role: data.role });
    if (rErr && !String(rErr.message).includes("duplicate")) fail(rErr);
    const { data: sp } = await db.from("staff_profiles").select("id").eq("user_id", userId).maybeSingle();
    const spRow = { user_id: userId, department_id: data.departmentId, designation: data.designation || null, staff_number: data.staffNumber || null };
    const { error: sErr } = sp ? await db.from("staff_profiles").update(spRow).eq("id", sp.id) : await db.from("staff_profiles").insert(spRow);
    if (sErr) fail(sErr);
    return { invited, userId };
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ userId: z.string().uuid(), role: z.string().min(2), grant: z.boolean() }).parse(i))
  .handler(async ({ data, context }) => {
    const roles = await scope(context);
    if (!canGrantRole(roles, data.role)) throw new Error("You are not allowed to change that role.");
    if (data.userId === context.userId) throw new Error("You cannot change your own roles.");
    const db = context.supabase as any;
    const { error } = data.grant
      ? await db.from("user_roles").insert({ user_id: data.userId, role: data.role })
      : await db.from("user_roles").delete().eq("user_id", data.userId).eq("role", data.role);
    if (error) fail(error);
    return { ok: true };
  });

export const saveAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ remove: z.string().uuid().optional(), courseId: z.string().uuid().optional(), lecturerUserId: z.string().uuid().optional(), session: z.string().trim().max(20).optional() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await scope(context);
    const db = context.supabase as any;
    if (data.remove) {
      const { error } = await db.from("course_assignments").delete().eq("id", data.remove);
      if (error) fail(error);
      return { ok: true };
    }
    if (!data.courseId || !data.lecturerUserId) throw new Error("Choose a course and a lecturer.");
    const { count } = await db.from("course_assignments").select("id", { count: "exact", head: true })
      .eq("course_id", data.courseId).eq("lecturer_user_id", data.lecturerUserId).eq("session", data.session || "");
    if ((count ?? 0) > 0) throw new Error("That lecturer is already assigned to this course for the session.");
    const { error } = await db.from("course_assignments").insert({ course_id: data.courseId, lecturer_user_id: data.lecturerUserId, session: data.session || null });
    if (error) fail(error);
    return { ok: true };
  });

export const saveSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ name: z.string().trim().regex(/^\d{4}\/\d{4}$/, "Use the format 2026/2027"), semester: z.enum(["First", "Second"]), makeCurrent: z.boolean() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await scope(context);
    const db = context.supabase as any;
    if (data.makeCurrent) {
      const { error } = await db.from("academic_sessions").update({ is_current: false }).eq("is_current", true);
      if (error) fail(error);
    }
    const { error } = await db.from("academic_sessions").upsert(
      { name: data.name, current_semester: data.semester, is_current: data.makeCurrent },
      { onConflict: "name" },
    );
    if (error) fail(error);
    return { ok: true };
  });
