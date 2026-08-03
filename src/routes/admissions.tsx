import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, Section } from "@/components/site/PageHero";

export const Route = createFileRoute("/admissions")({
  head: () => ({
    meta: [
      { title: "Admissions — Zenith College of Health Science, Jos" },
      {
        name: "description",
        content:
          "Admission requirements, accepted examinations and the five-step application process at Zenith College of Health Science, Jos.",
      },
      { property: "og:title", content: "Admissions — Zenith College, Jos" },
      {
        property: "og:description",
        content: "How to apply, requirements and school fees information.",
      },
      { property: "og:url", content: "/admissions" },
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

function Admissions() {
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
                to="/contact"
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground"
              >
                Speak to Admissions
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
        <form
          className="grid max-w-3xl gap-4 rounded-2xl border border-border bg-card p-8 shadow-card sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            alert("Thank you. Your application enquiry has been recorded. We will contact you.");
          }}
        >
          <Field label="Full Name" name="name" />
          <Field label="Email Address" name="email" type="email" />
          <Field label="Phone Number" name="phone" />
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Programme of Interest
            </label>
            <select
              required
              className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
            >
              <option>Community Health Extension Worker (CHEW)</option>
              <option>Medical Laboratory Technician (MLT)</option>
              <option>Public Health</option>
              <option>Pharmacy Technician</option>
            </select>
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Message
            </label>
            <textarea
              rows={4}
              maxLength={1000}
              className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground sm:col-span-2"
          >
            Submit Application Enquiry
          </button>
        </form>
      </Section>
    </>
  );
}

function Field({ label, name, type = "text" }: { label: string; name: string; type?: string }) {
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
        required
        maxLength={120}
        className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
      />
    </div>
  );
}
