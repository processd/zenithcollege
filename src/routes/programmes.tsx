import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, Section } from "@/components/site/PageHero";

export const Route = createFileRoute("/programmes")({
  head: () => ({
    meta: [
      { title: "Programmes — Zenith College of Health Science, Jos" },
      {
        name: "description",
        content:
          "CHEW, Medical Laboratory Technician, Public Health and Pharmacy Technician programmes with duration, requirements and careers.",
      },
      { property: "og:title", content: "Programmes at Zenith College, Jos" },
      {
        property: "og:description",
        content: "Accredited health science programmes and career pathways.",
      },
      { property: "og:url", content: "/programmes" },
    ],
    links: [{ rel: "canonical", href: "/programmes" }],
  }),
  component: Programmes,
});

const programmes = [
  {
    name: "Community Health Extension Worker (CHEW)",
    duration: "3 Years (Full-time)",
    requirements: [
      "Five (5) credit passes including English, Mathematics, Biology, Chemistry and Physics",
      "WAEC, NECO or NABTEB result",
      "Birth certificate and indigene/residency certificate",
    ],
    careers: [
      "Primary Health Care Centres",
      "Community health programmes",
      "NGOs and health outreach agencies",
      "State and Local Government health services",
    ],
  },
  {
    name: "Medical Laboratory Technician (MLT)",
    duration: "2 Years (Full-time)",
    requirements: [
      "Five (5) credit passes including English, Mathematics, Biology, Chemistry and Physics",
      "WAEC, NECO or NABTEB result",
      "Passing the College entrance screening",
    ],
    careers: [
      "Hospital and diagnostic laboratories",
      "Research institutes",
      "Public health laboratories",
      "Private medical laboratories",
    ],
  },
  {
    name: "Public Health",
    duration: "2 Years (Full-time)",
    requirements: [
      "Five (5) credit passes including English, Mathematics, Biology, Chemistry and Physics",
      "WAEC, NECO or NABTEB result",
      "Completed application form and documents",
    ],
    careers: [
      "Health education and promotion",
      "Disease surveillance units",
      "Environmental health services",
      "International health organisations",
    ],
  },
  {
    name: "Pharmacy Technician",
    duration: "2 Years (Full-time)",
    requirements: [
      "Five (5) credit passes including English, Mathematics, Biology, Chemistry and Physics",
      "WAEC, NECO or NABTEB result",
      "Medical fitness certificate",
    ],
    careers: [
      "Hospital pharmacies",
      "Community and retail pharmacies",
      "Pharmaceutical companies",
      "Drug supply and logistics agencies",
    ],
  },
];

function Programmes() {
  return (
    <>
      <PageHero
        eyebrow="Programmes"
        title="Accredited health science programmes"
        subtitle="Practical, clinically-grounded training designed to make you employable from day one."
      />

      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          {programmes.map((p) => (
            <article
              key={p.name}
              className="rounded-2xl border border-border bg-card p-7 shadow-card"
            >
              <h2 className="font-display text-xl font-bold text-foreground">{p.name}</h2>
              <p className="mt-2 inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                Duration: {p.duration}
              </p>

              <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-primary">
                Admission Requirements
              </h3>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                {p.requirements.map((r) => (
                  <li key={r}>• {r}</li>
                ))}
              </ul>

              <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-primary">
                Career Opportunities
              </h3>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                {p.careers.map((c) => (
                  <li key={c}>• {c}</li>
                ))}
              </ul>

              <Link
                to="/admissions"
                className="mt-6 inline-flex rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Apply for this programme
              </Link>
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}
