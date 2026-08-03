import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Section } from "@/components/site/PageHero";

export const Route = createFileRoute("/staff-portal")({
  head: () => ({
    meta: [
      { title: "Staff Portal — Zenith College of Health Science, Jos" },
      {
        name: "description",
        content:
          "Staff portal for uploading results, managing students, attendance, timetables and internal communication.",
      },
      { property: "og:title", content: "Staff Portal — Zenith College, Jos" },
      { property: "og:description", content: "Result upload, attendance and internal memos." },
      { property: "og:url", content: "/staff-portal" },
    ],
    links: [{ rel: "canonical", href: "/staff-portal" }],
  }),
  component: StaffPortal,
});

const services = [
  "Upload Results",
  "Manage Students",
  "Attendance",
  "Timetable",
  "News Update",
  "Internal Communication",
];

function StaffPortal() {
  return (
    <>
      <PageHero
        eyebrow="Staff Portal"
        title="Tools for lecturers and administrators"
        subtitle="Secure access for academic and administrative staff of the College."
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <form
            className="rounded-2xl border border-border bg-card p-8 shadow-card"
            onSubmit={(e) => {
              e.preventDefault();
              alert("Staff accounts are issued by the ICT Centre.");
            }}
          >
            <h2 className="font-display text-xl font-bold">Staff Login</h2>
            <div className="mt-6 grid gap-4">
              <div className="grid gap-1.5">
                <label
                  htmlFor="staffid"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Staff ID
                </label>
                <input
                  id="staffid"
                  required
                  maxLength={30}
                  className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                />
              </div>
              <div className="grid gap-1.5">
                <label
                  htmlFor="staffpass"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Password
                </label>
                <input
                  id="staffpass"
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
            <h2 className="font-display text-xl font-bold">Staff Services</h2>
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
          </div>
        </div>
      </Section>
    </>
  );
}
