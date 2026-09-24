import { Bot, Cloud, Container, FileCode2, GitBranch, KeyRound, Network, Terminal } from "lucide-react";
import { STACK } from "./data";
import { Section } from "./section";

const ICONS = {
  Ansible: Terminal,
  Tailscale: Network,
  Bitwarden: KeyRound,
  OpenTofu: FileCode2,
  "Talos + Kubernetes": Container,
  Cloudflare: Cloud,
  "GitHub Actions": GitBranch,
  Hive: Bot,
} as const;

export function Stack() {
  return (
    <Section
      id="stack"
      index="05"
      eyebrow="Stack"
      title="The tools and why they're here"
      intro="Each tool was picked so that there's less to do by hand, and so that anything that could drift is written down as code."
    >
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STACK.map((s) => {
          const Icon = ICONS[s.name as keyof typeof ICONS] ?? Terminal;
          return (
            <li key={s.name}>
              <a
                href={s.href}
                className="group ix-card flex h-full flex-col gap-3 p-5 transition-colors hover:border-[color:var(--ix-teal)]"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color:var(--ix-surface-2)] text-[color:var(--ix-ink)] transition-colors group-hover:bg-[color:var(--ix-teal-soft)] group-hover:text-[color:var(--ix-teal)]">
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  <h3 className="flex-1 font-heading text-lg font-bold leading-tight">{s.name}</h3>
                  <span aria-hidden="true" className="text-[color:var(--ix-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[color:var(--ix-teal)]">
                    →
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-[color:var(--ix-muted)]">{s.what}</p>
              </a>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
