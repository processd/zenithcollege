import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* eslint-disable @typescript-eslint/no-explicit-any */

/* ------------------------------------------------------------------ *
 * Zenith College — Staff Portal server functions.
 * Every function re-verifies the caller's roles server-side; the
 * database RLS policies are the second, authoritative gate.
 * ------------------------------------------------------------------ */

const ADMIN_ROLES = ["super_admin", "admin", "provost", "deputy_provost", "registrar"];

type Ctx = { supabase: any; userId: string };

type StaffScope = {
  roles: string[];
  isAdmin: boolean;
  isHod: boolean;
  isLecturer: boolean;
  isStaff: boolean;
  departmentIds: string[];
  courseIds: string[];
};

async function getScope(ctx: Ctx): Promise<StaffScope> {
  const db = ctx.supabase;
  const [{ data: roleRows }, { data: deptRows }, { data: assignRows }] = await Promise.all([
    db.from("user_roles").select("role").eq("user_id", ctx.userId),
    db.from("departments").select("id").eq("hod_user_id", ctx.userId),
    db.from("course_assignments").select("course_id").eq("lecturer_user_id", ctx.userId),
  ]);

  const roles: string[] = (roleRows ?? []).map((r: any) => r.role);
  const isAdmin = roles.some((r) => ADMIN_ROLES.includes(r));
  const departmentIds: string[] = (deptRows ?? []).map((d: any) => d.id);
  const courseIds: string[] = Array.from(
    new Set((assignRows ?? []).map((a: any) => a.course_id as string)),
  );

  return {
    roles,
    isAdmin,
    isHod: roles.includes("hod") || departmentIds.length > 0,
    isLecturer: roles.includes("lecturer") || courseIds.length > 0,
    isStaff: roles.length > 0,
    departmentIds,
    courseIds,
  };
}

function assertStaff(scope: StaffScope) {
  if (!scope.isStaff) throw new Error("No staff role is assigned to this account.");
}

/** Courses this staff member may work with, according to their role. */
async function scopedCourses(ctx: Ctx, scope: StaffScope) {
  const db = ctx.supabase;
  const { data: courses } = await db
    .from("courses")
    .select("id, code, title, level, semester, credit_units, programme_id, is_active")
    .order("code");
  const list = courses ?? [];
  if (scope.isAdmin) return list;

  let allowed = new Set(scope.courseIds);
  if (scope.departmentIds.length > 0) {
    const { data: programmes } = await db
      .from("programmes")
      .select("id, department_id")
      .in("department_id", scope.departmentIds);
    const progIds = new Set((programmes ?? []).map((p: any) => p.id));
    for (const c of list) if (c.programme_id && progIds.has(c.programme_id)) allowed.add(c.id);
  }
  return list.filter((c: any) => allowed.has(c.id));
}

/* ------------------------------- workspace ------------------------------- */

export const getStaffWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    const scope = await getScope(ctx);
    const db = ctx.supabase;

    const [{ data: profile }, { data: staffProfile }, { data: programmes }, { data: departments }] =
      await Promise.all([
        db.from("profiles").select("id, full_name, email").eq("id", ctx.userId).maybeSingle(),
        db
          .from("staff_profiles")
          .select("staff_number, designation, department_id")
          .eq("user_id", ctx.userId)
          .maybeSingle(),
        db.from("programmes").select("id, code, name, department_id").order("name"),
        db.from("departments").select("id, code, name, hod_user_id").order("name"),
      ]);

    const courses = scope.isStaff ? await scopedCourses(ctx, scope) : [];

    return {
      roles: scope.roles,
      isAdmin: scope.isAdmin,
      isHod: scope.isHod,
      isLecturer: scope.isLecturer,
      isStaff: scope.isStaff,
      canReview: scope.isAdmin || scope.isHod,
      profile: profile ?? null,
      staffProfile: staffProfile ?? null,
      departments: departments ?? [],
      programmes: programmes ?? [],
      courses,
      assignedCourseIds: scope.courseIds,
    };
  });

/* --------------------------------- results -------------------------------- */

const sessionInput = z.object({
  courseId: z.string().uuid(),
  session: z.string().trim().min(4).max(20),
  semester: z.enum(["First", "Second"]),
});

async function assertCourseAccess(ctx: Ctx, scope: StaffScope, courseId: string) {
  assertStaff(scope);
  if (scope.isAdmin) return;
  const allowed = await scopedCourses(ctx, scope);
  if (!allowed.some((c: any) => c.id === courseId))
    throw new Error("You are not assigned to this course.");
}

export const getCourseSheet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => sessionInput.parse(input))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const scope = await getScope(ctx);
    await assertCourseAccess(ctx, scope, data.courseId);
    const db = ctx.supabase;

    const { data: course } = await db
      .from("courses")
      .select("id, code, title, credit_units, level")
      .eq("id", data.courseId)
      .maybeSingle();

    const { data: regs } = await db
      .from("course_registrations")
      .select("student_id, students(id, full_name, matric_number, level)")
      .eq("course_id", data.courseId)
      .eq("session", data.session)
      .eq("semester", data.semester);

    const { data: results } = await db
      .from("results")
      .select("id, student_id, score, credit_unit, grade, grade_point, quality_point, status, review_notes")
      .eq("course_id", data.courseId)
      .eq("session", data.session)
      .eq("semester", data.semester);

    const byStudent = new Map<string, any>();
    for (const r of results ?? []) byStudent.set(r.student_id, r);

    const rows = (regs ?? [])
      .filter((r: any) => r.students)
      .map((r: any) => ({
        studentId: r.student_id,
        fullName: r.students.full_name,
        matricNumber: r.students.matric_number,
        level: r.students.level,
        result: byStudent.get(r.student_id) ?? null,
      }))
      .sort((a: any, b: any) => a.fullName.localeCompare(b.fullName));

    return { course: course ?? null, creditUnits: course?.credit_units ?? 1, rows };
  });

export const saveCourseResults = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    sessionInput
      .extend({
        submit: z.boolean(),
        entries: z
          .array(
            z.object({
              studentId: z.string().uuid(),
              score: z.number().min(0).max(100),
              creditUnit: z.number().int().min(1).max(12),
            }),
          )
          .min(1)
          .max(500),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const scope = await getScope(ctx);
    await assertCourseAccess(ctx, scope, data.courseId);
    const db = ctx.supabase;

    // Never overwrite results already approved by the department.
    const { data: locked } = await db
      .from("results")
      .select("student_id, status")
      .eq("course_id", data.courseId)
      .eq("session", data.session)
      .eq("semester", data.semester)
      .eq("status", "approved");
    const lockedIds = new Set((locked ?? []).map((r: any) => r.student_id));

    const now = new Date().toISOString();
    const status = data.submit ? "submitted" : "draft";
    const payload = data.entries
      .filter((e) => !lockedIds.has(e.studentId))
      .map((e) => ({
        student_id: e.studentId,
        course_id: data.courseId,
        session: data.session,
        semester: data.semester,
        credit_unit: e.creditUnit,
        score: e.score,
        status,
        is_published: false,
        entered_by: ctx.userId,
        submitted_by: data.submit ? ctx.userId : null,
        submitted_at: data.submit ? now : null,
      }));

    if (payload.length === 0) return { ok: true, saved: 0, locked: lockedIds.size };

    const { error } = await db
      .from("results")
      .upsert(payload, { onConflict: "student_id,course_id,session,semester" });
    if (error) throw new Error(error.message);

    return { ok: true, saved: payload.length, locked: lockedIds.size };
  });

export const listResultSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    const scope = await getScope(ctx);
    assertStaff(scope);
    if (!scope.isAdmin && !scope.isHod) return { batches: [] as any[] };
    const db = ctx.supabase;

    const allowed = await scopedCourses(ctx, scope);
    const allowedIds = new Set(allowed.map((c: any) => c.id));

    const { data: rows } = await db
      .from("results")
      .select(
        "id, course_id, session, semester, score, grade, status, entered_by, submitted_at, student_id, students(full_name, matric_number), courses(code, title)",
      )
      .in("status", ["submitted", "rejected"])
      .order("submitted_at", { ascending: false });

    const visible = (rows ?? []).filter((r: any) => scope.isAdmin || allowedIds.has(r.course_id));

    const batches = new Map<string, any>();
    for (const r of visible) {
      const key = `${r.course_id}|${r.session}|${r.semester}|${r.status}`;
      if (!batches.has(key))
        batches.set(key, {
          key,
          courseId: r.course_id,
          courseCode: r.courses?.code ?? "",
          courseTitle: r.courses?.title ?? "",
          session: r.session,
          semester: r.semester,
          status: r.status,
          enteredBy: r.entered_by,
          ownEntry: r.entered_by === ctx.userId,
          rows: [] as any[],
        });
      batches.get(key).rows.push({
        id: r.id,
        student: r.students?.full_name ?? "",
        matric: r.students?.matric_number ?? "",
        score: Number(r.score),
        grade: r.grade,
      });
    }

    return { batches: Array.from(batches.values()) };
  });

export const reviewResults = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        ids: z.array(z.string().uuid()).min(1).max(500),
        action: z.enum(["approve", "reject"]),
        notes: z.string().trim().max(500).optional().or(z.literal("")),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const scope = await getScope(ctx);
    assertStaff(scope);
    if (!scope.isAdmin && !scope.isHod)
      throw new Error("Only a Head of Department or an academic administrator can review results.");
    const db = ctx.supabase;

    const { data: rows, error: readError } = await db
      .from("results")
      .select("id, course_id, entered_by, status")
      .in("id", data.ids);
    if (readError) throw new Error(readError.message);

    const allowed = await scopedCourses(ctx, scope);
    const allowedIds = new Set(allowed.map((c: any) => c.id));

    const targets = (rows ?? []).filter((r: any) => {
      if (r.entered_by === ctx.userId && !scope.isAdmin) return false; // no self-approval
      return scope.isAdmin || allowedIds.has(r.course_id);
    });
    if (targets.length === 0)
      throw new Error(
        "Nothing to review. Lecturers cannot approve results they entered themselves.",
      );

    const now = new Date().toISOString();
    const patch =
      data.action === "approve"
        ? {
            status: "approved",
            is_published: true,
            reviewed_by: ctx.userId,
            reviewed_at: now,
            approved_by: ctx.userId,
            approved_at: now,
            review_notes: data.notes || null,
          }
        : {
            status: "rejected",
            is_published: false,
            reviewed_by: ctx.userId,
            reviewed_at: now,
            review_notes: data.notes || null,
          };

    const { error } = await db
      .from("results")
      .update(patch)
      .in(
        "id",
        targets.map((t: any) => t.id),
      );
    if (error) throw new Error(error.message);

    return { ok: true, count: targets.length };
  });

export const getResultAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ studentId: z.string().uuid().optional(), limit: z.number().int().min(1).max(200).optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const scope = await getScope(ctx);
    assertStaff(scope);
    const db = ctx.supabase;

    let query = db
      .from("result_audit")
      .select("id, action, status, score, notes, actor_id, created_at, student_id, course_id")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 60);
    if (data.studentId) query = query.eq("student_id", data.studentId);

    const { data: rows } = await query;
    if (!rows || rows.length === 0) return [];

    const actorIds = Array.from(new Set(rows.map((r: any) => r.actor_id).filter(Boolean)));
    const courseIds = Array.from(new Set(rows.map((r: any) => r.course_id).filter(Boolean)));
    const [{ data: actors }, { data: courses }] = await Promise.all([
      actorIds.length ? db.from("profiles").select("id, full_name, email").in("id", actorIds) : { data: [] },
      courseIds.length ? db.from("courses").select("id, code").in("id", courseIds) : { data: [] },
    ]);
    const actorMap = new Map((actors ?? []).map((a: any) => [a.id, a.full_name || a.email]));
    const courseMap = new Map((courses ?? []).map((c: any) => [c.id, c.code]));

    return rows.map((r: any) => ({
      id: r.id,
      action: r.action,
      status: r.status,
      score: r.score === null ? null : Number(r.score),
      notes: r.notes,
      at: r.created_at,
      actor: actorMap.get(r.actor_id) ?? "System",
      course: courseMap.get(r.course_id) ?? "—",
    }));
  });

/* -------------------------------- students -------------------------------- */

async function visibleStudentIds(ctx: Ctx, scope: StaffScope): Promise<string[] | null> {
  if (scope.isAdmin) return null; // null = all
  const db = ctx.supabase;
  const ids = new Set<string>();

  if (scope.courseIds.length > 0) {
    const { data } = await db
      .from("course_registrations")
      .select("student_id")
      .in("course_id", scope.courseIds);
    for (const r of data ?? []) ids.add(r.student_id);
  }
  if (scope.departmentIds.length > 0) {
    const { data: programmes } = await db
      .from("programmes")
      .select("id")
      .in("department_id", scope.departmentIds);
    const progIds = (programmes ?? []).map((p: any) => p.id);
    if (progIds.length > 0) {
      const { data } = await db.from("students").select("id").in("programme_id", progIds);
      for (const r of data ?? []) ids.add(r.id);
    }
  }
  return Array.from(ids);
}

export const searchStudents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ query: z.string().trim().max(80).optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const scope = await getScope(ctx);
    assertStaff(scope);
    const db = ctx.supabase;

    const ids = await visibleStudentIds(ctx, scope);
    if (ids !== null && ids.length === 0) return [];

    let q = db
      .from("students")
      .select("id, full_name, matric_number, email, level, status, programme_id, programmes(name)")
      .order("full_name")
      .limit(200);
    if (ids !== null) q = q.in("id", ids);
    if (data.query)
      q = q.or(`full_name.ilike.%${data.query}%,matric_number.ilike.%${data.query}%`);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []).map((s: any) => ({
      id: s.id,
      fullName: s.full_name,
      matricNumber: s.matric_number,
      email: scope.isAdmin || scope.isHod ? s.email : null,
      level: s.level,
      status: s.status,
      programme: s.programmes?.name ?? null,
    }));
  });

export const getStudentAcademics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ studentId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const scope = await getScope(ctx);
    assertStaff(scope);
    const ids = await visibleStudentIds(ctx, scope);
    if (ids !== null && !ids.includes(data.studentId))
      throw new Error("This student is outside your assigned courses or department.");

    const db = ctx.supabase;
    const { data: student } = await db
      .from("students")
      .select("id, full_name, matric_number, level, status, programmes(name)")
      .eq("id", data.studentId)
      .maybeSingle();

    const { data: rows } = await db
      .from("results")
      .select("session, semester, credit_unit, score, grade, grade_point, quality_point, status, courses(code, title)")
      .eq("student_id", data.studentId)
      .eq("status", "approved")
      .order("session");

    const groups = new Map<string, any>();
    for (const r of rows ?? []) {
      const key = `${r.session}|${r.semester}`;
      if (!groups.has(key))
        groups.set(key, { session: r.session, semester: r.semester, courses: [] as any[] });
      groups.get(key).courses.push({
        code: r.courses?.code ?? "",
        title: r.courses?.title ?? "",
        creditUnit: r.credit_unit,
        score: Number(r.score),
        grade: r.grade,
        gradePoint: Number(r.grade_point ?? 0),
        qualityPoint: Number(r.quality_point ?? 0),
      });
    }

    let cumCU = 0;
    let cumQP = 0;
    const semesters = Array.from(groups.values()).map((g: any) => {
      const cu = g.courses.reduce((s: number, c: any) => s + c.creditUnit, 0);
      const qp = g.courses.reduce((s: number, c: any) => s + c.qualityPoint, 0);
      cumCU += cu;
      cumQP += qp;
      return {
        ...g,
        totalCreditUnits: cu,
        totalQualityPoints: Number(qp.toFixed(2)),
        gpa: cu > 0 ? Number(Math.min(4, qp / cu).toFixed(2)) : 0,
        cumulativeCreditUnits: cumCU,
        cumulativeQualityPoints: Number(cumQP.toFixed(2)),
        cgpa: cumCU > 0 ? Number(Math.min(4, cumQP / cumCU).toFixed(2)) : 0,
      };
    });

    return {
      student: student ?? null,
      semesters,
      cgpa: cumCU > 0 ? Number(Math.min(4, cumQP / cumCU).toFixed(2)) : null,
    };
  });

/* ------------------------------- attendance ------------------------------- */

export const getAttendanceSheet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    sessionInput.extend({ classDate: z.string().trim().min(8).max(12) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const scope = await getScope(ctx);
    await assertCourseAccess(ctx, scope, data.courseId);
    const db = ctx.supabase;

    const { data: regs } = await db
      .from("course_registrations")
      .select("student_id, students(full_name, matric_number)")
      .eq("course_id", data.courseId)
      .eq("session", data.session)
      .eq("semester", data.semester);

    const { data: marks } = await db
      .from("attendance_records")
      .select("student_id, status, remark")
      .eq("course_id", data.courseId)
      .eq("class_date", data.classDate);
    const markMap = new Map<string, string>(
      (marks ?? []).map((m: any) => [m.student_id as string, m.status as string]),
    );

    return (regs ?? [])
      .filter((r: any) => r.students)
      .map((r: any) => ({
        studentId: r.student_id,
        fullName: r.students.full_name,
        matricNumber: r.students.matric_number,
        status: markMap.get(r.student_id) ?? "present",
      }))
      .sort((a: any, b: any) => a.fullName.localeCompare(b.fullName));
  });

export const saveAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    sessionInput
      .extend({
        classDate: z.string().trim().min(8).max(12),
        entries: z
          .array(
            z.object({
              studentId: z.string().uuid(),
              status: z.enum(["present", "absent", "late", "excused"]),
            }),
          )
          .min(1)
          .max(500),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const scope = await getScope(ctx);
    await assertCourseAccess(ctx, scope, data.courseId);

    const { error } = await ctx.supabase.from("attendance_records").upsert(
      data.entries.map((e) => ({
        course_id: data.courseId,
        student_id: e.studentId,
        session: data.session,
        semester: data.semester,
        class_date: data.classDate,
        status: e.status,
        recorded_by: ctx.userId,
      })),
      { onConflict: "course_id,student_id,class_date" },
    );
    if (error) throw new Error(error.message);
    return { ok: true, count: data.entries.length };
  });

export const getAttendanceSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => sessionInput.parse(input))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const scope = await getScope(ctx);
    await assertCourseAccess(ctx, scope, data.courseId);

    const { data: rows } = await ctx.supabase
      .from("attendance_records")
      .select("student_id, status, class_date, students(full_name, matric_number)")
      .eq("course_id", data.courseId)
      .eq("session", data.session)
      .eq("semester", data.semester);

    const map = new Map<string, any>();
    for (const r of rows ?? []) {
      if (!map.has(r.student_id))
        map.set(r.student_id, {
          studentId: r.student_id,
          fullName: r.students?.full_name ?? "",
          matricNumber: r.students?.matric_number ?? "",
          classes: 0,
          present: 0,
        });
      const e = map.get(r.student_id);
      e.classes += 1;
      if (r.status === "present" || r.status === "late") e.present += 1;
    }
    return Array.from(map.values()).map((e: any) => ({
      ...e,
      percentage: e.classes > 0 ? Math.round((e.present / e.classes) * 100) : 0,
    }));
  });

/* -------------------------------- timetable ------------------------------- */

export const listTimetable = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    const scope = await getScope(ctx);
    const db = ctx.supabase;

    const { data: rows } = await db
      .from("timetable_entries")
      .select(
        "id, session, semester, day_of_week, start_time, end_time, venue, level, kind, course_id, department_id, programme_id, lecturer_user_id, courses(code, title), programmes(name), departments(name)",
      )
      .order("day_of_week")
      .order("start_time");

    const all = (rows ?? []).map((r: any) => ({
      id: r.id,
      session: r.session,
      semester: r.semester,
      day: r.day_of_week,
      start: String(r.start_time).slice(0, 5),
      end: String(r.end_time).slice(0, 5),
      venue: r.venue,
      level: r.level,
      kind: r.kind,
      courseId: r.course_id,
      course: r.courses ? `${r.courses.code} — ${r.courses.title}` : "—",
      programme: r.programmes?.name ?? null,
      department: r.departments?.name ?? null,
      mine: r.lecturer_user_id === ctx.userId,
    }));

    return { entries: all, canEdit: scope.isAdmin || scope.departmentIds.length > 0 };
  });

export const saveTimetableEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        courseId: z.string().uuid(),
        programmeId: z.string().uuid().optional().or(z.literal("")),
        departmentId: z.string().uuid().optional().or(z.literal("")),
        lecturerUserId: z.string().uuid().optional().or(z.literal("")),
        level: z.string().trim().max(20).optional().or(z.literal("")),
        session: z.string().trim().min(4).max(20),
        semester: z.enum(["First", "Second"]),
        day: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]),
        start: z.string().trim().min(4).max(8),
        end: z.string().trim().min(4).max(8),
        venue: z.string().trim().max(80).optional().or(z.literal("")),
        kind: z.enum(["lecture", "practical", "examination"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const scope = await getScope(ctx);
    assertStaff(scope);
    if (!scope.isAdmin && scope.departmentIds.length === 0)
      throw new Error("Only a Head of Department or an academic administrator can set timetables.");

    const { error } = await ctx.supabase.from("timetable_entries").insert({
      course_id: data.courseId,
      programme_id: data.programmeId || null,
      department_id: data.departmentId || null,
      lecturer_user_id: data.lecturerUserId || null,
      level: data.level || null,
      session: data.session,
      semester: data.semester,
      day_of_week: data.day,
      start_time: data.start,
      end_time: data.end,
      venue: data.venue || null,
      kind: data.kind,
      created_by: ctx.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTimetableEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const { error } = await ctx.supabase.from("timetable_entries").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ----------------------------------- news --------------------------------- */

export const listNewsPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    const scope = await getScope(ctx);
    assertStaff(scope);
    const { data } = await ctx.supabase
      .from("news_posts")
      .select("id, title, body, category, is_published, published_at, author_id, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    return {
      posts: (data ?? []).map((p: any) => ({ ...p, mine: p.author_id === ctx.userId })),
      canPublish: scope.isAdmin,
    };
  });

export const saveNewsPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional().or(z.literal("")),
        title: z.string().trim().min(3).max(160),
        body: z.string().trim().min(10).max(6000),
        category: z.string().trim().min(2).max(40),
        publish: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const scope = await getScope(ctx);
    assertStaff(scope);
    if (data.publish && !scope.isAdmin)
      throw new Error("Only the Registry or College management can publish announcements.");

    const record: any = {
      title: data.title,
      body: data.body,
      category: data.category,
      is_published: data.publish,
      published_at: data.publish ? new Date().toISOString() : null,
    };

    if (data.id) {
      const { error } = await ctx.supabase.from("news_posts").update(record).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await ctx.supabase
        .from("news_posts")
        .insert({ ...record, author_id: ctx.userId });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteNewsPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const { error } = await ctx.supabase.from("news_posts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* --------------------------- internal communication ------------------------ */

const ROLE_AUDIENCE = [
  "super_admin",
  "provost",
  "deputy_provost",
  "registrar",
  "admissions_officer",
  "hod",
  "lecturer",
  "staff",
] as const;

export const listMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    const scope = await getScope(ctx);
    assertStaff(scope);
    const db = ctx.supabase;

    const { data: rows } = await db
      .from("internal_messages")
      .select("id, subject, body, audience, sender_id, recipient_user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    const senderIds = Array.from(new Set((rows ?? []).map((r: any) => r.sender_id)));
    const { data: senders } = senderIds.length
      ? await db.from("profiles").select("id, full_name, email").in("id", senderIds)
      : { data: [] };
    const nameMap = new Map((senders ?? []).map((s: any) => [s.id, s.full_name || s.email]));

    return {
      messages: (rows ?? []).map((r: any) => ({
        id: r.id,
        subject: r.subject,
        body: r.body,
        audience: r.audience ?? [],
        direct: Boolean(r.recipient_user_id),
        sentByMe: r.sender_id === ctx.userId,
        sender: nameMap.get(r.sender_id) ?? "College staff",
        at: r.created_at,
      })),
      roles: ROLE_AUDIENCE,
    };
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        subject: z.string().trim().min(3).max(140),
        body: z.string().trim().min(3).max(4000),
        audience: z.array(z.enum(ROLE_AUDIENCE)).max(8),
        recipientUserId: z.string().uuid().optional().or(z.literal("")),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const scope = await getScope(ctx);
    assertStaff(scope);
    if (data.audience.length === 0 && !data.recipientUserId)
      throw new Error("Choose at least one role audience or a specific colleague.");

    const { error } = await ctx.supabase.from("internal_messages").insert({
      sender_id: ctx.userId,
      recipient_user_id: data.recipientUserId || null,
      audience: data.audience,
      subject: data.subject,
      body: data.body,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listStaffDirectory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    const scope = await getScope(ctx);
    assertStaff(scope);
    if (!scope.isAdmin) return [];
    const { data } = await ctx.supabase
      .from("profiles")
      .select("id, full_name, email")
      .order("full_name")
      .limit(200);
    return (data ?? []).filter((p: any) => p.id !== ctx.userId);
  });
