import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const doc = new JSDOM(readFileSync(resolve("dist/index.html"), "utf8")).window.document;

describe("adaptive reading order", () => {
  it("orders the thesis, atmospheric scene, instrument, then optional coda", () => {
    const shell = doc.querySelector('[data-testid="experience-shell"]');
    const hud = doc.querySelector('[data-testid="hero-copy"]');
    const atmosphere = doc.querySelector('[data-testid="atmosphere"]');
    const deck = doc.querySelector('[data-testid="control-deck"]');
    const coda = doc.querySelector('[data-testid="footprint-coda"]');

    expect(shell).toBeTruthy();
    expect(shell?.children[0]).toBe(hud);
    expect(shell?.children[1]).toBe(atmosphere);
    expect(deck?.previousElementSibling).toBe(shell);
    expect(coda?.previousElementSibling).toBe(deck);
  });

  it("keeps the core interaction early and the deeper model available on demand", () => {
    const deck = doc.querySelector('[data-testid="control-deck"]');
    const range = deck?.querySelector('input[type="range"]');
    const explanation = deck?.querySelector("#explanation");
    const spectrum = deck?.querySelector('[data-testid="arrival-spectrum"]');
    const disclosure = deck?.querySelector('details[data-testid="physics-disclosure"]');

    expect(range).toBeTruthy();
    expect(explanation?.textContent?.trim()).not.toBe("");
    expect(spectrum).toBeTruthy();
    expect(disclosure?.querySelector("summary")).toBeTruthy();
    expect(disclosure?.querySelectorAll('[data-testid="model-equation"]').length).toBe(3);
  });

  it("keeps the privacy coda outside the responsive Sun composition", () => {
    const stage = doc.querySelector('[data-testid="scene"]');
    const shell = doc.querySelector('[data-testid="experience-shell"]');
    const coda = doc.querySelector('[data-testid="footprint-coda"]');

    expect(stage?.contains(coda ?? null)).toBe(true);
    expect(shell?.contains(coda ?? null)).toBe(false);
    expect(coda?.hasAttribute("hidden")).toBe(true);
  });
});
