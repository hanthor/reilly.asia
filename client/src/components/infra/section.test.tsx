import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ExternalArrow, Section } from "./section";

const base = { id: "status", index: "01", eyebrow: "Live status", title: "What's running" };

describe("Section", () => {
  it("labels the section by its heading id", () => {
    const html = renderToStaticMarkup(<Section {...base}>body</Section>);
    expect(html).toContain('<section id="status" aria-labelledby="status-heading"');
    expect(html).toContain('<h2 id="status-heading"');
    expect(html).toContain("What&#x27;s running");
  });

  it("hides the index from assistive tech but keeps the eyebrow readable", () => {
    const html = renderToStaticMarkup(<Section {...base}>body</Section>);
    expect(html).toContain('<span aria-hidden="true">01 / </span>Live status');
  });

  it("renders intro and aside only when provided", () => {
    const bare = renderToStaticMarkup(<Section {...base}>body</Section>);
    expect(bare).not.toContain("<p class=\"mt-4");
    expect(bare).not.toContain("shrink-0");

    const full = renderToStaticMarkup(
      <Section {...base} intro="Probed hourly" aside={<b>refresh</b>}>
        body
      </Section>,
    );
    expect(full).toContain("Probed hourly");
    expect(full).toContain("<b>refresh</b>");
  });

  it("merges a custom className after the defaults and renders children", () => {
    const html = renderToStaticMarkup(
      <Section {...base} className="bg-red-500">
        <i>child</i>
      </Section>,
    );
    expect(html).toMatch(/class="[^"]*scroll-mt-20[^"]*bg-red-500"/);
    expect(html).toContain("<i>child</i>");
  });
});

describe("ExternalArrow", () => {
  it("is decorative", () => {
    expect(renderToStaticMarkup(<ExternalArrow />)).toMatch(/aria-hidden="true"[^>]*>→<\/span>/);
  });
});
