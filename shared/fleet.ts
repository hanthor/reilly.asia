// Device facts that fleet machines publish to the `fleet-facts` branch of
// hanthor/dotfiles (roles/fleet_facts). Shared by the Worker's
// /infra/api/fleet endpoint, which sanitizes them, and the /infra page, which
// formats them. Keep this file dependency-free: it is bundled into both.
//
// The files are written by the machines themselves, so treat every field as
// untrusted: optional, possibly empty, numbers possibly sent as strings.

/** Ansible-managed hosts that publish facts. Matches the fleet on the page. */
export const FACT_HOSTS = ["himachal", "kanpur", "dilli", "kerala", "mumbai", "goa", "punjab", "termux"] as const;
export type FactHost = (typeof FACT_HOSTS)[number];

export const FACTS_RAW_BASE = "https://raw.githubusercontent.com/hanthor/dotfiles/fleet-facts/facts/";

export interface FleetFacts {
  schema: 1;
  host: string;
  /** ISO time the machine last wrote its facts. */
  updated: string | null;
  groups: string[];
  os: {
    name: string | null;
    version: string | null;
    codename: string | null;
    kernel: string | null;
  };
  hardware: {
    vendor: string | null;
    model: string | null;
    form_factor: string | null;
    arch: string | null;
    cpu: string | null;
    cpu_threads: number | null;
    gpus: string[];
    memory_gb: number | null;
  };
  /** Hypervisor when the machine is a guest (e.g. "kvm"), else null. */
  virtualization: string | null;
  uptime_days: number | null;
  last_apply: { at: string | null; ok: boolean | null };
}

export interface FleetPayload {
  hosts: Record<string, FleetFacts | null>;
  fetchedAt: string;
}

// --- sanitizing -----------------------------------------------------------

const MAX_STR = 120;
const IPV4 = /\b(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}(?:\/\d{1,2})?\b/g;
const MAC = /\b[0-9a-f]{2}(?:[:-][0-9a-f]{2}){5}\b/gi;
// Candidate IPv6 tokens; confirmed by looksLikeIpv6 so "14:50:55" survives.
const IPV6_CANDIDATE = /[0-9a-f]*:[0-9a-f:.]*(?:%[\w.-]+)?(?:\/\d{1,3})?/gi;

function looksLikeIpv6(token: string): boolean {
  const addr = token.replace(/%[\w.-]+$/, "").replace(/\/\d{1,3}$/, "");
  if (!/^[0-9a-f:.]+$/i.test(addr)) return false;
  const colons = (addr.match(/:/g) ?? []).length;
  return addr.includes("::") ? colons >= 2 : colons >= 5;
}

/** Remove anything shaped like an IPv4/IPv6/MAC address. */
export function stripAddresses(s: string): string {
  return s
    .replace(MAC, " ")
    .replace(IPV4, " ")
    .replace(IPV6_CANDIDATE, (m) => (looksLikeIpv6(m) ? " " : m));
}

/** A display string: trimmed, control chars and addresses removed, capped. Empty → null. */
export function cleanString(v: unknown, max = MAX_STR): string | null {
  if (typeof v !== "string" && typeof v !== "number") return null;
  if (typeof v === "number" && !Number.isFinite(v)) return null;
  const s = stripAddresses(String(v).replace(/[\u0000-\u001f\u007f]/g, " "))
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[\s,;:/|-]+|[\s,;:/|-]+$/g, "");
  if (!s) return null;
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}

/** A finite number from a number or numeric string, within [min, max]. */
export function cleanNumber(v: unknown, min: number, max: number): number | null {
  let n: number;
  if (typeof v === "number") n = v;
  else if (typeof v === "string" && /^\s*-?\d+(?:\.\d+)?\s*$/.test(v)) n = Number(v);
  else return null;
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

export function cleanBool(v: unknown): boolean | null {
  if (typeof v === "boolean") return v;
  if (v === "true" || v === "True" || v === 1 || v === "1") return true;
  if (v === "false" || v === "False" || v === 0 || v === "0") return false;
  return null;
}

/** ISO timestamp (seconds precision) for a parseable date between 2000 and 2100. */
export function cleanDate(v: unknown): string | null {
  if (typeof v !== "string" || v.length > 64) return null;
  const t = Date.parse(v);
  if (!Number.isFinite(t)) return null;
  const d = new Date(t);
  const y = d.getUTCFullYear();
  if (y < 2000 || y > 2100) return null;
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function stringList(v: unknown, limit: number, pattern?: RegExp): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const item of v) {
    const s = cleanString(item);
    if (s && (!pattern || pattern.test(s)) && !out.includes(s)) out.push(s);
    if (out.length >= limit) break;
  }
  return out;
}

const round1 = (n: number | null) => (n == null ? null : Math.round(n * 10) / 10);

/**
 * Shape untrusted JSON into FleetFacts. Unknown fields are dropped, strings are
 * cleaned, numbers coerced. `host` is always the name we asked for, never the
 * file's claim. Returns null when the input is not an object at all.
 */
export function sanitizeFacts(raw: unknown, host: string): FleetFacts | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const os = obj(r.os);
  const hw = obj(r.hardware);
  const apply = obj(r.last_apply);
  const threads = cleanNumber(hw.cpu_threads, 1, 4096);
  return {
    schema: 1,
    host,
    updated: cleanDate(r.updated),
    groups: stringList(r.groups, 8, /^[a-z0-9_-]{1,32}$/i),
    os: {
      name: cleanString(os.name, 60),
      version: cleanString(os.version, 40),
      codename: cleanString(os.codename, 40),
      kernel: cleanString(os.kernel, 80),
    },
    hardware: {
      vendor: cleanString(hw.vendor, 60),
      model: cleanString(hw.model, 80),
      form_factor: cleanString(hw.form_factor, 40),
      arch: cleanString(hw.arch, 20),
      cpu: cleanString(hw.cpu),
      cpu_threads: threads == null ? null : Math.round(threads),
      gpus: stringList(hw.gpus, 4),
      memory_gb: round1(cleanNumber(hw.memory_gb, 0.01, 100_000)),
    },
    virtualization: cleanString(r.virtualization, 30),
    uptime_days: round1(cleanNumber(r.uptime_days, 0, 36_500)),
    last_apply: { at: cleanDate(apply.at), ok: cleanBool(apply.ok) },
  };
}

// --- formatting (page) ----------------------------------------------------

/** "Ubuntu 24.04 · noble" */
export function formatOs(os: FleetFacts["os"]): string | null {
  const main = [os.name, os.version].filter(Boolean).join(" ");
  if (!main) return null;
  return os.codename && !main.toLowerCase().includes(os.codename.toLowerCase()) ? `${main} · ${os.codename}` : main;
}

// DMI placeholders that say nothing about the machine.
const PLACEHOLDER = /^(to be filled by o\.?e\.?m\.?|default string|system (manufacturer|product name)|not specified|none|unknown|n\/a|na|other|o\.e\.m\.?)$/i;

/** "Amazon EC2 t3.large", "Raspberry Pi 5 Model B" — vendor + model without repetition or noise. */
export function formatModel(hw: Pick<FleetFacts["hardware"], "vendor" | "model">): string | null {
  const vendor = hw.vendor && !PLACEHOLDER.test(hw.vendor) ? hw.vendor : null;
  let model = hw.model && !PLACEHOLDER.test(hw.model) ? hw.model : null;
  if (model) model = model.replace(/\s+Rev(ision)?\s+[\w.]+$/i, "").trim();
  if (!model) return vendor;
  if (!vendor) return model;
  const vFirst = vendor.split(/\s+/)[0].toLowerCase();
  if (model.toLowerCase().startsWith(vendor.toLowerCase()) || model.toLowerCase().startsWith(vFirst)) return model;
  return `${vendor} ${model}`;
}

/** "Intel(R) Xeon(R) Platinum 8259CL CPU @ 2.50GHz" → "Intel Xeon Platinum 8259CL". */
export function shortCpu(cpu: string | null | undefined): string | null {
  if (!cpu) return null;
  const s = cpu
    .replace(/\((R|TM|C)\)|[®™]/gi, "")
    .replace(/\s+w\/\s.*$/i, "")
    .replace(/\s+with\s+Radeon.*$/i, "")
    .replace(/\s*(CPU\s*)?@\s*[\d.]+\s*[GM]Hz/i, "")
    .replace(/\s+\d+-Core(\s+Processor)?/i, "")
    .replace(/\s+(CPU|Processor)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return s || null;
}

/** "7.6 GB", "62 GB" */
export function formatMemory(gb: number | null | undefined): string | null {
  if (gb == null || !Number.isFinite(gb) || gb <= 0) return null;
  return `${gb >= 10 ? Math.round(gb) : Math.round(gb * 10) / 10} GB`;
}

/** "5 h", "1 day", "3.4 days" */
export function formatUptime(days: number | null | undefined): string | null {
  if (days == null || !Number.isFinite(days) || days < 0) return null;
  if (days < 1) return `${Math.max(1, Math.round(days * 24))} h`;
  const d = days >= 10 ? Math.round(days) : Math.round(days * 10) / 10;
  return d === 1 ? "1 day" : `${d} days`;
}

export const STALE_AFTER_MS = 3 * 86_400_000;

export function isStale(updated: string | null, nowMs: number): boolean {
  if (!updated) return true;
  const t = Date.parse(updated);
  return !Number.isFinite(t) || nowMs - t > STALE_AFTER_MS;
}

export type ApplyState = "ok" | "failed" | "unknown";

export function applyState(a: FleetFacts["last_apply"] | undefined): ApplyState {
  if (a?.ok === true) return "ok";
  if (a?.ok === false) return "failed";
  return "unknown";
}

export interface FleetSummary {
  reporting: number;
  total: number;
  /** [label, count], most common first. */
  os: [string, number][];
  memoryGb: number;
  threads: number;
}

export function summarizeFleet(hosts: Record<string, FleetFacts | null | undefined>, names: readonly string[]): FleetSummary {
  const osCount = new Map<string, number>();
  let reporting = 0;
  let memoryGb = 0;
  let threads = 0;
  for (const name of names) {
    const f = hosts[name];
    if (!f) continue;
    reporting++;
    const os = f.os.name ?? "Unknown OS";
    osCount.set(os, (osCount.get(os) ?? 0) + 1);
    memoryGb += f.hardware.memory_gb ?? 0;
    threads += f.hardware.cpu_threads ?? 0;
  }
  const os = [...osCount.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return { reporting, total: names.length, os, memoryGb: Math.round(memoryGb * 10) / 10, threads };
}
