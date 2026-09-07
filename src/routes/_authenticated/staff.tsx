import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import {
  deleteNewsPost,
  deleteTimetableEntry,
  getAttendanceSheet,
  getAttendanceSummary,
  getCourseSheet,
  getResultAudit,
  getStaffWorkspace,
  getStudentAcademics,
  listMessages,
  listNewsPosts,
  listResultSubmissions,
  listStaffDirectory,
  listTimetable,
  reviewResults,
  saveAttendance,
  saveCourseResults,
  saveNewsPost,
  saveTimetableEntry,
  searchStudents,
  sendMessage,
} from "@/lib/staff.functions";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const Route = createFileRoute("/_authenticated/staff")({
  head: () => ({
    meta: [
      { title: "Staff Workspace — Zenith College of Health Science, Jos" },
      {
        name: "description",
        content:
          "Secure staff workspace for results, attendance, timetables, students, news and internal communication.",
      },
      { property: "og:title", content: "Staff Workspace — Zenith College, Jos" },
      { property: "og:description", content: "Internal staff tools." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StaffWorkspace,
});

const TABS = [
  "Overview",
  "Upload Results",
  "Approvals",
  "Students",
  "Attendance",
  "Timetable",
  "News Update",
  "Internal Communication",
] as const;
type Tab = (typeof TABS)[number];

const CURRENT_SESSION = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;

/* --------------------------------- shared -------------------------------- */

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      {title && <h2 className="font-display text-lg font-bold">{title}</h2>}
      <div className={title ? "mt-4" : ""}>{children}</div>
    </section>
  );
}

function Notice({ text, tone = "muted" }: { text: string; tone?: "muted" | "error" | "ok" }) {
  const cls =
    tone === "error"
      ? "text-destructive"
      : tone === "ok"
        ? "text-primary"
        : "text-muted-foreground";
  return <p className={`text-sm font-medium ${cls}`}>{text}</p>;
}

const inputClass =
  "rounded-lg border border-input bg-background px-3 py-2 text-sm w-full min-w-0";

function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
      {children}
    </label>
  );
}

function SessionControls({
  session,
  setSession,
  semester,
  setSemester,
}: {
  session: string;
  setSession: (v: string) => void;
  semester: string;
  setSemester: (v: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Labelled label="Academic session">
        <input className={inputClass} value={session} onChange={(e) => setSession(e.target.value)} />
      </Labelled>
      <Labelled label="Semester">
        <select
          className={inputClass}
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
        >
          <option>First</option>
          <option>Second</option>
        </select>
      </Labelled>
    </div>
  );
}

/* -------------------------------- workspace ------------------------------- */

function StaffWorkspace() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("Overview");
  const [ws, setWs] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStaffWorkspace()
      .then(setWs)
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load the staff portal."));
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    void navigate({ to: "/staff-portal", replace: true });
  }

  if (error) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="font-display text-2xl font-bold">Staff Workspace</h1>
        <p className="mt-3 text-sm text-destructive">{error}</p>
        <button onClick={signOut} className="mt-6 text-sm font-semibold text-primary">
          Sign out
        </button>
      </section>
    );
  }
  if (!ws) return <section className="px-4 py-20 text-center text-sm">Loading…</section>;

  if (!ws.isStaff) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="font-display text-2xl font-bold">Staff Workspace</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your account has no staff role yet. Please contact the ICT Centre or the Registrar to be
          assigned a role.
        </p>
        <button onClick={signOut} className="mt-6 text-sm font-semibold text-primary">
          Sign out
        </button>
      </section>
    );
  }

  const visible = TABS.filter((t) => {
    if (t === "Approvals") return ws.canReview;
    return true;
  });

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Staff Portal</p>
          <h1 className="font-display text-2xl font-bold">
            {ws.profile?.full_name || ws.profile?.email || "Staff member"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Roles: {ws.roles.join(", ").replace(/_/g, " ") || "none"}
            {ws.staffProfile?.designation ? ` · ${ws.staffProfile.designation}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm font-semibold text-primary hover:underline">
            College website
          </Link>
          <button onClick={signOut} className="text-sm font-semibold text-primary hover:underline">
            Sign out
          </button>
        </div>
      </header>

      <nav className="mt-8 flex gap-2 overflow-x-auto border-b border-border pb-px">
        {visible.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-semibold ${
              tab === t
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      <div className="mt-8 grid gap-6">
        {tab === "Overview" && <Overview ws={ws} />}
        {tab === "Upload Results" && <UploadResults ws={ws} />}
        {tab === "Approvals" && ws.canReview && <Approvals />}
        {tab === "Students" && <ManageStudents />}
        {tab === "Attendance" && <Attendance ws={ws} />}
        {tab === "Timetable" && <Timetable ws={ws} />}
        {tab === "News Update" && <NewsUpdate />}
        {tab === "Internal Communication" && <Communication />}
      </div>
    </section>
  );
}

/* -------------------------------- overview -------------------------------- */

function Overview({ ws }: { ws: any }) {
  const [audit, setAudit] = useState<any[]>([]);
  useEffect(() => {
    getResultAudit({ data: { limit: 15 } })
      .then((r: any) => setAudit(r))
      .catch(() => setAudit([]));
  }, []);

  return (
    <>
      <Card title="Your access">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs uppercase text-muted-foreground">Courses you can work with</p>
            <p className="mt-1 font-display text-2xl font-bold">{ws.courses.length}</p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs uppercase text-muted-foreground">Courses assigned to you</p>
            <p className="mt-1 font-display text-2xl font-bold">{ws.assignedCourseIds.length}</p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs uppercase text-muted-foreground">Result review rights</p>
            <p className="mt-1 font-display text-2xl font-bold">{ws.canReview ? "Yes" : "No"}</p>
          </div>
        </div>
        {ws.courses.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            No courses are currently assigned to you. The Registry assigns courses to lecturers.
          </p>
        )}
      </Card>

      <Card title="Recent result activity">
        {audit.length === 0 ? (
          <Notice text="No result activity has been recorded yet." />
        ) : (
          <ul className="grid gap-2 text-sm">
            {audit.map((a) => (
              <li key={a.id} className="rounded-lg border border-border px-4 py-2.5">
                <span className="font-semibold capitalize">{a.action}</span> · {a.course} ·{" "}
                {a.score ?? "—"} · by {a.actor} ·{" "}
                {new Date(a.at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

/* ----------------------------- upload results ----------------------------- */

const GRADE_TABLE = [
  { range: "70 – 100", grade: "A", point: "4.00" },
  { range: "60 – 69", grade: "B", point: "3.00" },
  { range: "50 – 59", grade: "C", point: "2.00" },
  { range: "40 – 49", grade: "D", point: "1.00" },
  { range: "0 – 39", grade: "F", point: "0.00" },
];

function gradeOf(score: number) {
  if (score >= 70) return { grade: "A", point: 4 };
  if (score >= 60) return { grade: "B", point: 3 };
  if (score >= 50) return { grade: "C", point: 2 };
  if (score >= 40) return { grade: "D", point: 1 };
  return { grade: "F", point: 0 };
}

function UploadResults({ ws }: { ws: any }) {
  const [courseId, setCourseId] = useState<string>(ws.courses[0]?.id ?? "");
  const [session, setSession] = useState(CURRENT_SESSION);
  const [semester, setSemester] = useState("First");
  const [sheet, setSheet] = useState<any>(null);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [units, setUnits] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!courseId) return;
    setStatus(null);
    try {
      const data: any = await getCourseSheet({ data: { courseId, session, semester: semester as any } });
      setSheet(data);
      const s: Record<string, string> = {};
      const u: Record<string, string> = {};
      for (const row of data.rows) {
        s[row.studentId] = row.result ? String(Number(row.result.score)) : "";
        u[row.studentId] = String(row.result?.credit_unit ?? data.creditUnits ?? 1);
      }
      setScores(s);
      setUnits(u);
    } catch (e) {
      setSheet(null);
      setStatus(e instanceof Error ? e.message : "Unable to load the course sheet.");
    }
  }, [courseId, session, semester]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    let cu = 0;
    let qp = 0;
    for (const row of sheet?.rows ?? []) {
      const raw = scores[row.studentId];
      if (raw === "" || raw === undefined) continue;
      const unit = Number(units[row.studentId] || 1);
      cu += unit;
      qp += gradeOf(Number(raw)).point * unit;
    }
    return { cu, qp, gpa: cu > 0 ? Math.min(4, qp / cu) : 0 };
  }, [sheet, scores, units]);

  async function save(submit: boolean) {
    setBusy(true);
    setStatus(null);
    try {
      const entries = (sheet?.rows ?? [])
        .filter((r: any) => scores[r.studentId] !== "" && scores[r.studentId] !== undefined)
        .map((r: any) => ({
          studentId: r.studentId,
          score: Number(scores[r.studentId]),
          creditUnit: Number(units[r.studentId] || 1),
        }));
      if (entries.length === 0) throw new Error("Enter at least one score.");
      const res: any = await saveCourseResults({
        data: { courseId, session, semester: semester as any, submit, entries },
      });
      setStatus(
        `${res.saved} result(s) ${submit ? "submitted for HOD approval" : "saved as draft"}.` +
          (res.locked ? ` ${res.locked} already-approved result(s) were left untouched.` : ""),
      );
      await load();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not save the results.");
    } finally {
      setBusy(false);
    }
  }

  if (ws.courses.length === 0)
    return (
      <Card title="Upload Results">
        <Notice text="You have no assigned courses, so there are no results to upload." />
      </Card>
    );

  return (
    <>
      <Card title="Upload Results">
        <div className="grid gap-3 sm:grid-cols-3">
          <Labelled label="Course">
            <select
              className={inputClass}
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            >
              {ws.courses.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.title}
                </option>
              ))}
            </select>
          </Labelled>
          <Labelled label="Academic session">
            <input
              className={inputClass}
              value={session}
              onChange={(e) => setSession(e.target.value)}
            />
          </Labelled>
          <Labelled label="Semester">
            <select
              className={inputClass}
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            >
              <option>First</option>
              <option>Second</option>
            </select>
          </Labelled>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2">Student</th>
                <th>Matric No.</th>
                <th>Credit unit</th>
                <th>Score</th>
                <th>Grade</th>
                <th>Grade point</th>
                <th>Quality point</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(sheet?.rows ?? []).map((r: any) => {
                const raw = scores[r.studentId] ?? "";
                const unit = Number(units[r.studentId] || 1);
                const g = raw === "" ? null : gradeOf(Number(raw));
                return (
                  <tr key={r.studentId} className="border-t border-border">
                    <td className="py-2 font-medium">{r.fullName}</td>
                    <td>{r.matricNumber ?? "—"}</td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        max={12}
                        className="w-16 rounded border border-input bg-background px-2 py-1"
                        value={units[r.studentId] ?? "1"}
                        onChange={(e) =>
                          setUnits((u) => ({ ...u, [r.studentId]: e.target.value }))
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="w-20 rounded border border-input bg-background px-2 py-1"
                        value={raw}
                        onChange={(e) =>
                          setScores((s) => ({ ...s, [r.studentId]: e.target.value }))
                        }
                        disabled={r.result?.status === "approved"}
                      />
                    </td>
                    <td>{g?.grade ?? "—"}</td>
                    <td>{g ? g.point.toFixed(2) : "—"}</td>
                    <td>{g ? (g.point * unit).toFixed(2) : "—"}</td>
                    <td className="capitalize">{r.result?.status ?? "not entered"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {(sheet?.rows ?? []).length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            No student has registered for this course in {session}, {semester} semester.
          </p>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs uppercase text-muted-foreground">Total credit units</p>
            <p className="font-display text-xl font-bold">{totals.cu}</p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs uppercase text-muted-foreground">Total quality points</p>
            <p className="font-display text-xl font-bold">{totals.qp.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs uppercase text-muted-foreground">Class GPA (max 4.00)</p>
            <p className="font-display text-xl font-bold">{totals.gpa.toFixed(2)}</p>
          </div>
        </div>

        {status && <p className="mt-4 text-sm font-medium text-primary">{status}</p>}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            disabled={busy}
            onClick={() => void save(false)}
            className="rounded-lg border border-primary px-5 py-2.5 text-sm font-semibold text-primary disabled:opacity-60"
          >
            Save draft
          </button>
          <button
            disabled={busy}
            onClick={() => void save(true)}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            Submit for HOD approval
          </button>
        </div>
      </Card>

      <Card title="Zenith College grading system">
        <table className="text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="pr-8 py-1">Score</th>
              <th className="pr-8">Grade</th>
              <th>Grade point</th>
            </tr>
          </thead>
          <tbody>
            {GRADE_TABLE.map((g) => (
              <tr key={g.grade} className="border-t border-border">
                <td className="py-1.5 pr-8">{g.range}</td>
                <td className="pr-8">{g.grade}</td>
                <td>{g.point}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-sm text-muted-foreground">
          Quality point = credit unit × grade point. GPA = total quality points ÷ total credit
          units. CGPA is cumulative. Maximum 4.00.
        </p>
      </Card>
    </>
  );
}

/* -------------------------------- approvals ------------------------------- */

function Approvals() {
  const [batches, setBatches] = useState<any[]>([]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res: any = await listResultSubmissions();
    setBatches(res.batches);
  }, []);

  useEffect(() => {
    void load().catch(() => setBatches([]));
  }, [load]);

  async function act(batch: any, action: "approve" | "reject") {
    setBusy(true);
    setStatus(null);
    try {
      const res: any = await reviewResults({
        data: { ids: batch.rows.map((r: any) => r.id), action, notes },
      });
      setStatus(`${res.count} result(s) ${action === "approve" ? "approved and published" : "returned to the lecturer"}.`);
      setNotes("");
      await load();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Review failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Result approvals">
      {status && <p className="mb-4 text-sm font-medium text-primary">{status}</p>}
      {batches.length === 0 ? (
        <Notice text="No results are awaiting review." />
      ) : (
        <div className="grid gap-5">
          <Labelled label="Review note (optional)">
            <textarea
              className={inputClass}
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Labelled>
          {batches.map((b) => (
            <div key={b.key} className="rounded-xl border border-border p-5">
              <h3 className="font-display font-bold">
                {b.courseCode} — {b.courseTitle}
              </h3>
              <p className="text-sm text-muted-foreground">
                {b.session} · {b.semester} semester · {b.rows.length} result(s) · {b.status}
              </p>
              <ul className="mt-3 grid gap-1 text-sm">
                {b.rows.map((r: any) => (
                  <li key={r.id}>
                    {r.student} ({r.matric ?? "—"}) · {r.score} · {r.grade}
                  </li>
                ))}
              </ul>
              {b.ownEntry ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  You entered these results, so you cannot approve them. Another reviewer must act.
                </p>
              ) : (
                <div className="mt-4 flex gap-3">
                  <button
                    disabled={busy}
                    onClick={() => void act(b, "approve")}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                  >
                    Approve &amp; publish
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => void act(b, "reject")}
                    className="rounded-lg border border-destructive px-4 py-2 text-sm font-semibold text-destructive disabled:opacity-60"
                  >
                    Return for correction
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ----------------------------- manage students ---------------------------- */

function ManageStudents() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [detail, setDetail] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (q: string) => {
    try {
      setRows(await searchStudents({ data: { query: q } }));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load students.");
    }
  }, []);

  useEffect(() => {
    void load("");
  }, [load]);

  async function open(id: string) {
    setDetail(null);
    try {
      setDetail(await getStudentAcademics({ data: { studentId: id } }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to open this student.");
    }
  }

  return (
    <>
      <Card title="Manage Students">
        <form
          className="flex gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void load(query);
          }}
        >
          <input
            className={inputClass}
            placeholder="Search by name or matriculation number"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
            Search
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        {rows.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No students are visible to your role for this search.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2">Name</th>
                  <th>Matric No.</th>
                  <th>Programme</th>
                  <th>Level</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="py-2 font-medium">{s.fullName}</td>
                    <td>{s.matricNumber ?? "—"}</td>
                    <td>{s.programme ?? "—"}</td>
                    <td>{s.level ?? "—"}</td>
                    <td className="capitalize">{s.status}</td>
                    <td>
                      <button
                        onClick={() => void open(s.id)}
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        View record
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {detail && (
        <Card title={`Academic record — ${detail.student?.full_name ?? ""}`}>
          {detail.semesters.length === 0 ? (
            <Notice text="No approved result is currently available for this student." />
          ) : (
            <div className="grid gap-5">
              {detail.semesters.map((s: any) => (
                <div key={`${s.session}-${s.semester}`} className="rounded-xl border border-border p-5">
                  <h3 className="font-display font-bold">
                    {s.session} · {s.semester} semester
                  </h3>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[560px] text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                          <th className="py-1">Code</th>
                          <th>Title</th>
                          <th>CU</th>
                          <th>Score</th>
                          <th>Grade</th>
                          <th>GP</th>
                          <th>QP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {s.courses.map((c: any) => (
                          <tr key={c.code} className="border-t border-border">
                            <td className="py-1.5">{c.code}</td>
                            <td>{c.title}</td>
                            <td>{c.creditUnit}</td>
                            <td>{c.score}</td>
                            <td>{c.grade}</td>
                            <td>{c.gradePoint.toFixed(2)}</td>
                            <td>{c.qualityPoint.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 text-sm">
                    TCU {s.totalCreditUnits} · TQP {s.totalQualityPoints} · GPA{" "}
                    <strong>{s.gpa.toFixed(2)}</strong> · Cumulative CU {s.cumulativeCreditUnits} ·
                    Cumulative QP {s.cumulativeQualityPoints} · CGPA{" "}
                    <strong>{s.cgpa.toFixed(2)}</strong>
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </>
  );
}

/* -------------------------------- attendance ------------------------------ */

function Attendance({ ws }: { ws: any }) {
  const [courseId, setCourseId] = useState<string>(ws.courses[0]?.id ?? "");
  const [session, setSession] = useState(CURRENT_SESSION);
  const [semester, setSemester] = useState("First");
  const [classDate, setClassDate] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<any[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!courseId) return;
    try {
      const sheet: any = await getAttendanceSheet({
        data: { courseId, session, semester: semester as any, classDate },
      });
      setRows(sheet);
      const m: Record<string, string> = {};
      for (const r of sheet) m[r.studentId] = r.status;
      setMarks(m);
      setSummary(
        await getAttendanceSummary({ data: { courseId, session, semester: semester as any } }),
      );
      setStatus(null);
    } catch (e) {
      setRows([]);
      setStatus(e instanceof Error ? e.message : "Unable to load the register.");
    }
  }, [courseId, session, semester, classDate]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    try {
      const res: any = await saveAttendance({
        data: {
          courseId,
          session,
          semester: semester as any,
          classDate,
          entries: rows.map((r) => ({ studentId: r.studentId, status: (marks[r.studentId] ?? "present") as any })),
        },
      });
      setStatus(`Attendance saved for ${res.count} student(s).`);
      await load();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not save attendance.");
    }
  }

  if (ws.courses.length === 0)
    return (
      <Card title="Attendance">
        <Notice text="You have no assigned courses, so there is no register to take." />
      </Card>
    );

  return (
    <>
      <Card title="Attendance register">
        <div className="grid gap-3 sm:grid-cols-4">
          <Labelled label="Course">
            <select className={inputClass} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              {ws.courses.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </select>
          </Labelled>
          <Labelled label="Session">
            <input className={inputClass} value={session} onChange={(e) => setSession(e.target.value)} />
          </Labelled>
          <Labelled label="Semester">
            <select className={inputClass} value={semester} onChange={(e) => setSemester(e.target.value)}>
              <option>First</option>
              <option>Second</option>
            </select>
          </Labelled>
          <Labelled label="Class date">
            <input
              type="date"
              className={inputClass}
              value={classDate}
              onChange={(e) => setClassDate(e.target.value)}
            />
          </Labelled>
        </div>

        {rows.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No student is registered for this course in the selected session and semester.
          </p>
        ) : (
          <div className="mt-6 grid gap-2">
            {rows.map((r) => (
              <div
                key={r.studentId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-2.5 text-sm"
              >
                <span className="font-medium">
                  {r.fullName} <span className="text-muted-foreground">{r.matricNumber ?? ""}</span>
                </span>
                <select
                  className="rounded border border-input bg-background px-2 py-1"
                  value={marks[r.studentId] ?? "present"}
                  onChange={(e) => setMarks((m) => ({ ...m, [r.studentId]: e.target.value }))}
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="excused">Excused</option>
                </select>
              </div>
            ))}
            <button
              onClick={() => void save()}
              className="mt-3 justify-self-start rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Save register
            </button>
          </div>
        )}
        {status && <p className="mt-4 text-sm font-medium text-primary">{status}</p>}
      </Card>

      {summary.length > 0 && (
        <Card title="Attendance summary">
          <ul className="grid gap-2 text-sm">
            {summary.map((s) => (
              <li key={s.studentId} className="rounded-lg border border-border px-4 py-2.5">
                {s.fullName} — {s.present}/{s.classes} classes ({s.percentage}%)
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}

/* -------------------------------- timetable ------------------------------- */

function Timetable({ ws }: { ws: any }) {
  const [data, setData] = useState<any>(null);
  const [form, setForm] = useState({
    courseId: ws.courses[0]?.id ?? "",
    programmeId: "",
    departmentId: "",
    level: "",
    session: CURRENT_SESSION,
    semester: "First",
    day: "Monday",
    start: "08:00",
    end: "10:00",
    venue: "",
    kind: "lecture",
  });
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(async () => setData(await listTimetable()), []);
  useEffect(() => {
    void load().catch(() => setData({ entries: [], canEdit: false }));
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    try {
      await saveTimetableEntry({ data: form as any });
      setStatus("Timetable entry added.");
      await load();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not save the entry.");
    }
  }

  if (!data) return <Card>Loading…</Card>;

  return (
    <>
      <Card title="Timetable">
        {data.entries.length === 0 ? (
          <Notice text="No timetable entry has been published yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2">Day</th>
                  <th>Time</th>
                  <th>Course</th>
                  <th>Programme</th>
                  <th>Level</th>
                  <th>Venue</th>
                  <th>Type</th>
                  {data.canEdit && <th />}
                </tr>
              </thead>
              <tbody>
                {data.entries.map((e: any) => (
                  <tr key={e.id} className="border-t border-border">
                    <td className="py-2">{e.day}</td>
                    <td>
                      {e.start}–{e.end}
                    </td>
                    <td>{e.course}</td>
                    <td>{e.programme ?? "—"}</td>
                    <td>{e.level ?? "—"}</td>
                    <td>{e.venue ?? "—"}</td>
                    <td className="capitalize">{e.kind}</td>
                    {data.canEdit && (
                      <td>
                        <button
                          className="text-sm font-semibold text-destructive hover:underline"
                          onClick={async () => {
                            await deleteTimetableEntry({ data: { id: e.id } });
                            await load();
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {data.canEdit && (
        <Card title="Add a timetable entry">
          <form className="grid gap-3 sm:grid-cols-3" onSubmit={add}>
            <Labelled label="Course">
              <select
                className={inputClass}
                value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
              >
                {ws.courses.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.title}
                  </option>
                ))}
              </select>
            </Labelled>
            <Labelled label="Programme">
              <select
                className={inputClass}
                value={form.programmeId}
                onChange={(e) => setForm({ ...form, programmeId: e.target.value })}
              >
                <option value="">—</option>
                {ws.programmes.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Labelled>
            <Labelled label="Department">
              <select
                className={inputClass}
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              >
                <option value="">—</option>
                {ws.departments.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Labelled>
            <Labelled label="Level">
              <input
                className={inputClass}
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
              />
            </Labelled>
            <Labelled label="Session">
              <input
                className={inputClass}
                value={form.session}
                onChange={(e) => setForm({ ...form, session: e.target.value })}
              />
            </Labelled>
            <Labelled label="Semester">
              <select
                className={inputClass}
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
              >
                <option>First</option>
                <option>Second</option>
              </select>
            </Labelled>
            <Labelled label="Day">
              <select
                className={inputClass}
                value={form.day}
                onChange={(e) => setForm({ ...form, day: e.target.value })}
              >
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </Labelled>
            <Labelled label="Start time">
              <input
                type="time"
                className={inputClass}
                value={form.start}
                onChange={(e) => setForm({ ...form, start: e.target.value })}
              />
            </Labelled>
            <Labelled label="End time">
              <input
                type="time"
                className={inputClass}
                value={form.end}
                onChange={(e) => setForm({ ...form, end: e.target.value })}
              />
            </Labelled>
            <Labelled label="Venue">
              <input
                className={inputClass}
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
              />
            </Labelled>
            <Labelled label="Type">
              <select
                className={inputClass}
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value })}
              >
                <option value="lecture">Lecture</option>
                <option value="practical">Practical</option>
                <option value="examination">Examination</option>
              </select>
            </Labelled>
            <div className="flex items-end">
              <button className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
                Add entry
              </button>
            </div>
          </form>
          {status && <p className="mt-3 text-sm font-medium text-primary">{status}</p>}
        </Card>
      )}
    </>
  );
}

/* ---------------------------------- news ---------------------------------- */

function NewsUpdate() {
  const [data, setData] = useState<any>(null);
  const [form, setForm] = useState({ id: "", title: "", body: "", category: "announcement" });
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(async () => setData(await listNewsPosts()), []);
  useEffect(() => {
    void load().catch(() => setData({ posts: [], canPublish: false }));
  }, [load]);

  async function submit(publish: boolean) {
    setStatus(null);
    try {
      await saveNewsPost({ data: { ...form, publish } });
      setStatus(publish ? "Announcement published to the website." : "Draft saved.");
      setForm({ id: "", title: "", body: "", category: "announcement" });
      await load();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not save the announcement.");
    }
  }

  if (!data) return <Card>Loading…</Card>;

  return (
    <>
      <Card title={form.id ? "Edit announcement" : "New announcement"}>
        <div className="grid gap-3">
          <Labelled label="Title">
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Labelled>
          <Labelled label="Category">
            <input
              className={inputClass}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </Labelled>
          <Labelled label="Body">
            <textarea
              rows={5}
              className={inputClass}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
          </Labelled>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => void submit(false)}
              className="rounded-lg border border-primary px-5 py-2.5 text-sm font-semibold text-primary"
            >
              Save draft
            </button>
            {data.canPublish && (
              <button
                onClick={() => void submit(true)}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Publish to website
              </button>
            )}
            {form.id && (
              <button
                onClick={() => setForm({ id: "", title: "", body: "", category: "announcement" })}
                className="text-sm font-semibold text-muted-foreground"
              >
                Cancel edit
              </button>
            )}
          </div>
          {status && <p className="text-sm font-medium text-primary">{status}</p>}
        </div>
      </Card>

      <Card title="Announcements">
        {data.posts.length === 0 ? (
          <Notice text="No announcement has been created yet." />
        ) : (
          <ul className="grid gap-3">
            {data.posts.map((p: any) => (
              <li key={p.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-display font-bold">{p.title}</p>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      {p.category} · {p.is_published ? "Published" : "Draft"}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <button
                      className="text-sm font-semibold text-primary hover:underline"
                      onClick={() =>
                        setForm({ id: p.id, title: p.title, body: p.body, category: p.category })
                      }
                    >
                      Edit
                    </button>
                    <button
                      className="text-sm font-semibold text-destructive hover:underline"
                      onClick={async () => {
                        await deleteNewsPost({ data: { id: p.id } });
                        await load();
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{p.body}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

/* ---------------------------- internal messages --------------------------- */

function Communication() {
  const [data, setData] = useState<any>(null);
  const [directory, setDirectory] = useState<any[]>([]);
  const [form, setForm] = useState<{
    subject: string;
    body: string;
    audience: string[];
    recipientUserId: string;
  }>({ subject: "", body: "", audience: [], recipientUserId: "" });
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(async () => setData(await listMessages()), []);
  useEffect(() => {
    void load().catch(() => setData({ messages: [], roles: [] }));
    listStaffDirectory()
      .then((d: any) => setDirectory(d))
      .catch(() => setDirectory([]));
  }, [load]);

  async function send() {
    setStatus(null);
    try {
      await sendMessage({ data: form as any });
      setStatus("Message sent.");
      setForm({ subject: "", body: "", audience: [], recipientUserId: "" });
      await load();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not send the message.");
    }
  }

  if (!data) return <Card>Loading…</Card>;

  return (
    <>
      <Card title="Send an internal message">
        <div className="grid gap-3">
          <Labelled label="Subject">
            <input
              className={inputClass}
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </Labelled>
          <Labelled label="Message">
            <textarea
              rows={4}
              className={inputClass}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
          </Labelled>
          <fieldset className="grid gap-2">
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Role audience
            </legend>
            <div className="flex flex-wrap gap-3 text-sm">
              {(data.roles ?? []).map((r: string) => (
                <label key={r} className="flex items-center gap-2 capitalize">
                  <input
                    type="checkbox"
                    checked={form.audience.includes(r)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        audience: e.target.checked
                          ? [...form.audience, r]
                          : form.audience.filter((x) => x !== r),
                      })
                    }
                  />
                  {r.replace(/_/g, " ")}
                </label>
              ))}
            </div>
          </fieldset>
          {directory.length > 0 && (
            <Labelled label="Or one colleague">
              <select
                className={inputClass}
                value={form.recipientUserId}
                onChange={(e) => setForm({ ...form, recipientUserId: e.target.value })}
              >
                <option value="">—</option>
                {directory.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name || p.email}
                  </option>
                ))}
              </select>
            </Labelled>
          )}
          <button
            onClick={() => void send()}
            className="justify-self-start rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Send message
          </button>
          {status && <p className="text-sm font-medium text-primary">{status}</p>}
        </div>
      </Card>

      <Card title="Inbox">
        {data.messages.length === 0 ? (
          <Notice text="No internal message is available to you yet." />
        ) : (
          <ul className="grid gap-3">
            {data.messages.map((m: any) => (
              <li key={m.id} className="rounded-xl border border-border p-4">
                <p className="font-display font-bold">{m.subject}</p>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {m.sentByMe ? "Sent by you" : `From ${m.sender}`} ·{" "}
                  {m.direct ? "Direct message" : (m.audience ?? []).join(", ").replace(/_/g, " ")} ·{" "}
                  {new Date(m.at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                </p>
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{m.body}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
