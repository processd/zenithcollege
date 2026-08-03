import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Section } from "@/components/site/PageHero";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "News & Events — Zenith College of Health Science, Jos" },
      {
        name: "description",
        content:
          "Latest news, notices and events from Zenith College of Health Science and Technology, Jos.",
      },
      { property: "og:title", content: "News & Events — Zenith College, Jos" },
      { property: "og:description", content: "Admissions, ceremonies, timetables and notices." },
      { property: "og:url", content: "/news" },
    ],
    links: [{ rel: "canonical", href: "/news" }],
  }),
  component: News,
});

const news = [
  {
    title: "Admissions Open",
    date: "Current Session",
    text: "Applications are now open for CHEW, MLT, Public Health and Pharmacy Technician programmes.",
  },
  {
    title: "Matriculation Ceremony",
    date: "Academic Calendar",
    text: "New students will be formally admitted into the College at the matriculation ceremony.",
  },
  {
    title: "Students Week",
    date: "Campus Life",
    text: "A week of academic, cultural and sporting activities organised by the Students' Union.",
  },
  {
    title: "Industrial Attachment",
    date: "Clinical Training",
    text: "Students proceed to approved hospitals and health centres for supervised practice.",
  },
  {
    title: "Examination Timetable",
    date: "Registry Notice",
    text: "The end-of-semester examination timetable is available at the Download Centre.",
  },
  {
    title: "Seminar and Workshop",
    date: "Professional Development",
    text: "Guest clinicians deliver seminars on emerging trends in healthcare practice.",
  },
];

const notices = [
  "All students must complete course registration before the deadline.",
  "Clearance for examination cards closes two weeks to examinations.",
  "School fees are payable through the approved College account only.",
  "Identity cards must be worn at all times within the campus.",
];

function News() {
  return (
    <>
      <PageHero
        eyebrow="News"
        title="News, events and public notices"
        subtitle="Stay updated with announcements from the Registry and Students' Affairs."
      />

      <Section title="Latest News">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {news.map((n) => (
            <article
              key={n.title}
              className="rounded-xl border border-border bg-card p-6 shadow-card"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                {n.date}
              </p>
              <h3 className="mt-2 font-display text-lg font-bold">{n.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{n.text}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Notice Board" muted>
        <ul className="grid gap-3 md:grid-cols-2">
          {notices.map((n) => (
            <li
              key={n}
              className="rounded-xl border-l-4 border-l-gold border-y border-r border-border bg-card px-5 py-4 text-sm shadow-card"
            >
              {n}
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
