import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const doc = new JSDOM(readFileSync(resolve("dist/index.html"), "utf8")).window.document;

function normalizedText(element: Element | null): string {
  return (element?.textContent ?? "").replace(/\s+/g, " ").trim();
}

describe("adaptive composition regression", () => {
  it("keeps the causal conclusion in the HUD, outside the atmospheric image", () => {
    const hud = doc.querySelector('[data-testid="hero-copy"]');
    const atmosphere = doc.querySelector('[data-testid="atmosphere"]');
    const reveal = doc.querySelector('[data-testid="horizon-reveal"]');
    const title = normalizedText(hud?.querySelector("h1") ?? null).toLowerCase();
    const conclusion = normalizedText(reveal?.querySelector("p") ?? null).toLowerCase();

    expect(hud?.contains(reveal ?? null)).toBe(true);
    expect(atmosphere?.contains(reveal ?? null)).toBe(false);
    expect(title).toBeTruthy();
    expect(conclusion).toContain("atmosphere");
    expect(conclusion).not.toBe(title);
  });

  it("keeps science readouts and full explanatory copy in the instrument rail", () => {
    const rail = doc.querySelector('[data-testid="rail"]');
    const atmosphere = doc.querySelector('[data-testid="atmosphere"]');
    const model = doc.querySelector('[data-testid="airmass-model"]');
    const arrival = doc.querySelector('[data-testid="arrival-spectrum"]');
    const disclosure = doc.querySelector('[data-testid="physics-disclosure"]');

    expect(rail?.contains(model ?? null)).toBe(true);
    expect(rail?.contains(arrival ?? null)).toBe(true);
    expect(rail?.contains(disclosure ?? null)).toBe(true);
    expect(disclosure?.tagName).toBe("DETAILS");
    expect(normalizedText(disclosure?.querySelector("summary") ?? null)).not.toBe("");
    expect(model?.querySelectorAll("small").length).toBe(3);
    expect(atmosphere?.contains(model ?? null)).toBe(false);
    expect(atmosphere?.contains(arrival ?? null)).toBe(false);
  });

  it("ships unique IDs so one responsive DOM owns one state", () => {
    const ids = [...doc.querySelectorAll("[id]")].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(doc.querySelectorAll('input[type="range"]').length).toBe(1);
    expect(doc.querySelectorAll("h1").length).toBe(1);
  });
});
