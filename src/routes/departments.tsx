import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Section } from "@/components/site/PageHero";

export const Route = createFileRoute("/departments")({
  head: () => ({
    meta: [
      { title: "Departments — Zenith College of Health Science, Jos" },
      {
        name: "description",
        content:
          "Academic and administrative departments of Zenith College of Health Science and Technology, Jos.",
      },
      { property: "og:title", content: "Departments — Zenith College, Jos" },
      { property: "og:description", content: "Academic and support departments of the College." },
      { property: "og:url", content: "/departments" },
    ],
    links: [{ rel: "canonical", href: "/departments" }],
  }),
  component: Departments,
});

const academic = [
  {
    name: "Department of Community Health",
    text: "Trains Community Health Extension Workers for primary health care delivery.",
  },
  {
    name: "Department of Medical Laboratory Science",
    text: "Diagnostic techniques, haematology, microbiology and laboratory safety.",
  },
  {
    name: "Department of Public Health",
    text: "Epidemiology, health promotion, environmental and reproductive health.",
  },
  {
    name: "Department of Pharmacy Technology",
    text: "Pharmaceutics, dispensing practice and drug supply management.",
  },
  {
    name: "Department of General Studies",
    text: "Communication, ICT, entrepreneurship and professional ethics.",
  },
];

const support = [
  "Academic Affairs / Registry",
  "Student Affairs",
  "Bursary",
  "Library Services",
  "ICT Centre",
  "Clinical Placement Unit",
];

function Departments() {
  return (
    <>
      <PageHero
        eyebrow="Departments"
        title="Academic and administrative departments"
        subtitle="Each department combines classroom instruction with supervised clinical practice."
      />

      <Section title="Academic Departments">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {academic.map((d) => (
            <div key={d.name} className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h3 className="font-display text-base font-bold text-primary">{d.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Support Units" muted>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {support.map((s) => (
            <div
              key={s}
              className="rounded-xl border border-border bg-card px-5 py-4 text-sm font-semibold shadow-card"
            >
              {s}
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
