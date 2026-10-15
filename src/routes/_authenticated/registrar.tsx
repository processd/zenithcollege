import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  enrolAdmittedApplicant,
  getRegistrarWorkspace,
  inviteStaff,
  saveAssignment,
  saveCourse,
  saveDepartment,
  saveMatricSettings,
  saveProgramme,
  saveSession,
  saveStudent,
  setUserRole,
} from "@/lib/registrar.functions";
import { OPERATIONAL_ROLES, formatMatric } from "@/lib/registrar-rules";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const Route = createFileRoute("/_authenticated/registrar")({
  head: () => ({
    meta: [
      { title: "Registrar's Dashboard — Zenith College, Jos" },
      { name: "description", content: "Registrar tools for students, matriculation numbers, staff, courses and sessions." },
      { property: "og:title", content: "Registrar's Dashboard — Zenith College, Jos" },
      { property: "og:description", content: "Internal registrar tools." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RegistrarPage,
});

const TABS = ["Students", "Admissions", "Matric Numbers", "Departments", "Programmes", "Courses", "Staff & Roles", "Course Allocation", "Sessions", "Audit Log"] as const;
type Tab = (typeof TABS)[number];
const ALL_ROLES = ["lecturer", "hod", "staff", "admissions_officer", "registrar", "deputy_provost", "provost", "super_admin"];
const input = "w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm";
const btn = "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60";
const btn2 = "rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-primary";

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}{children}</label>;
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-border bg-card p-5 shadow-card"><h2 className="font-display text-lg font-bold">{title}</h2><div className="mt-4 grid gap-4">{children}</div></section>;
}
function Table({ head, rows, empty }: { head: string[]; rows: React.ReactNode[][]; empty: string }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="overflow-x-auto"><table className="w-full text-left text-sm">
      <thead><tr className="border-b border-border text-xs uppercase text-muted-foreground">{head.map((h) => <th key={h} className="px-2 py-2">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i} className="border-b border-border/60">{r.map((c, j) => <td key={j} className="px-2 py-2 align-top">{c}</td>)}</tr>)}</tbody>
    </table></div>
  );
}

function RegistrarPage() {
  const [ws, setWs] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);
  const [tab, setTab] = useState<Tab>("Students");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => getRegistrarWorkspace().then(setWs).catch((e) => setErr(e instanceof Error ? e.message : "Unable to load.")), []);
  useEffect(() => { void load(); }, [load]);

  async function run(fn: () => Promise<any>, ok: string) {
    setBusy(true); setMsg(null);
    try { const r = await fn(); setMsg({ t: typeof ok === "string" ? ok.replace("{matric}", r?.matric_number ?? "") : ok, ok: true }); await load(); return true; }
    catch (e) { setMsg({ t: e instanceof Error ? e.message : "Something went wrong.", ok: false }); return false; }
    finally { setBusy(false); }
  }

  if (err) return <section className="mx-auto max-w-3xl px-4 py-16"><h1 className="font-display text-2xl font-bold">Registrar's Dashboard</h1><p className="mt-3 text-sm text-destructive">{err}</p><Link to="/staff" className="mt-4 inline-block text-sm font-semibold text-primary">← Back to Staff Portal</Link></section>;
  if (!ws) return <section className="px-4 py-20 text-center text-sm">Loading…</section>;

  const ctx = { ws, run, busy };
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Registrar's Dashboard</p>
          <h1 className="font-display text-2xl font-bold">Academic Records & Administration</h1>
          <p className="mt-1 text-sm text-muted-foreground">{ws.students.length} students · {ws.programmes.length} programmes · {ws.courses.length} courses · {ws.pendingAdmissions.length} admitted awaiting enrolment</p>
        </div>
        <div className="flex gap-4 text-sm font-semibold text-primary"><Link to="/staff">Staff Portal</Link><Link to="/admin">Admin Dashboard</Link></div>
      </header>

      <select className={`${input} mt-6 md:hidden`} value={tab} onChange={(e) => setTab(e.target.value as Tab)} aria-label="Go to section">{TABS.map((t) => <option key={t}>{t}</option>)}</select>
      <nav className="mt-6 hidden flex-wrap gap-2 md:flex">{TABS.map((t) => <button key={t} onClick={() => { setTab(t); setMsg(null); }} className={`rounded-lg px-3 py-2 text-sm font-semibold ${tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>{t}</button>)}</nav>

      {msg && <p role="status" className={`mt-4 rounded-lg border px-4 py-3 text-sm font-medium ${msg.ok ? "border-primary/30 text-primary" : "border-destructive/30 text-destructive"}`}>{msg.t}</p>}

      <div className="mt-6">
        {tab === "Students" && <Students {...ctx} />}
        {tab === "Admissions" && <Admissions {...ctx} />}
        {tab === "Matric Numbers" && <Matric {...ctx} />}
        {tab === "Departments" && <Departments {...ctx} />}
        {tab === "Programmes" && <Programmes {...ctx} />}
        {tab === "Courses" && <Courses {...ctx} />}
        {tab === "Staff & Roles" && <Staff {...ctx} />}
        {tab === "Course Allocation" && <Allocation {...ctx} />}
        {tab === "Sessions" && <Sessions {...ctx} />}
        {tab === "Audit Log" && <Audit {...ctx} />}
      </div>
    </section>
  );
}

type Ctx = { ws: any; run: (fn: () => Promise<any>, ok: string) => Promise<boolean>; busy: boolean };
const nameOf = (list: any[], id: string | null, key = "name") => list.find((x) => x.id === id)?.[key] ?? "—";
const currentSession = (ws: any) => ws.sessions.find((s: any) => s.is_current)?.name ?? "";

/* -------------------------------- Students -------------------------------- */
const blankStudent = (ws: any) => ({ fullName: "", email: "", phone: "", programmeId: "", level: "Year 1", session: currentSession(ws), entryYear: new Date().getFullYear(), admissionDate: "", status: "active", matricMode: "auto", matricNumber: "", reason: "" });

function Students({ ws, run, busy }: Ctx) {
  const [q, setQ] = useState("");
  const [prog, setProg] = useState("");
  const [level, setLevel] = useState("");
  const [page, setPage] = useState(0);
  const [form, setForm] = useState<any>(null);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return ws.students.filter((st: any) =>
      (!prog || st.programme_id === prog) && (!level || st.level === level) &&
      (!s || [st.full_name, st.matric_number, st.email, st.phone, st.session, ws.pendingAdmissions && ""].some((v: any) => v && String(v).toLowerCase().includes(s))));
  }, [ws, q, prog, level]);
  const levels = [...new Set(ws.students.map((s: any) => s.level).filter(Boolean))] as string[];
  const pageRows = filtered.slice(page * 25, page * 25 + 25);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await run(() => saveStudent({ data: { ...form, entryYear: Number(form.entryYear) } }), form.id ? "Student updated." : "Student registered. Matric number: {matric}");
    if (ok) setForm(null);
  }

  return (
    <div className="grid gap-6">
      <Card title="Find students">
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
          <input className={input} placeholder="Search name, matric number, email, phone or session" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
          <select className={input} value={prog} onChange={(e) => setProg(e.target.value)}><option value="">All programmes</option>{ws.programmes.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <select className={input} value={level} onChange={(e) => setLevel(e.target.value)}><option value="">All levels</option>{levels.map((l) => <option key={l}>{l}</option>)}</select>
          <button className={btn} onClick={() => setForm(blankStudent(ws))}>+ Add student</button>
        </div>
        <Table head={["Name", "Matric No.", "Programme", "Level", "Session", "Status", ""]} empty="No students found. Use “Add student” or enrol admitted applicants from the Admissions tab."
          rows={pageRows.map((s: any) => [s.full_name, s.matric_number ?? <span className="text-muted-foreground">none</span>, nameOf(ws.programmes, s.programme_id), s.level ?? "—", s.session ?? "—", s.status,
            <button key="e" className={btn2} onClick={() => setForm({ id: s.id, fullName: s.full_name, email: s.email ?? "", phone: s.phone ?? "", programmeId: s.programme_id ?? "", level: s.level ?? "", session: s.session ?? "", entryYear: s.entry_year ?? new Date().getFullYear(), admissionDate: s.admission_date ?? "", status: s.status, matricMode: s.matric_number ? "keep" : "auto", matricNumber: s.matric_number ?? "", reason: "" })}>Edit</button>])} />
        {filtered.length > 25 && <div className="flex items-center gap-3 text-sm"><button className={btn2} disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>Page {page + 1} of {Math.ceil(filtered.length / 25)}<button className={btn2} disabled={(page + 1) * 25 >= filtered.length} onClick={() => setPage(page + 1)}>Next</button></div>}
      </Card>

      {form && (
        <Card title={form.id ? "Edit student" : "Register new student"}>
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
            <L label="Full name *"><input required className={input} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} /></L>
            <L label="Programme"><select className={input} value={form.programmeId} onChange={(e) => set("programmeId", e.target.value)}><option value="">— choose —</option>{ws.programmes.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></L>
            <L label="Email"><input type="email" className={input} value={form.email} onChange={(e) => set("email", e.target.value)} /></L>
            <L label="Phone"><input className={input} value={form.phone} onChange={(e) => set("phone", e.target.value)} /></L>
            <L label="Level / year"><input className={input} value={form.level} onChange={(e) => set("level", e.target.value)} /></L>
            <L label="Academic session"><input className={input} placeholder="2026/2027" value={form.session} onChange={(e) => set("session", e.target.value)} /></L>
            <L label="Entry year *"><input type="number" required className={input} value={form.entryYear} onChange={(e) => set("entryYear", e.target.value)} /></L>
            <L label="Admission date"><input type="date" className={input} value={form.admissionDate} onChange={(e) => set("admissionDate", e.target.value)} /></L>
            <L label="Student status"><select className={input} value={form.status} onChange={(e) => set("status", e.target.value)}>{["active", "deferred", "suspended", "withdrawn", "graduated"].map((s) => <option key={s}>{s}</option>)}</select></L>
            <L label="Matriculation number"><select className={input} value={form.matricMode} onChange={(e) => set("matricMode", e.target.value)}>
              {form.id && form.matricNumber && <option value="keep">Keep {form.matricNumber}</option>}
              <option value="auto">Generate automatically</option><option value="manual">Enter / correct manually</option></select></L>
            {form.matricMode === "manual" && <L label="Matric number"><input className={input} value={form.matricNumber} onChange={(e) => set("matricNumber", e.target.value)} /></L>}
            {form.id && <L label="Reason for change (required to correct a matric number)"><input className={input} value={form.reason} onChange={(e) => set("reason", e.target.value)} /></L>}
            <div className="flex gap-3 sm:col-span-2"><button className={btn} disabled={busy}>{busy ? "Saving…" : "Save student"}</button><button type="button" className={btn2} onClick={() => setForm(null)}>Cancel</button></div>
          </form>
        </Card>
      )}
    </div>
  );
}

function Admissions({ ws, run, busy }: Ctx) {
  return (
    <Card title="Admitted applicants awaiting enrolment">
      <p className="text-sm text-muted-foreground">Enrolling creates the student record from the application and assigns the next matriculation number.</p>
      <Table head={["Application No.", "Name", "Programme", "Phone", ""]} empty="No admitted applicants are waiting. Mark applications as Admitted in the Admin Dashboard first."
        rows={ws.pendingAdmissions.map((a: any) => [a.application_number, a.full_name, a.programme, a.phone,
          <button key="b" className={btn2} disabled={busy} onClick={() => { if (confirm(`Enrol ${a.full_name} as a student?`)) void run(() => enrolAdmittedApplicant({ data: { applicationId: a.id, session: currentSession(ws) } }), "Student enrolled. Matric number: {matric}"); }}>Enrol as student</button>])} />
    </Card>
  );
}

function Matric({ ws, run, busy }: Ctx) {
  const s = ws.matricSettings ?? { prefix: "ZC", separator: "/", serial_length: 4 };
  const [f, setF] = useState({ prefix: s.prefix, separator: s.separator, serialLength: s.serial_length });
  return (
    <Card title="Matriculation number format">
      <p className="text-sm text-muted-foreground">Numbers are generated by the database one at a time, so two staff saving at once never receive the same number. Duplicates are always refused, and corrections to an existing number need a reason and are logged.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <L label="Prefix"><input className={input} value={f.prefix} onChange={(e) => setF({ ...f, prefix: e.target.value })} /></L>
        <L label="Separator"><select className={input} value={f.separator} onChange={(e) => setF({ ...f, separator: e.target.value })}><option value="/">/</option><option value="-">-</option><option value="">none</option></select></L>
        <L label="Serial digits"><input type="number" min={3} max={8} className={input} value={f.serialLength} onChange={(e) => setF({ ...f, serialLength: Number(e.target.value) })} /></L>
      </div>
      <p className="text-sm">Example: <strong>{formatMatric(f.prefix.toUpperCase(), f.separator, new Date().getFullYear(), 1, f.serialLength)}</strong></p>
      <div><button className={btn} disabled={busy} onClick={() => run(() => saveMatricSettings({ data: f }), "Format saved. New numbers will use it; existing numbers are unchanged.")}>Save format</button></div>
    </Card>
  );
}

function Departments({ ws, run, busy }: Ctx) {
  const [f, setF] = useState<any>({ code: "", name: "", hodUserId: "", isActive: true });
  return (
    <Card title="Departments">
      <form className="grid gap-3 sm:grid-cols-4" onSubmit={async (e) => { e.preventDefault(); if (await run(() => saveDepartment({ data: f }), "Department saved.")) setF({ code: "", name: "", hodUserId: "", isActive: true }); }}>
        <L label="Code"><input required className={input} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></L>
        <L label="Name"><input required className={input} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></L>
        <L label="Head of Department"><select className={input} value={f.hodUserId ?? ""} onChange={(e) => setF({ ...f, hodUserId: e.target.value })}><option value="">— none —</option>{ws.profiles.map((p: any) => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}</select></L>
        <div className="flex items-end gap-2"><button className={btn} disabled={busy}>{f.id ? "Update" : "Add"}</button>{f.id && <button type="button" className={btn2} onClick={() => setF({ code: "", name: "", hodUserId: "", isActive: true })}>Cancel</button>}</div>
      </form>
      <Table head={["Code", "Name", "HOD", "Active", ""]} empty="No departments yet."
        rows={ws.departments.map((d: any) => [d.code, d.name, nameOf(ws.profiles, d.hod_user_id, "full_name"), d.is_active ? "Yes" : "No",
          <button key="e" className={btn2} onClick={() => setF({ id: d.id, code: d.code, name: d.name, hodUserId: d.hod_user_id ?? "", isActive: d.is_active })}>Edit</button>])} />
    </Card>
  );
}

function Programmes({ ws, run, busy }: Ctx) {
  const blank = { code: "", name: "", departmentId: "", durationYears: 3, isActive: true };
  const [f, setF] = useState<any>(blank);
  return (
    <Card title="Programmes">
      <form className="grid gap-3 sm:grid-cols-5" onSubmit={async (e) => { e.preventDefault(); if (await run(() => saveProgramme({ data: { ...f, durationYears: Number(f.durationYears) } }), "Programme saved.")) setF(blank); }}>
        <L label="Code"><input required className={input} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></L>
        <L label="Name"><input required className={input} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></L>
        <L label="Department"><select className={input} value={f.departmentId ?? ""} onChange={(e) => setF({ ...f, departmentId: e.target.value })}><option value="">— none —</option>{ws.departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></L>
        <L label="Years"><input type="number" step="0.5" className={input} value={f.durationYears} onChange={(e) => setF({ ...f, durationYears: e.target.value })} /></L>
        <div className="flex items-end gap-2"><button className={btn} disabled={busy}>{f.id ? "Update" : "Add"}</button>{f.id && <button type="button" className={btn2} onClick={() => setF(blank)}>Cancel</button>}</div>
      </form>
      <Table head={["Code", "Name", "Department", "Years", ""]} empty="No programmes yet."
        rows={ws.programmes.map((p: any) => [p.code, p.name, nameOf(ws.departments, p.department_id), p.duration_years ?? "—",
          <button key="e" className={btn2} onClick={() => setF({ id: p.id, code: p.code, name: p.name, departmentId: p.department_id ?? "", durationYears: p.duration_years ?? 3, isActive: p.is_active })}>Edit</button>])} />
    </Card>
  );
}

function Courses({ ws, run, busy }: Ctx) {
  const blank = { code: "", title: "", programmeId: "", level: "", semester: "First", creditUnits: 2, isActive: true };
  const [f, setF] = useState<any>(blank);
  return (
    <Card title="Courses">
      <form className="grid gap-3 sm:grid-cols-4" onSubmit={async (e) => { e.preventDefault(); if (await run(() => saveCourse({ data: { ...f, creditUnits: Number(f.creditUnits) } }), "Course saved.")) setF(blank); }}>
        <L label="Code"><input required className={input} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></L>
        <L label="Title"><input required className={input} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></L>
        <L label="Programme"><select className={input} value={f.programmeId ?? ""} onChange={(e) => setF({ ...f, programmeId: e.target.value })}><option value="">— all —</option>{ws.programmes.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></L>
        <L label="Level"><input className={input} value={f.level} onChange={(e) => setF({ ...f, level: e.target.value })} /></L>
        <L label="Semester"><select className={input} value={f.semester} onChange={(e) => setF({ ...f, semester: e.target.value })}><option>First</option><option>Second</option></select></L>
        <L label="Credit units"><select className={input} value={f.creditUnits} onChange={(e) => setF({ ...f, creditUnits: e.target.value })}>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n}>{n}</option>)}</select></L>
        <L label="Active"><select className={input} value={f.isActive ? "1" : "0"} onChange={(e) => setF({ ...f, isActive: e.target.value === "1" })}><option value="1">Yes</option><option value="0">No</option></select></L>
        <div className="flex items-end gap-2"><button className={btn} disabled={busy}>{f.id ? "Update" : "Add"}</button>{f.id && <button type="button" className={btn2} onClick={() => setF(blank)}>Cancel</button>}</div>
      </form>
      <Table head={["Code", "Title", "Programme", "Level", "Sem.", "CU", ""]} empty="No courses yet."
        rows={ws.courses.map((c: any) => [c.code, c.title, nameOf(ws.programmes, c.programme_id), c.level ?? "—", c.semester ?? "—", c.credit_units,
          <button key="e" className={btn2} onClick={() => setF({ id: c.id, code: c.code, title: c.title, programmeId: c.programme_id ?? "", level: c.level ?? "", semester: c.semester ?? "First", creditUnits: c.credit_units ?? 2, isActive: c.is_active })}>Edit</button>])} />
    </Card>
  );
}

function Staff({ ws, run, busy }: Ctx) {
  const blank = { email: "", fullName: "", role: "lecturer", departmentId: "", designation: "", staffNumber: "" };
  const [f, setF] = useState<any>(blank);
  const [q, setQ] = useState("");
  const grantable = ws.isSuper ? ALL_ROLES : [...OPERATIONAL_ROLES];
  const rolesOf = (id: string) => ws.userRoles.filter((r: any) => r.user_id === id).map((r: any) => r.role);
  const staff = ws.profiles.filter((p: any) => rolesOf(p.id).length && (!q || `${p.full_name} ${p.email}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="grid gap-6">
      <Card title="Invite a lecturer or staff member">
        <p className="text-sm text-muted-foreground">They receive an email to set their own password, then sign in at the Staff Portal. If the email already has an account, the role is simply added.</p>
        <form className="grid gap-3 sm:grid-cols-3" onSubmit={async (e) => { e.preventDefault(); if (await run(() => inviteStaff({ data: { ...f, redirectTo: `${window.location.origin}/reset-password` } }), "Staff member saved. If they are new, an invitation email has been sent.")) setF(blank); }}>
          <L label="Full name *"><input required className={input} value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} /></L>
          <L label="Email *"><input required type="email" className={input} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></L>
          <L label="Role"><select className={input} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{grantable.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}</select></L>
          <L label="Department"><select className={input} value={f.departmentId} onChange={(e) => setF({ ...f, departmentId: e.target.value })}><option value="">— none —</option>{ws.departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></L>
          <L label="Designation"><input className={input} value={f.designation} onChange={(e) => setF({ ...f, designation: e.target.value })} /></L>
          <L label="Staff number"><input className={input} value={f.staffNumber} onChange={(e) => setF({ ...f, staffNumber: e.target.value })} /></L>
          <div><button className={btn} disabled={busy}>{busy ? "Sending…" : "Invite / save"}</button></div>
        </form>
      </Card>
      <Card title="Staff and roles">
        <input className={input} placeholder="Search staff by name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <Table head={["Name", "Email", "Department", "Roles"]} empty="No staff accounts found."
          rows={staff.map((p: any) => {
            const sp = ws.staffProfiles.find((s: any) => s.user_id === p.id);
            const has = rolesOf(p.id);
            return [p.full_name || "—", p.email, nameOf(ws.departments, sp?.department_id ?? null),
              <div key="r" className="flex flex-wrap gap-1">
                {has.map((r: string) => <span key={r} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs">{r.replace(/_/g, " ")}{grantable.includes(r) && <button aria-label={`Remove ${r}`} className="text-destructive" onClick={() => { if (confirm(`Remove the ${r} role?`)) void run(() => setUserRole({ data: { userId: p.id, role: r, grant: false } }), "Role removed."); }}>×</button>}</span>)}
                <select className="rounded border border-input bg-background px-1 text-xs" value="" disabled={busy} onChange={(e) => e.target.value && run(() => setUserRole({ data: { userId: p.id, role: e.target.value, grant: true } }), "Role added.")}>
                  <option value="">+ add role</option>{grantable.filter((r) => !has.includes(r)).map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
                </select>
              </div>];
          })} />
      </Card>
    </div>
  );
}

function Allocation({ ws, run, busy }: Ctx) {
  const lecturers = ws.profiles.filter((p: any) => ws.userRoles.some((r: any) => r.user_id === p.id && ["lecturer", "hod"].includes(r.role)));
  const [f, setF] = useState({ courseId: "", lecturerUserId: "", session: currentSession(ws) });
  return (
    <Card title="Course allocation">
      <form className="grid gap-3 sm:grid-cols-4" onSubmit={(e) => { e.preventDefault(); void run(() => saveAssignment({ data: f }), "Course allocated."); }}>
        <L label="Course"><select required className={input} value={f.courseId} onChange={(e) => setF({ ...f, courseId: e.target.value })}><option value="">— choose —</option>{ws.courses.map((c: any) => <option key={c.id} value={c.id}>{c.code} — {c.title}</option>)}</select></L>
        <L label="Lecturer"><select required className={input} value={f.lecturerUserId} onChange={(e) => setF({ ...f, lecturerUserId: e.target.value })}><option value="">— choose —</option>{lecturers.map((p: any) => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}</select></L>
        <L label="Session"><input className={input} value={f.session} onChange={(e) => setF({ ...f, session: e.target.value })} /></L>
        <div className="flex items-end"><button className={btn} disabled={busy}>Allocate</button></div>
      </form>
      {!lecturers.length && <p className="text-sm text-muted-foreground">No lecturers yet — invite one in “Staff & Roles”.</p>}
      <Table head={["Course", "Lecturer", "Session", ""]} empty="No courses allocated yet."
        rows={ws.assignments.map((a: any) => [nameOf(ws.courses, a.course_id, "code"), nameOf(ws.profiles, a.lecturer_user_id, "full_name"), a.session ?? "—",
          <button key="x" className={btn2} onClick={() => { if (confirm("Remove this allocation?")) void run(() => saveAssignment({ data: { remove: a.id } }), "Allocation removed."); }}>Remove</button>])} />
    </Card>
  );
}

function Sessions({ ws, run, busy }: Ctx) {
  const y = new Date().getFullYear();
  const [f, setF] = useState({ name: `${y}/${y + 1}`, semester: "First", makeCurrent: true });
  return (
    <Card title="Academic sessions and semesters">
      <form className="grid gap-3 sm:grid-cols-4" onSubmit={(e) => { e.preventDefault(); void run(() => saveSession({ data: f }), "Session saved."); }}>
        <L label="Session"><input className={input} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></L>
        <L label="Current semester"><select className={input} value={f.semester} onChange={(e) => setF({ ...f, semester: e.target.value })}><option>First</option><option>Second</option></select></L>
        <label className="flex items-end gap-2 text-sm"><input type="checkbox" checked={f.makeCurrent} onChange={(e) => setF({ ...f, makeCurrent: e.target.checked })} /> Make this the current session</label>
        <div className="flex items-end"><button className={btn} disabled={busy}>Save</button></div>
      </form>
      <Table head={["Session", "Semester", "Current"]} empty="No sessions recorded yet."
        rows={ws.sessions.map((s: any) => [s.name, s.current_semester, s.is_current ? "✓ Current" : ""])} />
    </Card>
  );
}

function Audit({ ws }: Ctx) {
  return (
    <Card title="Recent student record changes">
      <Table head={["When", "Student", "Change", "From", "To", "Reason", "By"]} empty="No changes recorded yet."
        rows={ws.changes.map((c: any) => [new Date(c.created_at).toLocaleString(), nameOf(ws.students, c.student_id, "full_name"), c.field, c.old_value ?? "—", c.new_value ?? "—", c.reason ?? "—", nameOf(ws.profiles, c.actor_id, "full_name")])} />
    </Card>
  );
}
