import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Section } from "@/components/site/PageHero";
import campus from "@/assets/campus.jpg";
import lab from "@/assets/lab.jpg";
import cls from "@/assets/class.jpg";
import matriculation from "@/assets/matriculation.jpg";
import training from "@/assets/training.jpg";
import graduation from "@/assets/graduation.jpg";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Zenith College of Health Science, Jos" },
      {
        name: "description",
        content:
          "Photo albums of practical sessions, laboratory work, matriculation, graduation and community outreach at Zenith College, Jos.",
      },
      { property: "og:title", content: "Gallery — Zenith College, Jos" },
      { property: "og:description", content: "Campus life in pictures." },
      { property: "og:url", content: "/gallery" },
    ],
    links: [{ rel: "canonical", href: "/gallery" }],
  }),
  component: Gallery,
});

const albums = [
  { title: "Practical Sessions", src: training },
  { title: "Laboratory", src: lab },
  { title: "Students", src: cls },
  { title: "Graduation", src: graduation },
  { title: "Matriculation", src: matriculation },
  { title: "Conferences", src: campus },
  { title: "Community Outreach", src: training },
];

function Gallery() {
  return (
    <>
      <PageHero
        eyebrow="Gallery"
        title="Campus life in pictures"
        subtitle="Photo albums from our practical sessions, ceremonies and community outreach."
      />

      <Section>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => (
            <figure
              key={a.title}
              className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card"
            >
              <img
                src={a.src}
                alt={a.title}
                width={1600}
                height={900}
                loading="lazy"
                className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <figcaption className="px-5 py-4 font-display text-base font-bold">
                {a.title}
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>
    </>
  );
}
