import { BookOpen, Github } from "lucide-react";
import { HANDBOOK, REPO_URL } from "./data";

export function InfraFooter() {
  return (
    <footer className="border-t border-[color:var(--ix-line)]">
      <div className="ix-dots">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="max-w-xl">
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Want the details?</h2>
            <p className="mt-3 text-[color:var(--ix-muted)]">
              The handbook documents every Ansible role, the runbooks, the cluster rebuild steps and the incident
              write-ups. It is generated from the same repo.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={HANDBOOK}
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[color:var(--ix-teal-fill)] px-5 py-3 font-semibold [--ix-link:var(--ix-on-fill)] hover:brightness-110"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Read the handbook
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </a>
            <a
              href={REPO_URL}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[color:var(--ix-line)] bg-[color:var(--ix-surface)] px-5 py-3 font-semibold hover:border-[color:var(--ix-ink)]"
            >
              <Github className="h-4 w-4" aria-hidden="true" />
              Source on GitHub
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-[color:var(--ix-line)]">
        <div className="ix-mono mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-[color:var(--ix-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <a href="/" className="hover:[--ix-link:var(--ix-teal)]">
            ← reilly.asia
          </a>
          <p>&copy; {new Date().getFullYear()} James Reilly Consulting LLC</p>
        </div>
      </div>
    </footer>
  );
}
