import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Section } from "@/components/site/PageHero";
import campus from "@/assets/campus.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Zenith College of Health Science, Jos" },
      {
        name: "description",
        content:
          "History, vision, mission and ACCEIR core values of Zenith College of Health Science and Technology, Jos.",
      },
      { property: "og:title", content: "About Zenith College of Health Science, Jos" },
      {
        property: "og:description",
        content: "Our history, vision, mission and core values.",
      },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: About,
});

const values = [
  ["Accountability", "We take responsibility for our actions and outcomes."],
  ["Commitment", "We are dedicated to every student's success."],
  ["Competence", "We build real, verifiable professional skill."],
  ["Excellence", "We pursue the highest academic and clinical standards."],
  ["Integrity", "We uphold honesty and ethical practice."],
  ["Respect", "We value the dignity of every person we serve."],
];

const facilities = [
  "Medical Laboratory",
  "ICT Centre",
  "Demonstration Rooms",
  "Modern Classrooms",
  "Library",
  "Examination Hall",
  "Administrative Block",
  "Practical Equipment",
];

function About() {
  return (
    <>
      <PageHero
        eyebrow="About Us"
        title="Training for Service since our founding"
        subtitle="A private health institution in Bukuru, Jos South, dedicated to quality education and professional training in health sciences."
      />

      <Section>
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-bold">History</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
              Zenith College of Health Science and Technology, Jos is a private health institution
              established to provide quality education and professional training in health sciences.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
              The College is committed to producing competent, ethical, and highly skilled
              healthcare professionals capable of meeting national and global healthcare needs.
            </p>
          </div>
          <img
            src={campus}
            alt="Zenith College campus building"
            width={1600}
            height={900}
            loading="lazy"
            className="rounded-2xl object-cover shadow-lift"
          />
        </div>
      </Section>

      <Section muted>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
            <h2 className="font-display text-xl font-bold text-primary">Vision</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              To become one of Nigeria's leading health science institutions recognized for academic
              excellence, research, innovation, and professional service.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
            <h2 className="font-display text-xl font-bold text-primary">Mission</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              To discover, prepare, and impact lives through quality healthcare education, research,
              and community service.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Core Values (ACCEIR)">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {values.map(([name, text]) => (
            <div key={name} className="rounded-xl border border-border bg-card p-6 shadow-card">
              <span className="grid h-9 w-9 place-items-center rounded-lg band-gradient font-display font-bold text-primary-foreground">
                {name[0]}
              </span>
              <h3 className="mt-4 font-display text-base font-bold">{name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Our Facilities" muted>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {facilities.map((f) => (
            <div
              key={f}
              className="rounded-xl border border-border bg-card px-5 py-4 text-sm font-semibold shadow-card"
            >
              {f}
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
