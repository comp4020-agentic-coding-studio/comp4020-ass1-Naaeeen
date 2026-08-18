import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve("src/styles/global.css"), "utf8");

function mediaBlocks(condition: string): string {
  const marker = `@media ${condition}`;
  let cursor = 0;
  const blocks: string[] = [];

  while (true) {
    const start = css.indexOf(marker, cursor);
    if (start < 0) break;

    const openingBrace = css.indexOf("{", start + marker.length);
    let depth = 0;
    for (let index = openingBrace; index < css.length; index += 1) {
      if (css[index] === "{") depth += 1;
      if (css[index] === "}") depth -= 1;
      if (depth === 0) {
        blocks.push(css.slice(openingBrace + 1, index));
        cursor = index + 1;
        break;
      }
    }

    if (cursor <= start) break;
  }

  return blocks.join("\n");
}

describe("responsive layout regression", () => {
  it("gives phones a compact deck with a stacked science sidecar", () => {
    const phone = mediaBlocks("(width <= 30rem)");
    expect(phone, "expected phone-specific breakpoints").not.toBe("");
    expect(phone).toMatch(/\.rail-control\s*\{[\s\S]*?display:\s*grid/);
    expect(phone).toMatch(/\.rail input\[type="range"\]\s*\{[\s\S]*?min-width:\s*0/);
    expect(phone).toMatch(/\.science-panel\s*\{[\s\S]*?gap:/);
  });

  it("compacts the expanded trace and narrows the sidecar on short desktops", () => {
    const shortDesktop = mediaBlocks("(width >= 60rem) and (height <= 52rem)");
    expect(shortDesktop, "expected a short-desktop breakpoint").not.toBe("");
    expect(shortDesktop).toMatch(/\.rail\s*\{[\s\S]*?minmax\(16rem, 23rem\)/);
    expect(shortDesktop).toMatch(/\.science-panel\s*\{[\s\S]*?gap:/);
    expect(shortDesktop).toMatch(/\.model-strip ol\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/);
  });
});
