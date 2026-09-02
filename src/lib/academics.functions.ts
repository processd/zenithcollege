import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Portal administrators hold `admin` or `super_admin`. */
async function assertAdmin(supabase: any, userId: string) {
  const { count } = await supabase
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("role", ["admin", "super_admin"]);
  if ((count ?? 0) === 0) throw new Error("Forbidden: administrator access required.");
}

/* -------------------------------- Courses -------------------------------- */

export const listAcademics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const db = context.supabase as any;

    const [{ data: programmes }, { data: courses }, { data: students }] = await Promise.all([
      db.from("programmes").select("id, code, name").order("name"),
      db
        .from("courses")
        .select("id, code, title, level, semester, credit_units, programme_id, is_active")
        .order("code"),
      db
        .from("students")
        .select("id, full_name, email, matric_number, level, programme_id, status")
        .order("full_name"),
    ]);

    return {
      programmes: programmes ?? [],
      courses: courses ?? [],
      students: students ?? [],
    };
  });

export const upsertProgramme = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        code: z.string().trim().min(2).max(20),
        name: z.string().trim().min(2).max(120),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await (context.supabase as any)
      .from("programmes")
      .insert({ code: data.code.toUpperCase(), name: data.name });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const upsertCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        code: z.string().trim().min(2).max(20),
        title: z.string().trim().min(2).max(160),
        programmeId: z.string().uuid().optional().or(z.literal("")),
        level: z.string().trim().max(20).optional().or(z.literal("")),
        semester: z.enum(["First", "Second"]),
        creditUnits: z.number().int().min(1).max(12),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await (context.supabase as any).from("courses").insert({
      code: data.code.toUpperCase(),
      title: data.title,
      programme_id: data.programmeId || null,
      level: data.level || null,
      semester: data.semester,
      credit_units: data.creditUnits,
      is_active: true,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* -------------------------------- Results -------------------------------- */

export const listStudentResults = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ studentId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: rows, error } = await (context.supabase as any)
      .from("results")
      .select(
        "id, session, semester, credit_unit, score, grade, grade_point, quality_point, courses(code, title)",
      )
      .eq("student_id", data.studentId)
      .order("session");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const saveResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        studentId: z.string().uuid(),
        courseId: z.string().uuid(),
        session: z.string().trim().min(4).max(20),
        semester: z.enum(["First", "Second"]),
        creditUnit: z.number().int().min(1).max(12),
        score: z.number().min(0).max(100),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    // grade / grade point / quality point are computed by the database.
    const { error } = await (context.supabase as any).from("results").upsert(
      {
        student_id: data.studentId,
        course_id: data.courseId,
        session: data.session,
        semester: data.semester,
        credit_unit: data.creditUnit,
        score: data.score,
        entered_by: context.userId,
      },
      { onConflict: "student_id,course_id,session,semester" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await (context.supabase as any).from("results").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* --------------------------------- Fees ----------------------------------- */

export const listFees = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ studentId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const db = context.supabase as any;
    const [{ data: invoices }, { data: payments }] = await Promise.all([
      db
        .from("fee_invoices")
        .select("id, session, semester, description, amount, status, due_date")
        .eq("student_id", data.studentId)
        .order("created_at", { ascending: false }),
      db
        .from("fee_payments")
        .select("id, invoice_id, amount, method, reference, receipt_number, status, paid_at")
        .eq("student_id", data.studentId)
        .order("created_at", { ascending: false }),
    ]);
    return { invoices: invoices ?? [], payments: payments ?? [] };
  });

export const createInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        studentId: z.string().uuid(),
        session: z.string().trim().min(4).max(20),
        semester: z.string().trim().max(20).optional().or(z.literal("")),
        description: z.string().trim().min(2).max(120),
        amount: z.number().min(0).max(100_000_000),
        dueDate: z.string().trim().max(20).optional().or(z.literal("")),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await (context.supabase as any).from("fee_invoices").insert({
      student_id: data.studentId,
      session: data.session,
      semester: data.semester || null,
      description: data.description,
      amount: data.amount,
      due_date: data.dueDate || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const confirmPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const db = context.supabase as any;

    const { data: payment, error: readError } = await db
      .from("fee_payments")
      .select("id, student_id, invoice_id, amount, status, receipt_number")
      .eq("id", data.id)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!payment) throw new Error("Payment not found.");

    const receipt =
      payment.receipt_number ??
      `ZC/RCT/${new Date().getFullYear()}/${Math.floor(100000 + Math.random() * 900000)}`;

    const { error } = await db
      .from("fee_payments")
      .update({ status: "confirmed", paid_at: new Date().toISOString(), receipt_number: receipt, recorded_by: context.userId })
      .eq("id", payment.id);
    if (error) throw new Error(error.message);

    if (payment.invoice_id) {
      const { data: invoice } = await db
        .from("fee_invoices")
        .select("amount")
        .eq("id", payment.invoice_id)
        .maybeSingle();
      const { data: confirmed } = await db
        .from("fee_payments")
        .select("amount")
        .eq("invoice_id", payment.invoice_id)
        .eq("status", "confirmed");
      const paid = (confirmed ?? []).reduce((s: number, p: any) => s + Number(p.amount), 0);
      await db
        .from("fee_invoices")
        .update({ status: paid >= Number(invoice?.amount ?? 0) ? "paid" : "part_paid" })
        .eq("id", payment.invoice_id);
    }

    return { ok: true, receipt };
  });

export const recordPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        studentId: z.string().uuid(),
        invoiceId: z.string().uuid().optional().or(z.literal("")),
        amount: z.number().positive().max(100_000_000),
        method: z.enum(["bank_transfer", "bank_deposit", "pos"]),
        reference: z.string().trim().min(3).max(80),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await (context.supabase as any).from("fee_payments").insert({
      student_id: data.studentId,
      invoice_id: data.invoiceId || null,
      amount: data.amount,
      method: data.method,
      reference: data.reference,
      status: "pending",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
