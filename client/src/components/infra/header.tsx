import { ThemeToggle } from "@/components/theme-toggle";
import { HANDBOOK } from "./data";

const LINKS = [
  { href: "#status", label: "Status" },
  { href: "#architecture", label: "Architecture" },
  { href: "#automation", label: "Automation" },
  { href: "#fleet", label: "Fleet" },
  { href: "#stack", label: "Stack" },
];

export function InfraHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--ix-line)] bg-[color:color-mix(in_srgb,var(--ix-bg)_82%,transparent)] backdrop-blur-md">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-[color:var(--ix-surface)] focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="ix-mono flex min-w-0 items-center gap-2 text-sm">
          <a href="/" className="flex items-center gap-2 font-semibold hover:[--ix-link:var(--ix-teal)]">
            <img src="/profile.png" alt="" width={28} height={28} className="h-7 w-7 rounded-full object-cover" />
            <span>reilly.asia</span>
          </a>
          <span aria-hidden="true" className="text-[color:var(--ix-muted)]">/</span>
          <span className="text-[color:var(--ix-teal)]">infra</span>
        </div>
        <nav aria-label="Page sections" className="flex items-center gap-1">
          <ul className="hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="rounded-md px-3 py-2 text-sm font-medium [--ix-link:var(--ix-muted)] hover:[--ix-link:var(--ix-ink)]"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href={HANDBOOK}
            className="ml-1 rounded-md px-3 py-2 text-sm font-semibold [--ix-link:var(--ix-teal)] hover:bg-[color:var(--ix-teal-soft)]"
          >
            Handbook
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
