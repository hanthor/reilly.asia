import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  id: string;
  index: string;
  eyebrow: string;
  title: string;
  intro?: ReactNode;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Section({ id, index, eyebrow, title, intro, aside, className, children }: SectionProps) {
  const headingId = `${id}-heading`;
  return (
    <section id={id} aria-labelledby={headingId} className={cn("scroll-mt-20 py-14 sm:py-20", className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="ix-mono mb-3 text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--ix-teal)]">
              <span aria-hidden="true">{index} / </span>
              {eyebrow}
            </p>
            <h2 id={headingId} className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              {title}
            </h2>
            {intro ? <p className="mt-4 text-base leading-relaxed text-[color:var(--ix-muted)] sm:text-lg">{intro}</p> : null}
          </div>
          {aside ? <div className="shrink-0">{aside}</div> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

export function ExternalArrow() {
  return (
    <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-0.5">
      →
    </span>
  );
}
