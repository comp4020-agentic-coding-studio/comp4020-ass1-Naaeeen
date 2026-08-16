import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import {
  deriveScene,
  pathAmount,
  receivedLightRgb,
  receivedLightColor,
} from "../src/scripts/main";

const SAMPLES = [0, 5, 10, 20, 45, 80, 90];

function kastenYoung(elevationDeg: number): number {
  const radians = (elevationDeg * Math.PI) / 180;
  return 1 / (Math.sin(radians) + 0.50572 * (elevationDeg + 6.07995) ** -1.6364);
}

describe("air mass: the slider drives a physical path approximation", () => {
  it("matches the Kasten-Young relative optical air-mass approximation", () => {
    for (const elevation of SAMPLES) {
      expect(pathAmount(elevation), `air mass at ${elevation}°`).toBeCloseTo(
        kastenYoung(elevation),
        8,
      );
    }
  });

  it("is finite at the horizon, near one overhead, and responds at every degree", () => {
    expect(Number.isFinite(pathAmount(0))).toBe(true);
    expect(pathAmount(90)).toBeCloseTo(1, 3);

    let previous = pathAmount(0);
    for (let elevation = 1; elevation <= 90; elevation += 1) {
      const next = pathAmount(elevation);
      expect(next, `air mass should fall from ${elevation - 1}° to ${elevation}°`).toBeLessThan(
        previous,
      );
      previous = next;
    }
  });
});

describe("received colour: the spectrum, not a second colour curve, paints the light", () => {
  it("stays deterministic and display-safe", () => {
    for (const elevation of SAMPLES) {
      const rgb = receivedLightRgb(elevation);
      expect(rgb).toEqual(receivedLightRgb(elevation));
      for (const value of Object.values(rgb)) {
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(255);
      }
      expect(receivedLightColor(elevation)).toBe(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
    }
  });

  it("is near-neutral high in the sky and unmistakably warmer near the horizon", () => {
    const high = receivedLightRgb(90);
    const low = receivedLightRgb(5);
    expect(Math.max(high.r, high.g, high.b) - Math.min(high.r, high.g, high.b)).toBeLessThan(28);
    expect(low.r).toBeGreaterThan(low.g);
    expect(low.g).toBeGreaterThan(low.b);
    expect(low.r - low.b).toBeGreaterThan(high.r - high.b + 70);
  });

  it("is the exact direct-light colour used by the rendered scene", () => {
    for (const elevation of SAMPLES) {
      expect(deriveScene(elevation).sunColor).toBe(receivedLightColor(elevation));
    }
  });
});

describe("the built page explains the model as cause, maths, and visible result", () => {
  const document = new JSDOM(readFileSync(resolve("dist/index.html"), "utf8")).window.document;

  it("ships one plain-language model strip with the three causal steps", () => {
    const model = document.querySelector('[data-testid="airmass-model"]');
    const text = (model?.textContent ?? "").replace(/\s+/g, " ").trim().toLowerCase();
    expect(model).toBeTruthy();
    expect(text).toContain("air mass");
    expect(text).toContain("fourth power");
    expect(text).toContain("survives");
  });

  it("shows the spectrum-derived colour as a named visual result", () => {
    const result = document.querySelector('[data-testid="received-colour"]');
    expect(result).toBeTruthy();
    expect((result?.textContent ?? "").trim().length).toBeGreaterThan(0);
    expect(result?.hasAttribute("hidden")).toBe(false);
  });
});
