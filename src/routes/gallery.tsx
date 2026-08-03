import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Section } from "@/components/site/PageHero";
import nursingGroup from "@/assets/nursing-group.jpg.asset.json";
import studentsNursing from "@/assets/students-nursing.png.asset.json";
import chewStudents from "@/assets/chew-students.png.asset.json";
import mltStudents from "@/assets/mlt-students.jpg.asset.json";
import studentPortrait from "@/assets/student-portrait.jpg.asset.json";
import studentsCorridor from "@/assets/students-corridor.jpg.asset.json";
import lectureSession from "@/assets/lecture-session.jpg.asset.json";
import certificateAward from "@/assets/certificate-award.jpg.asset.json";
import convocation from "@/assets/convocation.jpg.asset.json";

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
  { title: "Nursing Students", src: nursingGroup.url },
  { title: "Clinical Practicals", src: studentsNursing.url },
  { title: "CHEW Department", src: chewStudents.url },
  { title: "Medical Laboratory (MLT)", src: mltStudents.url },
  { title: "Campus Life", src: studentsCorridor.url },
  { title: "Our Students", src: studentPortrait.url },
  { title: "Lectures & Seminars", src: lectureSession.url },
  { title: "Awards & Recognition", src: certificateAward.url },
  { title: "Convocation", src: convocation.url },
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
