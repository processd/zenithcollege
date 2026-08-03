import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Section } from "@/components/site/PageHero";

export const Route = createFileRoute("/student-portal")({
  head: () => ({
    meta: [
      { title: "Student Portal — Zenith College of Health Science, Jos" },
      {
        name: "description",
        content:
          "Student portal for course registration, results, fee payment, admission letters and examination cards.",
      },
      { property: "og:title", content: "Student Portal — Zenith College, Jos" },
      { property: "og:description", content: "Register courses, check results and pay fees." },
      { property: "og:url", content: "/student-portal" },
    ],
    links: [{ rel: "canonical", href: "/student-portal" }],
  }),
  component: StudentPortal,
});

const services = [
  "Register Courses",
  "Check Results",
  "Pay School Fees",
  "Print Admission Letter",
  "Print Examination Card",
  "Download Receipts",
];

function StudentPortal() {
  return (
    <>
      <PageHero
        eyebrow="Student Portal"
        title="Everything you need, in one place"
        subtitle="Log in with your matriculation number to access your academic and financial records."
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <form
            className="rounded-2xl border border-border bg-card p-8 shadow-card"
            onSubmit={(e) => {
              e.preventDefault();
              alert("Portal login will be activated for the current session. Contact the Registry.");
            }}
          >
            <h2 className="font-display text-xl font-bold">Student Login</h2>
            <div className="mt-6 grid gap-4">
              <div className="grid gap-1.5">
                <label
                  htmlFor="matric"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Matriculation Number
                </label>
                <input
                  id="matric"
                  required
                  maxLength={30}
                  className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                />
              </div>
              <div className="grid gap-1.5">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  maxLength={64}
                  className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
              >
                Login
              </button>
            </div>
          </form>

          <div>
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
              Forgot your login details? Visit the ICT Centre or call 08123335178 during office
              hours.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
