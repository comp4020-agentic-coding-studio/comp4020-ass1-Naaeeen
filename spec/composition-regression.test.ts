import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const doc = new JSDOM(readFileSync(resolve("dist/index.html"), "utf8")).window.document;

describe("responsive composition regression", () => {
  it("does not repeat the page title as the dominant horizon reveal", () => {
    const title = doc.querySelector("h1")?.textContent?.trim().toLowerCase();
    const revealLead = doc
      .querySelector('[data-testid="horizon-reveal"] p')
      ?.textContent?.trim()
      .toLowerCase();

    expect(title).toBeTruthy();
    expect(revealLead).toBeTruthy();
    expect(revealLead).not.toBe(title);
    expect(revealLead).toContain("atmosphere");
  });

  it("keeps the science readouts in the rail rather than inside the atmospheric image region", () => {
    const rail = doc.querySelector('[data-testid="rail"]');
    const model = doc.querySelector('[data-testid="airmass-model"]');
    const arrival = doc.querySelector('[data-testid="arrival-spectrum"]');
    const atmosphere = doc.querySelector('[data-testid="atmosphere"]');

    expect(rail?.contains(model ?? null)).toBe(true);
    expect(rail?.contains(arrival ?? null)).toBe(true);
    expect(atmosphere?.contains(model ?? null)).toBe(false);
    expect(atmosphere?.contains(arrival ?? null)).toBe(false);
  });
});
