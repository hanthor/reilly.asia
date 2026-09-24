import { cn } from "@/lib/utils";

export type DotTone = "up" | "down" | "unknown" | "offline";

const TONE: Record<DotTone, string> = {
  up: "bg-[color:var(--ix-teal)]",
  down: "bg-[color:var(--ix-rust)]",
  unknown: "bg-[color:var(--ix-muted)] opacity-60",
  offline: "bg-[color:var(--ix-orange)]",
};

export function StatusDot({ tone, pulse = false, className }: { tone: DotTone; pulse?: boolean; className?: string }) {
  return (
    <span aria-hidden="true" className={cn("relative inline-flex h-2.5 w-2.5 shrink-0", className)}>
      {pulse ? <span className={cn("ix-ping absolute inset-0 rounded-full", TONE[tone])} /> : null}
      <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", TONE[tone])} />
    </span>
  );
}

export function toneFor(up: boolean | null | undefined): DotTone {
  if (up === true) return "up";
  if (up === false) return "down";
  return "unknown";
}
