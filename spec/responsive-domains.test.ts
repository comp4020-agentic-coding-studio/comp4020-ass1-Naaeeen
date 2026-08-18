import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const doc = new JSDOM(readFileSync(resolve("dist/index.html"), "utf8")).window.document;

function text(element: Element | null): string {
  return (element?.textContent ?? "").replace(/\s+/g, " ").trim();
}

describe("responsive domains: one state, two stable panes", () => {
  it("ships exactly one simulation and one explanation pane", () => {
    expect(doc.querySelectorAll('[data-testid="simulation-pane"]').length).toBe(1);
    expect(doc.querySelectorAll('[data-testid="explanation-pane"]').length).toBe(1);
  });

  it("keeps the brief's one plainly stated interaction in the simulation", () => {
    const simulation = doc.querySelector('[data-testid="simulation-pane"]');

    expect(simulation?.querySelectorAll("nav").length).toBe(1);
    expect(simulation?.querySelectorAll("h1").length).toBe(1);
    expect(text(simulation?.querySelector('[data-testid="instruction"]') ?? null)).toBe(
      "Move the Sun toward the horizon.",
    );
    expect(simulation?.querySelectorAll('input[type="range"]').length).toBe(1);
  });

  it("keeps the complete causal chain directly readable", () => {
    const explanation = doc.querySelector('[data-testid="explanation-pane"]');
    const model = explanation?.querySelector('[data-testid="airmass-model"]');

    expect(explanation?.querySelector('[data-testid="science-panel"]')).toBeTruthy();
    expect(model?.querySelectorAll('[data-testid="model-equation"]').length).toBe(3);
    expect(explanation?.querySelector("details")).toBeFalsy();
    expect(text(model ?? null).toLowerCase()).toContain("air mass");
    expect(text(model ?? null).toLowerCase()).toContain("fourth power");
    expect(text(model ?? null).toLowerCase()).toContain("survives");
  });
});
