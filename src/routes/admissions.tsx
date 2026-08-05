import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHero, Section } from "@/components/site/PageHero";
import { submitApplication } from "@/lib/admissions.functions";

export const Route = createFileRoute("/admissions")({
  head: () => ({
    meta: [
      { title: "Admissions 2026 — Apply Online | Zenith College of Health Science, Jos" },
      {
        name: "description",
        content:
          "Apply online to Zenith College of Health Science and Technology, Jos. Requirements, WAEC/NECO/NABTEB acceptance, fees and the five-step application process.",
      },
      {
        name: "keywords",
        content:
          "Zenith College admission, health science school Jos, CHEW admission Plateau State, apply online health college Nigeria",
      },
      { property: "og:title", content: "Admissions — Apply Online | Zenith College, Jos" },
      {
        property: "og:description",
        content: "How to apply, admission requirements and school fees information.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/admissions" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Admissions — Apply Online | Zenith College, Jos" },
      {
        name: "twitter:description",
        content: "How to apply, admission requirements and school fees information.",
      },
    ],
    links: [{ rel: "canonical", href: "/admissions" }],
  }),
  component: Admissions,
});

const steps = [
  ["Complete Online Application", "Fill the application form with accurate personal details."],
  ["Upload Documents", "Attach your O'Level result, birth certificate and passport photograph."],
  ["Pay Application Fee", "Make payment and keep your receipt or transaction reference."],
  ["Receive Admission Letter", "Successful candidates are notified by email and SMS."],
  ["Register", "Complete course registration and resume for orientation."],
];

const programmes = [
  "Community Health Extension Worker (CHEW)",
  "Medical Laboratory Technician (MLT)",
  "Public Health",
  "Pharmacy Technician",
];

function Admissions() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{
    applicationNumber: string;
    accessCode: string;
  } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true);
    setError(null);

    try {
      const result = await submitApplication({
        data: {
          fullName: String(fd.get("fullName") ?? ""),
          email: String(fd.get("email") ?? ""),
          phone: String(fd.get("phone") ?? ""),
          programme: String(fd.get("programme") ?? ""),
          dateOfBirth: String(fd.get("dateOfBirth") ?? ""),
          gender: String(fd.get("gender") ?? ""),
          stateOfOrigin: String(fd.get("stateOfOrigin") ?? ""),
          examType: String(fd.get("examType") ?? ""),
          examYear: String(fd.get("examYear") ?? ""),
          examNumber: String(fd.get("examNumber") ?? ""),
          address: String(fd.get("address") ?? ""),
          message: String(fd.get("message") ?? ""),
        },
      });
      setReceipt(result);
      form.reset();
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Your application could not be submitted. Please check your details and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Admissions"
        title="Begin your healthcare career at Zenith College"
        subtitle="Applications are open for all programmes. Review the requirements and apply online."
      />

      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
            <h2 className="font-display text-xl font-bold">Admission Requirements</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Minimum of five (5) credit passes in:
            </p>
            <ul className="mt-3 grid gap-2 text-sm font-medium sm:grid-cols-2">
              {["English Language", "Mathematics", "Biology", "Chemistry", "Physics"].map((s) => (
                <li key={s} className="rounded-lg bg-secondary px-3 py-2 text-secondary-foreground">
                  {s}
                </li>
              ))}
            </ul>
            <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-primary">
              Accepted Examinations
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">WAEC · NECO · NABTEB</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
            <h2 className="font-display text-xl font-bold">School Fees</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Tuition is affordable and payable per session, with an option for instalment payment
              on approval. For the current fee schedule of your chosen programme, contact the
              Admissions Office on <span className="font-semibold text-foreground">08123335178</span>{" "}
              or email{" "}
              <a
                className="font-semibold text-primary hover:underline"
                href="mailto:zenithcollegehealthjos@gmail.com"
              >
                zenithcollegehealthjos@gmail.com
              </a>
              .
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/downloads"
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Download Admission Form
              </Link>
              <Link
                to="/student-portal"
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground"
              >
                Check Application Status
              </Link>
            </div>
          </div>
        </div>
      </Section>

      <Section title="How to Apply" muted>
        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {steps.map(([title, text], i) => (
            <li key={title} className="rounded-xl border border-border bg-card p-6 shadow-card">
              <span className="grid h-9 w-9 place-items-center rounded-full band-gradient font-display text-sm font-bold text-primary-foreground">
                {i + 1}
              </span>
              <h3 className="mt-4 font-display text-base font-bold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Online Application Form">
        {receipt ? (
          <div className="max-w-2xl rounded-2xl border-2 border-primary bg-card p-8 shadow-card">
            <h3 className="font-display text-xl font-bold text-primary">
              Application received successfully
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Save the details below. You need them to track your admission status on the Student
              Portal.
            </p>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-secondary p-4">
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Application Number
                </dt>
                <dd className="mt-1 font-display text-lg font-bold">{receipt.applicationNumber}</dd>
              </div>
              <div className="rounded-xl bg-secondary p-4">
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Access Code
                </dt>
                <dd className="mt-1 font-display text-lg font-bold tracking-[0.2em]">
                  {receipt.accessCode}
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/student-portal"
                className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
              >
                Track my application
              </Link>
              <button
                type="button"
                onClick={() => setReceipt(null)}
                className="rounded-lg border border-border px-5 py-3 text-sm font-semibold"
              >
                Submit another application
              </button>
            </div>
          </div>
        ) : (
          <form
            className="grid max-w-3xl gap-4 rounded-2xl border border-border bg-card p-8 shadow-card sm:grid-cols-2"
            onSubmit={onSubmit}
          >
            <Field label="Full Name" name="fullName" required />
            <Field label="Email Address" name="email" type="email" required />
            <Field label="Phone Number" name="phone" required />
            <div className="grid gap-1.5">
              <label
                htmlFor="programme"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Programme of Interest
              </label>
              <select
                id="programme"
                name="programme"
                required
                className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
              >
                {programmes.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
            <Field label="Date of Birth" name="dateOfBirth" type="date" />
            <div className="grid gap-1.5">
              <label
                htmlFor="gender"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
              >
                <option value="">Select</option>
                <option>Female</option>
                <option>Male</option>
              </select>
            </div>
            <Field label="State of Origin" name="stateOfOrigin" />
            <div className="grid gap-1.5">
              <label
                htmlFor="examType"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Examination Type
              </label>
              <select
                id="examType"
                name="examType"
                className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
              >
                <option value="">Select</option>
                <option>WAEC</option>
                <option>NECO</option>
                <option>NABTEB</option>
              </select>
            </div>
            <Field label="Examination Year" name="examYear" />
            <Field label="Examination Number" name="examNumber" />
            <div className="grid gap-1.5 sm:col-span-2">
              <label
                htmlFor="address"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Home Address
              </label>
              <input
                id="address"
                name="address"
                maxLength={300}
                className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
              />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <label
                htmlFor="message"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Message (optional)
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                maxLength={1000}
                className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm font-medium text-destructive sm:col-span-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60 sm:col-span-2"
            >
              {busy ? "Submitting…" : "Submit Application"}
            </button>
          </form>
        )}
      </Section>
    </>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-1.5">
      <label
        htmlFor={name}
        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        maxLength={120}
        className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
      />
    </div>
  );
}
