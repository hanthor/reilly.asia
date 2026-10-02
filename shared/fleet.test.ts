import { describe, expect, it } from "vitest";
import {
  applyState,
  cleanDate,
  cleanNumber,
  cleanString,
  formatMemory,
  formatModel,
  formatOs,
  formatUptime,
  isStale,
  sanitizeFacts,
  shortCpu,
  stripAddresses,
  summarizeFleet,
} from "./fleet";

const PUNJAB = {
  schema: 1,
  host: "punjab",
  updated: "2026-09-24T14:50:55Z",
  groups: ["server"],
  os: { name: "Ubuntu", version: "24.04", codename: "noble", kernel: "7.0.0-1013-aws" },
  hardware: {
    vendor: "Amazon EC2",
    model: "t3.large",
    form_factor: "Other",
    arch: "x86_64",
    cpu: "Intel(R) Xeon(R) Platinum 8259CL CPU @ 2.50GHz",
    cpu_threads: 2,
    gpus: [],
    memory_gb: 7.6,
  },
  virtualization: "kvm",
  uptime_days: 1.0,
  last_apply: { at: "2026-09-24T00:16:03Z", ok: false },
};

describe("stripAddresses / cleanString", () => {
  it("removes IPv4 (with or without CIDR)", () => {
    expect(cleanString("eth0 192.168.1.20 up")).toBe("eth0 up");
    expect(cleanString("10.20.0.0/16")).toBeNull();
    expect(cleanString("gw=100.64.0.1")).toBe("gw=");
  });
  it("removes MAC addresses in both separator styles", () => {
    expect(cleanString("nic de:ad:be:ef:00:01")).toBe("nic");
    expect(cleanString("DE-AD-BE-EF-00-01 wired")).toBe("wired");
  });
  it("removes IPv6 addresses but keeps times and versions", () => {
    expect(cleanString("fd7a:115c:a1e0::1 tailnet")).toBe("tailnet");
    expect(cleanString("2001:db8:85a3:0:0:8a2e:370:7334")).toBeNull();
    expect(cleanString("fe80::1%eth0")).toBeNull();
    expect(stripAddresses("up 14:50:55")).toBe("up 14:50:55");
    expect(cleanString("7.0.0-1013-aws")).toBe("7.0.0-1013-aws");
    expect(cleanString("24.04")).toBe("24.04");
    expect(cleanString("Intel(R) Xeon(R) CPU @ 2.50GHz")).toBe("Intel(R) Xeon(R) CPU @ 2.50GHz");
  });
  it("trims, drops control characters and caps length", () => {
    expect(cleanString("  a\n\tb\u0000 ")).toBe("a b");
    expect(cleanString("")).toBeNull();
    expect(cleanString("   ")).toBeNull();
    expect(cleanString("x".repeat(500))!.length).toBe(120);
  });
  it("coerces numbers and rejects non-strings", () => {
    expect(cleanString(24.04)).toBe("24.04");
    expect(cleanString(NaN)).toBeNull();
    expect(cleanString({})).toBeNull();
    expect(cleanString(["a"])).toBeNull();
    expect(cleanString(null)).toBeNull();
  });
});

describe("cleanNumber / cleanDate", () => {
  it("accepts numbers and numeric strings within range", () => {
    expect(cleanNumber(2, 1, 10)).toBe(2);
    expect(cleanNumber("7.6", 0, 100)).toBe(7.6);
    expect(cleanNumber(" 12 ", 0, 100)).toBe(12);
    expect(cleanNumber("", 0, 100)).toBeNull();
    expect(cleanNumber("12GB", 0, 100)).toBeNull();
    expect(cleanNumber(1e9, 0, 100)).toBeNull();
    expect(cleanNumber(Infinity, 0, Infinity)).toBeNull();
    expect(cleanNumber(true, 0, 10)).toBeNull();
  });
  it("normalises dates and rejects junk", () => {
    expect(cleanDate("2026-09-24T14:50:55Z")).toBe("2026-09-24T14:50:55Z");
    expect(cleanDate("2026-09-24T16:50:55+02:00")).toBe("2026-09-24T14:50:55Z");
    expect(cleanDate("yesterday")).toBeNull();
    expect(cleanDate("1970-01-01T00:00:00Z")).toBeNull();
    expect(cleanDate(1727189455)).toBeNull();
  });
});

describe("sanitizeFacts", () => {
  it("passes the real punjab report through unchanged", () => {
    expect(sanitizeFacts(PUNJAB, "punjab")).toEqual(PUNJAB);
  });
  it("drops unknown fields at every level", () => {
    const f = sanitizeFacts(
      { ...PUNJAB, ip: "1.2.3.4", secret: "x", os: { ...PUNJAB.os, extra: 1 }, hardware: { ...PUNJAB.hardware, serial: "ABC" } },
      "punjab",
    )!;
    expect(f).toEqual(PUNJAB);
    expect(JSON.stringify(f)).not.toMatch(/1\.2\.3\.4|secret|serial|extra/);
  });
  it("coerces string numbers and booleans", () => {
    const f = sanitizeFacts(
      {
        hardware: { cpu_threads: "16", memory_gb: "62.34", gpus: "not a list" },
        uptime_days: "3.45",
        last_apply: { ok: "true", at: "2026-09-20T00:00:00Z" },
      },
      "dilli",
    )!;
    expect(f.hardware.cpu_threads).toBe(16);
    expect(f.hardware.memory_gb).toBe(62.3);
    expect(f.hardware.gpus).toEqual([]);
    expect(f.uptime_days).toBe(3.5);
    expect(f.last_apply).toEqual({ ok: true, at: "2026-09-20T00:00:00Z" });
  });
  it("treats every field as optional", () => {
    const f = sanitizeFacts({}, "goa")!;
    expect(f.host).toBe("goa");
    expect(f.os).toEqual({ name: null, version: null, codename: null, kernel: null });
    expect(f.hardware.cpu_threads).toBeNull();
    expect(f.last_apply).toEqual({ at: null, ok: null });
    expect(f.virtualization).toBeNull();
  });
  it("turns empty strings into null and strips addresses inside fields", () => {
    const f = sanitizeFacts({ virtualization: "", os: { name: "Debian", kernel: "6.12 on 192.168.0.9" }, hardware: { gpus: ["", "AMD Radeon 8060S", "aa:bb:cc:dd:ee:ff"] } }, "goa")!;
    expect(f.virtualization).toBeNull();
    expect(f.os.kernel).toBe("6.12 on");
    expect(f.hardware.gpus).toEqual(["AMD Radeon 8060S"]);
  });
  it("uses the requested host name, not the file's claim", () => {
    expect(sanitizeFacts({ ...PUNJAB, host: "evil" }, "punjab")!.host).toBe("punjab");
  });
  it("filters group names", () => {
    expect(sanitizeFacts({ groups: ["desktop", "<script>", 5, "llm"] }, "himachal")!.groups).toEqual(["desktop", "5", "llm"]);
  });
  it("rejects non-objects", () => {
    expect(sanitizeFacts(null, "x")).toBeNull();
    expect(sanitizeFacts("hi", "x")).toBeNull();
    expect(sanitizeFacts([PUNJAB], "x")).toBeNull();
  });
});

describe("formatting", () => {
  it("formats OS", () => {
    expect(formatOs(PUNJAB.os)).toBe("Ubuntu 24.04 · noble");
    expect(formatOs({ name: "postmarketOS", version: "v25.06", codename: null, kernel: null })).toBe("postmarketOS v25.06");
    expect(formatOs({ name: null, version: null, codename: "x", kernel: null })).toBeNull();
  });
  it("tidies vendor + model", () => {
    expect(formatModel(PUNJAB.hardware)).toBe("Amazon EC2 t3.large");
    expect(formatModel({ vendor: "Raspberry Pi", model: "Raspberry Pi 5 Model B Rev 1.0" })).toBe("Raspberry Pi 5 Model B");
    expect(formatModel({ vendor: "Framework", model: "Laptop 13 (AMD Ryzen 7040Series)" })).toBe("Framework Laptop 13 (AMD Ryzen 7040Series)");
    expect(formatModel({ vendor: "To Be Filled By O.E.M.", model: "B650M" })).toBe("B650M");
    expect(formatModel({ vendor: "Google", model: null })).toBe("Google");
    expect(formatModel({ vendor: null, model: null })).toBeNull();
  });
  it("shortens CPU names", () => {
    expect(shortCpu(PUNJAB.hardware.cpu)).toBe("Intel Xeon Platinum 8259CL");
    expect(shortCpu("11th Gen Intel(R) Core(TM) i7-1165G7 @ 2.80GHz")).toBe("11th Gen Intel Core i7-1165G7");
    expect(shortCpu("AMD Ryzen 9 5900X 12-Core Processor")).toBe("AMD Ryzen 9 5900X");
    expect(shortCpu("AMD Ryzen 7 7840U w/ Radeon 780M Graphics")).toBe("AMD Ryzen 7 7840U");
    expect(shortCpu("Cortex-A76")).toBe("Cortex-A76");
    expect(shortCpu(null)).toBeNull();
  });
  it("formats memory and uptime", () => {
    expect(formatMemory(7.6)).toBe("7.6 GB");
    expect(formatMemory(62.3)).toBe("62 GB");
    expect(formatMemory(null)).toBeNull();
    expect(formatUptime(0.2)).toBe("5 h");
    expect(formatUptime(1)).toBe("1 day");
    expect(formatUptime(3.44)).toBe("3.4 days");
    expect(formatUptime(41.7)).toBe("42 days");
  });
  it("flags stale reports and apply state", () => {
    const now = Date.parse("2026-09-24T15:00:00Z");
    expect(isStale("2026-09-24T14:50:55Z", now)).toBe(false);
    expect(isStale("2026-09-20T14:50:55Z", now)).toBe(true);
    expect(isStale(null, now)).toBe(true);
    expect(applyState({ at: null, ok: true })).toBe("ok");
    expect(applyState({ at: null, ok: false })).toBe("failed");
    expect(applyState(undefined)).toBe("unknown");
  });
  it("summarizes the reporting machines", () => {
    const p = sanitizeFacts(PUNJAB, "punjab")!;
    const g = sanitizeFacts({ os: { name: "Debian" }, hardware: { memory_gb: 8, cpu_threads: "4" } }, "goa")!;
    const s = summarizeFleet({ punjab: p, goa: g, dilli: null }, ["punjab", "goa", "dilli", "kanpur"]);
    expect(s).toEqual({ reporting: 2, total: 4, os: [["Debian", 1], ["Ubuntu", 1]], memoryGb: 15.6, threads: 6 });
  });
});
