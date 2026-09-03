/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import logo from "@/assets/logo.png.asset.json";
import { PageHero, Section } from "@/components/site/PageHero";
import {
  declarePayment,
  getAdmissionLetter,
  getCourseRegistration,
  getExamCard,
  getFees,
  getResults,
  portalSignIn,
  registerCourses,
} from "@/lib/portal.functions";

export const Route = createFileRoute("/student-portal")({
  head: () => ({
    meta: [
      { title: "Student Portal — Admission, Courses & Results | Zenith College, Jos" },
      {
        name: "description",
        content:
          "Sign in to the Zenith College student portal to check admission status, register courses, view results and GPA, check school fees, and print your admission letter or examination card.",
      },
      {
        name: "keywords",
        content:
          "Zenith College student portal, admission status check Jos, course registration, result checker, CGPA",
      },
      { property: "og:title", content: "Student Portal — Zenith College, Jos" },
      {
        property: "og:description",
        content:
          "Check admission status, register courses, view results and fees at Zenith College of Health Science and Technology, Jos.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/student-portal" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Student Portal — Zenith College, Jos" },
      {
        name: "twitter:description",
        content: "Check admission status, register courses, view results and fees.",
      },
    ],
    links: [{ rel: "canonical", href: "/student-portal" }],
  }),
  component: StudentPortal,
});

type Creds = { applicationNumber: string; accessCode: string };
type SignInResult = Awaited<ReturnType<typeof portalSignIn>>;
type Session = Extract<SignInResult, { found: true }>;

const STATUS_COPY: Record<string, { label: string; text: string }> = {
  pending: {
    label: "Pending review",
    text: "Your application has been received and is waiting to be reviewed by the Admissions Office.",
  },
  under_review: {
    label: "Under review",
    text: "The Admissions Committee is currently assessing your credentials. Keep checking this page.",
  },
  admitted: {
    label: "Admitted",
    text: "Congratulations! You have been offered admission. Print your admission letter below and proceed to registration.",
  },
  rejected: {
    label: "Not successful",
    text: "Your application was not successful this session. You may apply again in the next admission cycle.",
  },
};

const TABS = [
  "Admission Status",
  "Register Courses",
  "Check Results",
  "School Fees",
  "Admission Letter",
  "Examination Card",
  "Receipts",
] as const;
type Tab = (typeof TABS)[number];

const SESSIONS = ["2025/2026", "2026/2027", "2027/2028"];

const naira = (n: number) =>
  `₦${Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function StudentPortal() {
  const [creds, setCreds] = useState<Creds | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("Admission Status");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next: Creds = {
      applicationNumber: String(fd.get("applicationNumber") ?? "").trim(),
      accessCode: String(fd.get("accessCode") ?? "").trim(),
    };
    setBusy(true);
    setError(null);
    try {
      const res = await portalSignIn({ data: next });
      if (!res.found) {
        setError("No application matches those details. Check your number and access code.");
        setCreds(null);
        setSession(null);
      } else {
        setCreds(next);
        setSession(res);
        setTab("Admission Status");
      }
    } catch {
      setError("We could not reach the portal right now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    setCreds(null);
    setSession(null);
    setError(null);
  }

  if (!creds || !session) {
    return (
      <>
        <PageHero
          eyebrow="Student Portal"
          title="Sign in to your student portal"
          subtitle="Use the application number and access code you received when you applied online."
        />
        <Section>
          <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
            <form
              className="h-fit rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8"
              onSubmit={onSubmit}
            >
              <h2 className="font-display text-xl font-bold">Portal Login</h2>
              <div className="mt-6 grid gap-4">
                <Field
                  id="applicationNumber"
                  label="Application Number"
                  placeholder="ZC/2026/123456"
                  maxLength={40}
                />
                <Field
                  id="accessCode"
                  label="Access Code"
                  placeholder="6-character code"
                  maxLength={20}
                  uppercase
                />
                {error && (
                  <p role="alert" className="text-sm font-medium text-destructive">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {busy ? "Signing in…" : "Sign in to portal"}
                </button>
                <p className="text-xs text-muted-foreground">
                  Not applied yet?{" "}
                  <Link to="/admissions" className="font-semibold text-primary hover:underline">
                    Apply online here
                  </Link>
                  . Lost your access code? Call 08123335178.
                </p>
              </div>
            </form>

            <div>
              <h2 className="font-display text-xl font-bold">Portal Services</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {TABS.map((s) => (
                  <div
                    key={s}
                    className="rounded-xl border border-border bg-card px-5 py-4 text-sm font-semibold shadow-card"
                  >
                    {s}
                  </div>
                ))}
              </div>
              <p className="mt-6 text-sm text-muted-foreground">
                Course registration, results, fees and examination cards open to admitted students
                each session. Visit the ICT Centre or call 08123335178 during office hours for help.
              </p>
            </div>
          </div>
        </Section>
      </>
    );
  }

  const app = session.application;

  return (
    <>
      <section className="band-gradient text-primary-foreground print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
              Student Portal
            </p>
            <h1 className="mt-2 font-display text-2xl font-bold md:text-3xl">{app.fullName}</h1>
            <p className="mt-1 text-sm opacity-85">
              {app.applicationNumber} · {app.programme}
              {session.student?.matricNumber ? ` · ${session.student.matricNumber}` : ""}
            </p>
          </div>
          <button
            onClick={signOut}
            className="rounded-lg border border-primary-foreground/40 px-4 py-2.5 text-sm font-semibold"
          >
            Sign out
          </button>
        </div>
      </section>

      <div className="border-b border-border bg-card print:hidden">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              aria-current={tab === t ? "page" : undefined}
              className={`-mb-px whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold ${
                tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10">
        {tab === "Admission Status" && <StatusPanel session={session} />}
        {tab === "Register Courses" && <CoursesPanel creds={creds} />}
        {tab === "Check Results" && <ResultsPanel creds={creds} />}
        {tab === "School Fees" && <FeesPanel creds={creds} />}
        {tab === "Admission Letter" && <LetterPanel creds={creds} />}
        {tab === "Examination Card" && <ExamCardPanel creds={creds} />}
        {tab === "Receipts" && <ReceiptsPanel creds={creds} />}
      </div>
    </>
  );
}

/* ------------------------------ small pieces ------------------------------ */

function Field({
  id,
  label,
  placeholder,
  maxLength,
  uppercase,
}: {
  id: string;
  label: string;
  placeholder?: string;
  maxLength?: number;
  uppercase?: boolean;
}) {
  return (
    <div className="grid gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        required
        maxLength={maxLength}
        placeholder={placeholder}
        className={`rounded-lg border border-input bg-background px-3 py-2.5 text-sm ${uppercase ? "uppercase" : ""}`}
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 font-medium text-foreground">{value}</dd>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">{children}</div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function SessionPicker({
  session,
  semester,
  onSession,
  onSemester,
}: {
  session: string;
  semester: "First" | "Second";
  onSession: (v: string) => void;
  onSemester: (v: "First" | "Second") => void;
}) {
  return (
    <div className="flex flex-wrap gap-3 print:hidden">
      <label className="grid gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Session
        <select
          value={session}
          onChange={(e) => onSession(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal normal-case tracking-normal text-foreground"
        >
          {SESSIONS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Semester
        <select
          value={semester}
          onChange={(e) => onSemester(e.target.value as "First" | "Second")}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal normal-case tracking-normal text-foreground"
        >
          <option value="First">First</option>
          <option value="Second">Second</option>
        </select>
      </label>
    </div>
  );
}

function LetterHead({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 border-b border-border pb-5">
      <img src={logo.url} alt="Zenith College official logo" className="h-16 w-16 object-contain" />
      <div>
        <p className="font-display text-lg font-bold leading-tight">
          Zenith College of Health Science and Technology, Jos
        </p>
        <p className="text-xs text-muted-foreground">
          M &amp; S International School, Bukuru, Jos South, Plateau State · Motto: Training for
          Service
        </p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{title}</p>
      </div>
    </div>
  );
}

function PrintButton({ label }: { label: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground print:hidden"
    >
      {label}
    </button>
  );
}

function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>({
    data: null,
    loading: true,
    error: null,
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);
  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    run()
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((e: unknown) =>
        setState({
          data: null,
          loading: false,
          error: e instanceof Error ? e.message : "Something went wrong.",
        }),
      );
  }, [run]);
  useEffect(reload, [reload]);
  return { ...state, reload };
}

/* --------------------------------- panels --------------------------------- */

function StatusPanel({ session }: { session: Session }) {
  const app = session.application;
  const copy = STATUS_COPY[app.status] ?? STATUS_COPY["pending"]!;
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
        Admission Status
      </p>
      <h2 className="mt-2 font-display text-2xl font-bold">{copy.label}</h2>
      <p className="mt-3 text-sm text-muted-foreground">{copy.text}</p>
      <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <Detail label="Applicant" value={app.fullName} />
        <Detail label="Application number" value={app.applicationNumber} />
        <Detail label="Programme" value={app.programme} />
        <Detail label="Email" value={app.email} />
        <Detail label="Phone" value={app.phone} />
        <Detail label="Submitted" value={new Date(app.submittedAt).toLocaleDateString()} />
      </dl>
      {app.adminNotes && (
        <div className="mt-6 rounded-xl bg-secondary p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Note from the Admissions Office
          </p>
          <p className="mt-1 text-sm text-foreground">{app.adminNotes}</p>
        </div>
      )}
    </Card>
  );
}

function CoursesPanel({ creds }: { creds: Creds }) {
  const [session, setSession] = useState(SESSIONS[1]!);
  const [semester, setSemester] = useState<"First" | "Second">("First");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { data, loading, reload } = useAsync(
    () => getCourseRegistration({ data: { ...creds, session, semester } }),
    [creds.applicationNumber, creds.accessCode, session, semester],
  );

  async function submit() {
    if (selected.length === 0) return;
    setBusy(true);
    setMessage(null);
    try {
      await registerCourses({ data: { ...creds, session, semester, courseIds: selected } });
      setSelected([]);
      setMessage("Your course registration has been saved.");
      reload();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Registration failed.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Notice>Loading courses…</Notice>;
  if (!data?.ok)
    return (
      <Notice>
        {data?.reason === "not_admitted"
          ? "Course registration opens once your admission has been offered."
          : "We could not verify your record."}
      </Notice>
    );

  const registeredIds = new Set(data.registrations.map((r: any) => r.course_id));
  const available = data.courses.filter((c: any) => !registeredIds.has(c.id));

  return (
    <div className="grid gap-6">
      <SessionPicker
        session={session}
        semester={semester}
        onSession={setSession}
        onSemester={setSemester}
      />

      <Card>
        <h2 className="font-display text-xl font-bold">Available courses</h2>
        {available.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No further courses are published for your programme for {session} {semester} semester.
          </p>
        ) : (
          <>
            <ul className="mt-4 grid gap-2">
              {available.map((c: any) => (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={selected.includes(c.id)}
                      onChange={(e) =>
                        setSelected((s) =>
                          e.target.checked ? [...s, c.id] : s.filter((x) => x !== c.id),
                        )
                      }
                    />
                    <span>
                      <span className="font-semibold">
                        {c.code} — {c.title}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {c.credit_units ?? 0} credit unit(s)
                        {c.level ? ` · Level ${c.level}` : ""}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <button
              onClick={submit}
              disabled={busy || selected.length === 0}
              className="mt-5 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {busy ? "Submitting…" : `Register ${selected.length || ""} course(s)`}
            </button>
          </>
        )}
        {message && <p className="mt-3 text-sm font-medium text-primary">{message}</p>}
      </Card>

      <Card>
        <h2 className="font-display text-xl font-bold">Registered courses</h2>
        {data.registrations.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            You have not registered any course for {session} {semester} semester.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2">Code</th>
                  <th className="py-2">Title</th>
                  <th className="py-2">Units</th>
                </tr>
              </thead>
              <tbody>
                {data.registrations.map((r: any) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="py-2 font-semibold">{r.courses?.code}</td>
                    <td className="py-2">{r.courses?.title}</td>
                    <td className="py-2">{r.courses?.credit_units}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function ResultsPanel({ creds }: { creds: Creds }) {
  const { data, loading } = useAsync(
    () => getResults({ data: creds }),
    [creds.applicationNumber, creds.accessCode],
  );

  if (loading) return <Notice>Loading results…</Notice>;
  if (!data?.ok)
    return (
      <Notice>
        {data?.reason === "not_admitted"
          ? "Results become available after admission and course registration."
          : "We could not verify your record."}
      </Notice>
    );

  if (data.semesters.length === 0)
    return <Notice>No result is currently available for this student.</Notice>;

  return (
    <div className="grid gap-6">
      {data.semesters.map((s) => (
        <Card key={`${s.session}-${s.semester}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-xl font-bold">
              {s.session} · {s.semester} Semester
            </h2>
            <p className="text-sm font-semibold text-primary">GPA {s.gpa.toFixed(2)} / 4.00</p>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2">Code</th>
                  <th className="py-2">Title</th>
                  <th className="py-2">Unit</th>
                  <th className="py-2">Score</th>
                  <th className="py-2">Grade</th>
                  <th className="py-2">GP</th>
                  <th className="py-2">QP</th>
                </tr>
              </thead>
              <tbody>
                {s.courses.map((c: any, i: number) => (
                  <tr key={`${c.code}-${i}`} className="border-t border-border">
                    <td className="py-2 font-semibold">{c.code}</td>
                    <td className="py-2">{c.title}</td>
                    <td className="py-2">{c.creditUnit}</td>
                    <td className="py-2">{c.score}</td>
                    <td className="py-2 font-semibold">{c.grade}</td>
                    <td className="py-2">{c.gradePoint.toFixed(2)}</td>
                    <td className="py-2">{c.qualityPoint.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Total units {s.totalUnits} · Total quality points {s.totalQualityPoints.toFixed(2)}
          </p>
        </Card>
      ))}

      <Card>
        <h2 className="font-display text-xl font-bold">Cumulative performance</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
          <Detail label="CGPA" value={`${data.cgpa?.toFixed(2) ?? "—"} / 4.00`} />
          <Detail label="Total credit units" value={String(data.totalUnits)} />
          <Detail label="Total quality points" value={data.totalQualityPoints.toFixed(2)} />
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">
          Grading: 70–100 = A (4.00), 60–69 = B (3.00), 50–59 = C (2.00), 40–49 = D (1.00), 0–39 = F
          (0.00). Quality point = credit unit × grade point.
        </p>
        <PrintButton label="Print result slip" />
      </Card>
    </div>
  );
}

function FeesPanel({ creds }: { creds: Creds }) {
  const { data, loading, reload } = useAsync(
    () => getFees({ data: creds }),
    [creds.applicationNumber, creds.accessCode],
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (loading) return <Notice>Loading fee records…</Notice>;
  if (!data?.ok)
    return (
      <Notice>
        {data?.reason === "not_admitted"
          ? "School fee invoices are issued after admission."
          : "We could not verify your record."}
      </Notice>
    );

  if (data.invoices.length === 0)
    return (
      <Notice>
        No school fee invoice has been issued for your record yet. The Bursary publishes invoices at
        the start of each session.
      </Notice>
    );

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setMessage(null);
    try {
      await declarePayment({
        data: {
          ...creds,
          invoiceId: String(fd.get("invoiceId")),
          amount: Number(fd.get("amount")),
          method: String(fd.get("method")) as "bank_transfer" | "bank_deposit" | "pos",
          reference: String(fd.get("reference")),
        },
      });
      setMessage(
        "Payment notification submitted. The Bursary will confirm it and your receipt will appear under Receipts.",
      );
      reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not submit payment details.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <Detail label="Total billed" value={naira(data.totals.billed)} />
        </Card>
        <Card>
          <Detail label="Confirmed payments" value={naira(data.totals.paid)} />
        </Card>
        <Card>
          <Detail label="Outstanding" value={naira(data.totals.outstanding)} />
        </Card>
      </div>

      <Card>
        <h2 className="font-display text-xl font-bold">Invoices</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[540px] text-left text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2">Description</th>
                <th className="py-2">Session</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.invoices.map((i: any) => (
                <tr key={i.id} className="border-t border-border">
                  <td className="py-2 font-semibold">{i.description}</td>
                  <td className="py-2">
                    {i.session}
                    {i.semester ? ` · ${i.semester}` : ""}
                  </td>
                  <td className="py-2">{naira(i.amount)}</td>
                  <td className="py-2 capitalize">{String(i.status).replace("_", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 className="font-display text-xl font-bold">Notify the Bursary of a payment</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Online card payment is not yet enabled. Pay into the official college account, then enter
          your teller/transfer reference below. Your payment stays <strong>pending</strong> until
          the Bursary confirms it — no receipt is issued before then.
        </p>
        <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Invoice
            <select
              name="invoiceId"
              required
              className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-foreground"
            >
              {data.invoices.map((i: any) => (
                <option key={i.id} value={i.id}>
                  {i.description} — {naira(i.amount)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Amount paid (₦)
            <input
              name="amount"
              type="number"
              min="1"
              step="0.01"
              required
              className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-foreground"
            />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Method
            <select
              name="method"
              className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-foreground"
            >
              <option value="bank_transfer">Bank transfer</option>
              <option value="bank_deposit">Bank deposit</option>
              <option value="pos">POS</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Teller / transfer reference
            <input
              name="reference"
              required
              maxLength={80}
              className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-foreground"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {busy ? "Submitting…" : "Submit payment details"}
            </button>
            {message && <p className="mt-3 text-sm font-medium text-primary">{message}</p>}
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="font-display text-xl font-bold">Payment history</h2>
        {data.payments.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No payment records yet.</p>
        ) : (
          <ul className="mt-4 grid gap-2 text-sm">
            {data.payments.map((p: any) => (
              <li key={p.id} className="flex flex-wrap justify-between gap-2 border-t border-border py-2">
                <span>
                  {naira(p.amount)} · {p.reference}
                </span>
                <span className="font-semibold capitalize">{p.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function LetterPanel({ creds }: { creds: Creds }) {
  const { data, loading } = useAsync(
    () => getAdmissionLetter({ data: creds }),
    [creds.applicationNumber, creds.accessCode],
  );

  if (loading) return <Notice>Loading…</Notice>;
  if (!data?.ok)
    return (
      <Notice>
        Your admission letter becomes available only after the Admissions Office offers you
        admission.
      </Notice>
    );

  const a = data.application;
  return (
    <div className="grid gap-4">
      <PrintButton label="Print admission letter" />
      <Card>
        <LetterHead title="Provisional Letter of Admission" />
        <p className="mt-6 text-sm text-muted-foreground">
          Date: {new Date(data.issuedOn).toLocaleDateString()}
        </p>
        <p className="mt-4 text-sm font-semibold">{a.fullName}</p>
        <p className="text-sm text-muted-foreground">{a.email}</p>

        <p className="mt-6 text-sm leading-relaxed">
          Dear <strong>{a.fullName}</strong>,
        </p>
        <p className="mt-3 text-sm leading-relaxed">
          I am pleased to inform you that, following the assessment of your application
          (<strong>{a.applicationNumber}</strong>), the Admissions Committee has offered you
          provisional admission into the <strong>{a.programme}</strong> programme of Zenith College
          of Health Science and Technology, Jos.
        </p>
        <p className="mt-3 text-sm leading-relaxed">
          This offer is subject to the verification of your original credentials, payment of the
          prescribed school fees and completion of course registration at the beginning of the
          session. Please report to the Registry with this letter and your original certificates.
        </p>

        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <Detail label="Application number" value={a.applicationNumber} />
          <Detail label="Programme" value={a.programme} />
          <Detail label="Admission status" value="Admitted" />
          <Detail label="Date submitted" value={new Date(a.submittedAt).toLocaleDateString()} />
          {data.student?.matricNumber && (
            <Detail label="Matriculation number" value={data.student.matricNumber} />
          )}
        </dl>

        {a.adminNotes && (
          <p className="mt-6 rounded-xl bg-secondary p-4 text-sm">{a.adminNotes}</p>
        )}

        <div className="mt-10 border-t border-border pt-4 text-sm">
          <p className="font-semibold">Registrar</p>
          <p className="text-muted-foreground">
            Zenith College of Health Science and Technology, Jos · Training for Service
          </p>
        </div>
      </Card>
    </div>
  );
}

function ExamCardPanel({ creds }: { creds: Creds }) {
  const [session, setSession] = useState(SESSIONS[1]!);
  const [semester, setSemester] = useState<"First" | "Second">("First");
  const { data, loading } = useAsync(
    () => getExamCard({ data: { ...creds, session, semester } }),
    [creds.applicationNumber, creds.accessCode, session, semester],
  );

  return (
    <div className="grid gap-6">
      <SessionPicker
        session={session}
        semester={semester}
        onSession={setSession}
        onSemester={setSemester}
      />
      {loading ? (
        <Notice>Loading examination card…</Notice>
      ) : !data?.ok ? (
        <Notice>
          {data?.reason === "no_registration"
            ? `No examination card is available: you have no registered course for ${session} ${semester} semester.`
            : "Examination cards are issued to admitted, registered students only."}
        </Notice>
      ) : (
        <>
          <PrintButton label="Print examination card" />
          <Card>
            <LetterHead title={`Examination Card · ${data.session} ${data.semester} Semester`} />
            <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <Detail label="Candidate" value={data.application.fullName} />
              <Detail label="Application number" value={data.application.applicationNumber} />
              <Detail label="Programme" value={data.application.programme} />
              <Detail
                label="Matriculation number"
                value={data.student?.matricNumber ?? "Pending assignment"}
              />
              <Detail label="Level" value={data.student?.level ?? "—"} />
              <Detail
                label="Fee clearance"
                value={
                  data.feeCleared === null
                    ? "No invoice issued"
                    : data.feeCleared
                      ? "Cleared"
                      : "Outstanding balance"
                }
              />
            </dl>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead className="text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2">Code</th>
                    <th className="py-2">Course</th>
                    <th className="py-2">Units</th>
                  </tr>
                </thead>
                <tbody>
                  {data.courses.map((c: any, i: number) => (
                    <tr key={i} className="border-t border-border">
                      <td className="py-2 font-semibold">{c?.code}</td>
                      <td className="py-2">{c?.title}</td>
                      <td className="py-2">{c?.credit_units}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              This card must be presented at every examination venue. It is invalid without fee
              clearance from the Bursary.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}

function ReceiptsPanel({ creds }: { creds: Creds }) {
  const { data, loading } = useAsync(
    () => getFees({ data: creds }),
    [creds.applicationNumber, creds.accessCode],
  );

  if (loading) return <Notice>Loading receipts…</Notice>;
  if (!data?.ok) return <Notice>Receipts are available to admitted students only.</Notice>;
  if (data.receipts.length === 0)
    return (
      <Notice>
        No confirmed payment exists on your record, so there is no receipt to download yet.
      </Notice>
    );

  return (
    <div className="grid gap-6">
      <PrintButton label="Print receipts" />
      {data.receipts.map((r: any) => (
        <Card key={r.id}>
          <LetterHead title="Official Payment Receipt" />
          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <Detail label="Receipt number" value={r.receipt_number ?? "—"} />
            <Detail label="Amount paid" value={naira(r.amount)} />
            <Detail label="Method" value={String(r.method).replace("_", " ")} />
            <Detail label="Reference" value={r.reference ?? "—"} />
            <Detail
              label="Date confirmed"
              value={r.paid_at ? new Date(r.paid_at).toLocaleDateString() : "—"}
            />
            <Detail label="Status" value="Confirmed" />
          </dl>
        </Card>
      ))}
    </div>
  );
}
