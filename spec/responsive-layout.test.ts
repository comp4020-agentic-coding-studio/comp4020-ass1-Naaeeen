import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve("src/styles/global.css"), "utf8");
const doc = new JSDOM(readFileSync(resolve("dist/index.html"), "utf8")).window.document;

describe("responsive layout: stage and instrument deck", () => {
  it("keeps the arrival spectrum and science model inside the instrument deck", () => {
    const rail = doc.querySelector('[data-testid="rail"]');
    const arrival = doc.querySelector('[data-testid="arrival-spectrum"]');
    const model = doc.querySelector('[data-testid="airmass-model"]');
    const atmosphere = doc.querySelector('[data-testid="atmosphere"]');

    expect(rail).toBeTruthy();
    expect(arrival).toBeTruthy();
    expect(model).toBeTruthy();
    expect(rail?.contains(arrival ?? null)).toBe(true);
    expect(rail?.contains(model ?? null)).toBe(true);
    expect(atmosphere?.contains(model ?? null)).toBe(false);
  });

  it("ships a dedicated rail sidecar instead of floating teaching panels over the sky", () => {
    expect(doc.querySelector('[data-testid="rail-sidecar"]')).toBeTruthy();
    expect(css).toMatch(/\.rail-sidecar\s*\{/);
    expect(css).toMatch(/@media \(width >= 60rem\) \{[\s\S]*?\.control-deck \.rail\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) minmax\(18rem, 28rem\)/);
  });

  it("reasserts the deck layout as the final positioning rule for the spectrum and model", () => {
    expect(css).toMatch(/\.control-deck \.arrival\s*\{[\s\S]*?position:\s*relative;[\s\S]*?top:\s*auto;[\s\S]*?right:\s*auto;/);
    expect(css).toMatch(/\.science-panel \.model-strip\s*\{[\s\S]*?position:\s*relative;[\s\S]*?inset:\s*auto;/);
  });
});
