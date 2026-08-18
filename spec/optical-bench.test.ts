import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const document = new JSDOM(
  readFileSync(resolve("dist/index.html"), "utf8"),
).window.document;

function hasHiddenAncestor(element: Element): boolean {
  let current: Element | null = element;
  while (current) {
    if (
      current.hasAttribute("hidden") ||
      current.getAttribute("aria-hidden") === "true"
    ) {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

describe("responsive optical-bench architecture", () => {
  it("separates the scalable simulation from the science reading pane", () => {
    const scene = document.querySelector('[data-testid="scene"]');
    const simulation = scene?.querySelector('[data-testid="simulation-pane"]');
    const explanation = scene?.querySelector('[data-testid="explanation-pane"]');

    expect(simulation, "expected one simulation pane").toBeTruthy();
    expect(explanation, "expected one explanation pane").toBeTruthy();
    expect(simulation?.contains(explanation ?? null)).toBe(false);
    expect(explanation?.contains(simulation ?? null)).toBe(false);
  });

  it("renders all physical geometry in one non-cropping SVG coordinate system", () => {
    const simulation = document.querySelector('[data-testid="simulation-pane"]');
    const benches = simulation?.querySelectorAll(
      'svg[data-testid="optical-bench"]',
    ) ?? [];

    expect(benches.length, "expected exactly one inline SVG optical bench").toBe(1);
    const bench = benches[0];
    expect(bench.getAttribute("viewBox")).toBe("0 0 1200 720");
    expect(bench.getAttribute("preserveAspectRatio")).toBe("xMidYMid meet");
    expect(bench.querySelector('[data-testid="direct-beam"]')).toBeTruthy();
    expect(bench.querySelector('[data-testid="scattering-layer"]')).toBeTruthy();
    expect(bench.querySelector("h1, input, output, details")).toBeFalsy();
  });

  it("keeps the one control with the simulation and all three equations visible", () => {
    const simulation = document.querySelector('[data-testid="simulation-pane"]');
    const explanation = document.querySelector('[data-testid="explanation-pane"]');
    const range = simulation?.querySelectorAll('input[type="range"]') ?? [];
    const equations = [
      ...(explanation?.querySelectorAll('[data-testid="model-equation"]') ?? []),
    ];

    expect(range.length, "the one physics control belongs to the simulation").toBe(1);
    expect(equations.length, "the causal chain needs exactly three equations").toBe(3);
    for (const equation of equations) {
      expect(equation.closest("details"), "equations must not require disclosure").toBeNull();
      expect(hasHiddenAncestor(equation), "equations must be available by default").toBe(false);
      expect((equation.textContent ?? "").trim()).not.toBe("");
    }
  });
});
