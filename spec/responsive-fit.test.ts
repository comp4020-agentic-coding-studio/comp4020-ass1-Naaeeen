import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const doc = new JSDOM(readFileSync(resolve("dist/index.html"), "utf8")).window.document;

describe("adaptive reading order", () => {
  it("orders the simulation before its science explanation", () => {
    const stage = doc.querySelector('[data-testid="scene"]');
    const simulation = stage?.querySelector('[data-testid="simulation-pane"]');
    const explanation = stage?.querySelector('[data-testid="explanation-pane"]');
    const orderedPanes = [
      ...(stage?.querySelectorAll(
        '[data-testid="simulation-pane"], [data-testid="explanation-pane"]',
      ) ?? []),
    ];

    expect(simulation).toBeTruthy();
    expect(explanation).toBeTruthy();
    expect(orderedPanes).toEqual([simulation, explanation]);
  });

  it("keeps the interaction with the SVG and the full model in the reading pane", () => {
    const simulation = doc.querySelector('[data-testid="simulation-pane"]');
    const explanation = doc.querySelector('[data-testid="explanation-pane"]');

    expect(simulation?.querySelector('svg[data-testid="optical-bench"]')).toBeTruthy();
    expect(simulation?.querySelectorAll('input[type="range"]').length).toBe(1);
    expect(explanation?.querySelector("#explanation")?.textContent?.trim()).not.toBe("");
    expect(explanation?.querySelector('[data-testid="arrival-spectrum"]')).toBeTruthy();
    expect(explanation?.querySelectorAll('[data-testid="model-equation"]').length).toBe(3);
    expect(explanation?.querySelector("details")).toBeFalsy();
  });

  it("keeps the privacy coda outside both normal reading panes", () => {
    const stage = doc.querySelector('[data-testid="scene"]');
    const simulation = doc.querySelector('[data-testid="simulation-pane"]');
    const explanation = doc.querySelector('[data-testid="explanation-pane"]');
    const coda = doc.querySelector('[data-testid="footprint-coda"]');

    expect(stage?.contains(coda ?? null)).toBe(true);
    expect(simulation?.contains(coda ?? null)).toBe(false);
    expect(explanation?.contains(coda ?? null)).toBe(false);
    expect(coda?.hasAttribute("hidden")).toBe(true);
  });
});
