import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const doc = new JSDOM(readFileSync(resolve("dist/index.html"), "utf8")).window.document;

describe("responsive layout domains", () => {
  it("reserves the SVG for physical geometry only", () => {
    const bench = doc.querySelector('svg[data-testid="optical-bench"]');

    expect(bench).toBeTruthy();
    expect(bench?.querySelector('[data-testid="direct-beam"]')).toBeTruthy();
    expect(bench?.querySelector('[data-testid="atmospheric-path"]')).toBeTruthy();
    expect(bench?.querySelector('[data-testid="scattering-layer"]')).toBeTruthy();
    expect(bench?.querySelector("h1, input, output, details, button")).toBeFalsy();
  });

  it("gives the simulation pane the thesis, scene, one control, and aperture gateway", () => {
    const simulation = doc.querySelector('[data-testid="simulation-pane"]');

    expect(simulation?.querySelectorAll("h1").length).toBe(1);
    expect(simulation?.querySelector('[data-testid="instruction"]')).toBeTruthy();
    expect(simulation?.querySelector('svg[data-testid="optical-bench"]')).toBeTruthy();
    expect(simulation?.querySelectorAll('input[type="range"]').length).toBe(1);
    expect(simulation?.querySelector('button[data-testid="trace-aperture"]')).toBeTruthy();
    expect(simulation?.querySelector('[data-testid="airmass-model"]')).toBeFalsy();
  });

  it("gives the explanation pane one stable scientific reading responsibility", () => {
    const explanation = doc.querySelector('[data-testid="explanation-pane"]');

    expect(explanation?.querySelector("#explanation")).toBeTruthy();
    expect(explanation?.querySelector('[data-testid="arrival-spectrum"]')).toBeTruthy();
    expect(explanation?.querySelector('[data-testid="airmass-model"]')).toBeTruthy();
    expect(explanation?.querySelector('[data-testid="model-note"]')).toBeTruthy();
    expect(explanation?.querySelectorAll('[data-testid="model-equation"]').length).toBe(3);
    expect(explanation?.querySelector("h1, input, details")).toBeFalsy();
  });
});
