import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve("src/styles/global.css"), "utf8");

describe("responsive composition regression", () => {
  it("does not repeat the page title as the dominant horizon reveal", () => {
    const doc = new JSDOM(readFileSync(resolve("dist/index.html"), "utf8")).window.document;
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

  it("anchors the received-light witness away from the mobile observer and rail", () => {
    expect(css).toMatch(
      /@media \(width < 44rem\) \{[\s\S]*?\.received-colour\s*\{[\s\S]*?inset:\s*auto clamp\([^)]+\) clamp\([^)]+\) auto;[\s\S]*?translate:\s*none;/,
    );
  });

  it("bounds the reveal and model independently on very wide screens", () => {
    expect(css).toMatch(
      /@media \(width >= 90rem\) \{[\s\S]*?\.model-strip\s*\{[\s\S]*?width:\s*min\(48rem, 40vw\);[\s\S]*?\.horizon-reveal\s*\{[\s\S]*?width:\s*min\(40rem, 36vw\);/,
    );
  });
});
