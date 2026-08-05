import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHero, Section } from "@/components/site/PageHero";
import { checkApplicationStatus } from "@/lib/admissions.functions";

export const Route = createFileRoute("/student-portal")({
  head: () => ({
    meta: [
      { title: "Student Portal — Check Admission Status | Zenith College, Jos" },
      {
        name: "description",
        content:
          "Track your admission status, view your application details and access student services at Zenith College of Health Science and Technology, Jos.",
      },
      {
        name: "keywords",
        content: "Zenith College student portal, admission status check Jos, admission letter",
      },
      { property: "og:title", content: "Student Portal — Zenith College, Jos" },
      {
        property: "og:description",
        content: "Track your admission status and access student services.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/student-portal" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Student Portal — Zenith College, Jos" },
      {
        name: "twitter:description",
        content: "Track your admission status and access student services.",
      },
    ],
    links: [{ rel: "canonical", href: "/student-portal" }],
  }),
  component: StudentPortal,
});

type StatusResult = Awaited<ReturnType<typeof checkApplicationStatus>>;

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
    text: "Congratulations! You have been offered admission. Contact the Registry to collect your admission letter and begin registration.",
  },
  rejected: {
    label: "Not successful",
    text: "Your application was not successful this session. You may apply again in the next admission cycle.",
  },
};

const services = [
  "Register Courses",
  "Check Results",
  "Pay School Fees",
  "Print Admission Letter",
  "Print Examination Card",
  "Download Receipts",
];

function StudentPortal() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<StatusResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await checkApplicationStatus({
        data: {
          applicationNumber: String(fd.get("applicationNumber") ?? ""),
          accessCode: String(fd.get("accessCode") ?? ""),
        },
      });
      if (!res.found) {
        setError("No application matches those details. Check your number and access code.");
      } else {
        setResult(res);
      }
    } catch {
      setError("We could not check your status right now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const copy = result?.found ? (STATUS_COPY[result.status] ?? STATUS_COPY["pending"]!) : null;

  return (
    <>
      <PageHero
        eyebrow="Student Portal"
        title="Track your admission and access student services"
        subtitle="Use the application number and access code you received when you applied online."
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <form
            className="h-fit rounded-2xl border border-border bg-card p-8 shadow-card"
            onSubmit={onSubmit}
          >
            <h2 className="font-display text-xl font-bold">Check Admission Status</h2>
            <div className="mt-6 grid gap-4">
              <div className="grid gap-1.5">
                <label
                  htmlFor="applicationNumber"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Application Number
                </label>
                <input
                  id="applicationNumber"
                  name="applicationNumber"
                  required
                  maxLength={40}
                  placeholder="ZC/2026/123456"
                  className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                />
              </div>
              <div className="grid gap-1.5">
                <label
                  htmlFor="accessCode"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Access Code
                </label>
                <input
                  id="accessCode"
                  name="accessCode"
                  required
                  maxLength={20}
                  placeholder="6-character code"
                  className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm uppercase"
                />
              </div>

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
                {busy ? "Checking…" : "Check my status"}
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
            {result?.found && copy ? (
              <div
                role="status"
                className="rounded-2xl border-2 border-primary bg-card p-8 shadow-card"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                  Admission Status
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold">{copy.label}</h2>
                <p className="mt-3 text-sm text-muted-foreground">{copy.text}</p>
                <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                  <Detail label="Applicant" value={result.fullName} />
                  <Detail label="Application number" value={result.applicationNumber} />
                  <Detail label="Programme" value={result.programme} />
                  <Detail
                    label="Submitted"
                    value={new Date(result.submittedAt).toLocaleDateString()}
                  />
                </dl>
                {result.adminNotes && (
                  <div className="mt-6 rounded-xl bg-secondary p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Note from the Admissions Office
                    </p>
                    <p className="mt-1 text-sm text-foreground">{result.adminNotes}</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <h2 className="font-display text-xl font-bold">Portal Services</h2>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {services.map((s) => (
                    <div
                      key={s}
                      className="rounded-xl border border-border bg-card px-5 py-4 text-sm font-semibold shadow-card"
                    >
                      {s}
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-sm text-muted-foreground">
                  Course registration, results and fee payment open to admitted students each
                  session. Visit the ICT Centre or call 08123335178 during office hours for help.
                </p>
              </>
            )}
          </div>
        </div>
      </Section>
    </>
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
