import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve("src/styles/global.css"), "utf8");

function mediaBlock(condition: string): string {
  const marker = `@media ${condition}`;
  const start = css.indexOf(marker);
  if (start < 0) return "";

  const openingBrace = css.indexOf("{", start + marker.length);
  let depth = 0;
  for (let index = openingBrace; index < css.length; index += 1) {
    if (css[index] === "{") depth += 1;
    if (css[index] === "}") depth -= 1;
    if (depth === 0) return css.slice(openingBrace + 1, index);
  }
  return "";
}

describe("responsive layout regression", () => {
  it("gives phones a compact control, model, and trace layout", () => {
    const phone = mediaBlock("(width <= 30rem)");
    expect(phone, "expected a phone-specific breakpoint").not.toBe("");
    expect(phone).toMatch(/\.rail-control\s*\{[\s\S]*?display:\s*grid/);
    expect(phone).toMatch(/\.rail input\[type="range"\]\s*\{[\s\S]*?min-width:\s*0/);
    expect(phone).toMatch(/\.trace-facts-wide\s*\{[\s\S]*?repeat\(3,/);
    expect(phone).toMatch(/\.model-strip\s*\{[\s\S]*?width:\s*min\(11rem, 46vw\)/);
    expect(phone).toMatch(/\.model-strip ol\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/);
  });

  it("compacts the expanded trace and moves its model clear on short desktops", () => {
    const shortDesktop = mediaBlock("(width >= 60rem) and (height <= 52rem)");
    expect(shortDesktop, "expected a short-desktop breakpoint").not.toBe("");
    expect(shortDesktop).toMatch(/\.coda-shell\s*\{[\s\S]*?gap:/);
    expect(shortDesktop).toMatch(/\.trace-card\[data-trace-card="2"\]/);
    expect(shortDesktop).toMatch(/\.trace-facts-wide/);
    expect(shortDesktop).toMatch(/\.model-strip\s*\{[\s\S]*?width:\s*min\(40rem, 37vw\)/);
  });
});
