import { createFileRoute } from "@tanstack/react-router";
import { FileDown } from "lucide-react";
import { PageHero, Section } from "@/components/site/PageHero";

export const Route = createFileRoute("/downloads")({
  head: () => ({
    meta: [
      { title: "Download Centre — Zenith College of Health Science, Jos" },
      {
        name: "description",
        content:
          "Download the admission form, student handbook, academic calendar, timetables and course registration form.",
      },
      { property: "og:title", content: "Download Centre — Zenith College, Jos" },
      { property: "og:description", content: "Forms, handbooks, calendars and timetables." },
      { property: "og:url", content: "/downloads" },
    ],
    links: [{ rel: "canonical", href: "/downloads" }],
  }),
  component: Downloads,
});

const files = [
  ["Admission Form", "PDF · Current session"],
  ["Student Handbook", "PDF · Rules and regulations"],
  ["Academic Calendar", "PDF · Session dates"],
  ["Examination Timetable", "PDF · Registry"],
  ["Lecture Timetable", "PDF · Academic Affairs"],
  ["Course Registration Form", "PDF · All programmes"],
] as const;

function Downloads() {
  return (
    <>
      <PageHero
        eyebrow="Download Centre"
        title="Forms and documents"
        subtitle="Documents are released each session. Request the current copies from the Registry if a file is not yet uploaded."
      />

      <Section>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {files.map(([title, meta]) => (
            <div
              key={title}
              className="flex items-start gap-4 rounded-xl border border-border bg-card p-6 shadow-card"
            >
              <FileDown className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
              <div className="min-w-0">
                <h3 className="font-display text-base font-bold">{title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
                <a
                  href="mailto:zenithcollegehealthjos@gmail.com?subject=Document%20Request"
                  className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
                >
                  Request document
                </a>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
