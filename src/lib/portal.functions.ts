import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Student Portal server functions.
 *
 * Students do not hold Supabase auth accounts: they authenticate with the
 * application number + access code issued when they applied. Every function
 * below re-verifies that pair server-side and only ever reads rows belonging
 * to the matching applicant/student, so changing the application number in the
 * form can never expose another student's data without their access code.
 */

const credsSchema = z.object({
  applicationNumber: z.string().trim().min(4).max(40),
  accessCode: z.string().trim().min(4).max(20),
});

type Creds = z.infer<typeof credsSchema>;

/* eslint-disable @typescript-eslint/no-explicit-any */

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

type Verified = {
  db: any;
  app: any;
  student: any | null;
};

async function verify(creds: Creds): Promise<Verified | null> {
  const db = await admin();

  const { data: app } = await db
    .from("applications")
    .select("*")
    .eq("application_number", creds.applicationNumber.trim().toUpperCase())
    .maybeSingle();

  if (!app || app.access_code !== creds.accessCode.trim().toUpperCase()) return null;

  let student: any | null = null;
  const { data: existing } = await db
    .from("students")
    .select("*")
    .eq("application_id", app.id)
    .maybeSingle();
  student = existing ?? null;

  // Provision the student record for admitted applicants from their own real
  // application data (no invented values) so academic services can be used.
  if (!student && app.status === "admitted") {
    const { data: programme } = await db
      .from("programmes")
      .select("id")
      .or(`name.ilike.${app.programme},code.ilike.${app.programme}`)
      .maybeSingle();

    const { data: created } = await db
      .from("students")
      .insert({
        application_id: app.id,
        full_name: app.full_name,
        email: app.email,
        phone: app.phone,
        programme_id: programme?.id ?? null,
        entry_year: new Date(app.created_at).getFullYear(),
        status: "active",
      })
      .select("*")
      .maybeSingle();
    student = created ?? null;
  }

  return { db, app, student };
}

function publicApp(app: any) {
  return {
    id: app.id as string,
    applicationNumber: app.application_number as string,
    fullName: app.full_name as string,
    email: app.email as string,
    phone: app.phone as string,
    programme: app.programme as string,
    status: app.status as string,
    adminNotes: (app.admin_notes ?? null) as string | null,
    submittedAt: app.created_at as string,
    updatedAt: app.updated_at as string,
    dateOfBirth: (app.date_of_birth ?? null) as string | null,
    gender: (app.gender ?? null) as string | null,
    stateOfOrigin: (app.state_of_origin ?? null) as string | null,
  };
}

function publicStudent(student: any | null) {
  if (!student) return null;
  return {
    id: student.id as string,
    matricNumber: (student.matric_number ?? null) as string | null,
    level: (student.level ?? null) as string | null,
    entryYear: (student.entry_year ?? null) as number | null,
    status: student.status as string,
    programmeId: (student.programme_id ?? null) as string | null,
  };
}

/** Sign in to the portal / check admission status. */
export const portalSignIn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => credsSchema.parse(input))
  .handler(async ({ data }) => {
    const v = await verify(data);
    if (!v) return { found: false as const };
    return {
      found: true as const,
      application: publicApp(v.app),
      student: publicStudent(v.student),
    };
  });

/* ------------------------------- Courses -------------------------------- */

const regSchema = credsSchema.extend({
  session: z.string().trim().min(4).max(20),
  semester: z.enum(["First", "Second"]),
  courseIds: z.array(z.string().uuid()).min(1).max(20),
});

export const getCourseRegistration = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    credsSchema
      .extend({
        session: z.string().trim().min(4).max(20),
        semester: z.enum(["First", "Second"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const v = await verify(data);
    if (!v) return { ok: false as const, reason: "invalid" as const };
    if (!v.student) return { ok: false as const, reason: "not_admitted" as const };

    let q = v.db
      .from("courses")
      .select("id, code, title, level, semester, credit_units, programme_id")
      .eq("is_active", true)
      .order("code");
    if (v.student.programme_id) q = q.eq("programme_id", v.student.programme_id);
    const { data: courses } = await q;

    const { data: registrations } = await v.db
      .from("course_registrations")
      .select("id, course_id, session, semester, created_at, courses(code, title, credit_units)")
      .eq("student_id", v.student.id)
      .eq("session", data.session)
      .eq("semester", data.semester);

    return {
      ok: true as const,
      courses: (courses ?? []).filter(
        (c: any) => !c.semester || c.semester === data.semester || c.semester === `${data.semester} Semester`,
      ),
      registrations: registrations ?? [],
    };
  });

export const registerCourses = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => regSchema.parse(input))
  .handler(async ({ data }) => {
    const v = await verify(data);
    if (!v) throw new Error("Invalid application number or access code.");
    if (!v.student) throw new Error("Course registration is only open to admitted students.");

    // Only allow real, active courses (and, when known, the student's programme).
    let q = v.db.from("courses").select("id, programme_id").eq("is_active", true).in("id", data.courseIds);
    const { data: valid } = await q;
    const allowed = (valid ?? []).filter(
      (c: any) => !v.student.programme_id || !c.programme_id || c.programme_id === v.student.programme_id,
    );
    if (allowed.length === 0) throw new Error("No valid courses were selected.");

    const rows = allowed.map((c: any) => ({
      student_id: v.student.id,
      course_id: c.id,
      session: data.session,
      semester: data.semester,
      level: v.student.level ?? null,
    }));

    // Unique(student, course, session, semester) prevents duplicate registration.
    const { error } = await v.db
      .from("course_registrations")
      .upsert(rows, { onConflict: "student_id,course_id,session,semester", ignoreDuplicates: true });
    if (error) throw new Error("Could not save your course registration. Please try again.");

    return { ok: true as const, registered: rows.length };
  });

/* -------------------------------- Results -------------------------------- */

export const getResults = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => credsSchema.parse(input))
  .handler(async ({ data }) => {
    const v = await verify(data);
    if (!v) return { ok: false as const, reason: "invalid" as const };
    if (!v.student) return { ok: false as const, reason: "not_admitted" as const };

    const { data: rows } = await v.db
      .from("results")
      .select(
        "id, session, semester, credit_unit, score, grade, grade_point, quality_point, created_at, courses(code, title)",
      )
      .eq("student_id", v.student.id)
      .eq("is_published", true)
      .order("session")
      .order("semester");

    const groups = new Map<string, any>();
    let cumQP = 0;
    let cumCU = 0;

    for (const r of rows ?? []) {
      const key = `${r.session}||${r.semester}`;
      if (!groups.has(key))
        groups.set(key, { session: r.session, semester: r.semester, courses: [], totalUnits: 0, totalQualityPoints: 0, gpa: 0 });
      const g = groups.get(key);
      g.courses.push({
        code: r.courses?.code ?? "—",
        title: r.courses?.title ?? "—",
        creditUnit: r.credit_unit,
        score: Number(r.score),
        grade: r.grade,
        gradePoint: Number(r.grade_point),
        qualityPoint: Number(r.quality_point),
      });
      g.totalUnits += r.credit_unit;
      g.totalQualityPoints += Number(r.quality_point);
      cumCU += r.credit_unit;
      cumQP += Number(r.quality_point);
    }

    const semesters = [...groups.values()].map((g) => ({
      ...g,
      gpa: g.totalUnits ? Number((g.totalQualityPoints / g.totalUnits).toFixed(2)) : 0,
    }));

    return {
      ok: true as const,
      semesters,
      cgpa: cumCU ? Number((cumQP / cumCU).toFixed(2)) : null,
      totalUnits: cumCU,
      totalQualityPoints: Number(cumQP.toFixed(2)),
    };
  });

/* --------------------------------- Fees ---------------------------------- */

export const getFees = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => credsSchema.parse(input))
  .handler(async ({ data }) => {
    const v = await verify(data);
    if (!v) return { ok: false as const, reason: "invalid" as const };
    if (!v.student) return { ok: false as const, reason: "not_admitted" as const };

    const { data: invoices } = await v.db
      .from("fee_invoices")
      .select("id, session, semester, description, amount, due_date, status, created_at")
      .eq("student_id", v.student.id)
      .order("created_at", { ascending: false });

    const { data: payments } = await v.db
      .from("fee_payments")
      .select("id, invoice_id, amount, method, reference, receipt_number, status, paid_at, created_at")
      .eq("student_id", v.student.id)
      .order("created_at", { ascending: false });

    const confirmed = (payments ?? []).filter((p: any) => p.status === "confirmed");
    const billed = (invoices ?? []).reduce((s: number, i: any) => s + Number(i.amount), 0);
    const paid = confirmed.reduce((s: number, p: any) => s + Number(p.amount), 0);

    return {
      ok: true as const,
      invoices: invoices ?? [],
      payments: payments ?? [],
      receipts: confirmed,
      totals: { billed, paid, outstanding: Number((billed - paid).toFixed(2)) },
    };
  });

/** Records a payment the student says they have made — stays "pending" until the Bursary confirms it. */
export const declarePayment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    credsSchema
      .extend({
        invoiceId: z.string().uuid(),
        amount: z.number().positive().max(100_000_000),
        method: z.enum(["bank_transfer", "bank_deposit", "pos"]),
        reference: z.string().trim().min(3).max(80),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const v = await verify(data);
    if (!v) throw new Error("Invalid application number or access code.");
    if (!v.student) throw new Error("Only admitted students can submit payment details.");

    const { data: invoice } = await v.db
      .from("fee_invoices")
      .select("id")
      .eq("id", data.invoiceId)
      .eq("student_id", v.student.id)
      .maybeSingle();
    if (!invoice) throw new Error("That invoice does not belong to your record.");

    const { error } = await v.db.from("fee_payments").insert({
      invoice_id: invoice.id,
      student_id: v.student.id,
      amount: data.amount,
      method: data.method,
      reference: data.reference,
      status: "pending",
    });
    if (error) throw new Error("Could not submit your payment notification.");

    return { ok: true as const };
  });

/* ------------------------- Admission letter / card ------------------------ */

export const getAdmissionLetter = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => credsSchema.parse(input))
  .handler(async ({ data }) => {
    const v = await verify(data);
    if (!v) return { ok: false as const, reason: "invalid" as const };
    if (v.app.status !== "admitted") return { ok: false as const, reason: "not_admitted" as const };

    return {
      ok: true as const,
      application: publicApp(v.app),
      student: publicStudent(v.student),
      issuedOn: new Date().toISOString(),
    };
  });

export const getExamCard = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    credsSchema
      .extend({
        session: z.string().trim().min(4).max(20),
        semester: z.enum(["First", "Second"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const v = await verify(data);
    if (!v) return { ok: false as const, reason: "invalid" as const };
    if (!v.student) return { ok: false as const, reason: "not_admitted" as const };

    const { data: registrations } = await v.db
      .from("course_registrations")
      .select("id, courses(code, title, credit_units)")
      .eq("student_id", v.student.id)
      .eq("session", data.session)
      .eq("semester", data.semester);

    if (!registrations || registrations.length === 0) {
      return { ok: false as const, reason: "no_registration" as const };
    }

    const { data: invoices } = await v.db
      .from("fee_invoices")
      .select("amount")
      .eq("student_id", v.student.id)
      .eq("session", data.session);
    const { data: payments } = await v.db
      .from("fee_payments")
      .select("amount, status")
      .eq("student_id", v.student.id);

    const billed = (invoices ?? []).reduce((s: number, i: any) => s + Number(i.amount), 0);
    const paid = (payments ?? [])
      .filter((p: any) => p.status === "confirmed")
      .reduce((s: number, p: any) => s + Number(p.amount), 0);

    return {
      ok: true as const,
      application: publicApp(v.app),
      student: publicStudent(v.student),
      session: data.session,
      semester: data.semester,
      courses: registrations.map((r: any) => r.courses).filter(Boolean),
      feeCleared: billed === 0 ? null : paid >= billed,
    };
  });
