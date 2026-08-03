export function PageHero({
  title,
  subtitle,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
}) {
  return (
    <section className="band-gradient text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-14 md:py-20">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">{eyebrow}</p>
        )}
        <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-4 max-w-2xl text-sm opacity-85 md:text-base">{subtitle}</p>}
      </div>
    </section>
  );
}

export function Section({
  title,
  children,
  muted,
}: {
  title?: string;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <section className={muted ? "bg-muted/60" : ""}>
      <div className="mx-auto max-w-7xl px-4 py-14 md:py-16">
        {title && (
          <h2 className="mb-8 font-display text-2xl font-bold text-foreground md:text-3xl">
            {title}
          </h2>
        )}
        {children}
      </div>
    </section>
  );
}
