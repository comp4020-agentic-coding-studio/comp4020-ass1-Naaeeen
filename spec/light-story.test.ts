import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import {
  deriveScene,
  SCATTER_MARKS,
  MAX_ELEVATION,
  MIN_ELEVATION,
} from "../src/scripts/main";

// Two separate contracts, kept apart on purpose:
//
//   1. The pure derivation — the scattering story as numbers, checked as
//      relationships (low vs high elevation) rather than snapshots, so the
//      art direction can change without rewriting the science.
//   2. The built-DOM inventory — that the parts which tell that story
//      actually ship.
//
// Neither proves the result is beautiful, correctly positioned, animated, or
// legible. Rendered geometry and perceived strength are verified in a real
// production browser; this file makes no claim about them.

const SAMPLES = [0, 10, 45, 80, 90];

describe("light story: pure derivation from elevation", () => {
  const low = deriveScene(10);
  const high = deriveScene(80);

  it("crosses a markedly longer atmospheric path near the horizon", () => {
    expect(
      low.pathLength / high.pathLength,
      `expected the 10° path (${low.pathLength}) to be >= 1.5x the 80° path (${high.pathLength})`,
    ).toBeGreaterThanOrEqual(1.5);
  });

  it("scatters more short-wavelength light near the horizon", () => {
    expect(low.scatterStrength).toBeGreaterThan(high.scatterStrength);
  });

  it("delivers less direct light to the observer near the horizon", () => {
    expect(low.transmitStrength).toBeLessThan(high.transmitStrength);
  });

  it("delivers warmer direct light near the horizon", () => {
    expect(low.transmitWarmth).toBeGreaterThan(high.transmitWarmth);
  });

  it("keeps every derived value finite and inside its documented range", () => {
    for (const elevationDeg of SAMPLES) {
      const s = deriveScene(elevationDeg);
      const unit = {
        scatterStrength: s.scatterStrength,
        scatterSpread: s.scatterSpread,
        transmitStrength: s.transmitStrength,
        transmitWarmth: s.transmitWarmth,
        pathFraction: s.pathFraction,
      };
      for (const [name, value] of Object.entries(unit)) {
        expect(Number.isFinite(value), `${name} at ${elevationDeg}° must be finite`).toBe(true);
        expect(value, `${name} at ${elevationDeg}° must be >= 0`).toBeGreaterThanOrEqual(0);
        expect(value, `${name} at ${elevationDeg}° must be <= 1`).toBeLessThanOrEqual(1);
      }

      expect(Number.isFinite(s.beamAngleDeg)).toBe(true);
      expect(s.beamAngleDeg, `beam angle at ${elevationDeg}°`).toBeGreaterThan(0);
      expect(s.beamAngleDeg, `beam angle at ${elevationDeg}°`).toBeLessThan(90);
      expect(Number.isFinite(s.beamLength)).toBe(true);
      expect(s.beamLength).toBeGreaterThan(0);
      expect(Number.isFinite(s.pathLength)).toBe(true);
      expect(s.pathLength).toBeGreaterThan(0);
      expect(
        s.pathLength,
        `the lit path can never be longer than the whole route at ${elevationDeg}°`,
      ).toBeLessThanOrEqual(s.beamLength);
    }
  });

  it("takes elevation as its only input, and clamps it", () => {
    expect(deriveScene.length, "deriveScene must accept exactly one argument").toBe(1);

    // Same input, same output — no hidden state, no randomness.
    expect(deriveScene(37)).toEqual(deriveScene(37));

    expect(deriveScene(-40).elevationDeg).toBe(MIN_ELEVATION);
    expect(deriveScene(400).elevationDeg).toBe(MAX_ELEVATION);
  });

  it("moves the path monotonically: lower Sun never means a shorter path", () => {
    let previous = Infinity;
    for (const elevationDeg of [0, 10, 20, 30, 45, 60, 75, 90]) {
      const { pathLength } = deriveScene(elevationDeg);
      expect(
        pathLength,
        `path at ${elevationDeg}° should not exceed the path at the elevation below it`,
      ).toBeLessThanOrEqual(previous);
      previous = pathLength;
    }
  });
});

describe("light story: the built page ships the parts that tell it", () => {
  const doc = new JSDOM(readFileSync(resolve("dist/index.html"), "utf8")).window.document;
  const atmosphere = doc.querySelector('[data-testid="atmosphere"]');

  it("has an atmosphere field to draw into", () => {
    expect(atmosphere).toBeTruthy();
  });

  for (const hook of [
    "direct-beam",
    "atmospheric-path",
    "transmitted-beam",
    "scattering-layer",
  ]) {
    it(`contains exactly one [data-testid="${hook}"]`, () => {
      expect(atmosphere?.querySelectorAll(`[data-testid="${hook}"]`).length).toBe(1);
    });
  }

  it("draws a deterministic set of scattering marks", () => {
    const marks = [...(atmosphere?.querySelectorAll('[data-testid="scatter-mark"]') ?? [])];
    expect(
      marks.length,
      "expected at least three scattering marks in the shipped markup",
    ).toBeGreaterThanOrEqual(3);

    // The shipped markup and the derivation are two places the same numbers
    // could drift apart, so pin them together: every mark must carry exactly
    // the values SCATTER_MARKS declares, in order. This is what makes the
    // field deterministic rather than merely present.
    expect(marks.length, "mark count must match the derivation").toBe(SCATTER_MARKS.length);

    marks.forEach((mark, i) => {
      const style = mark.getAttribute("style") ?? "";
      const expected = SCATTER_MARKS[i];
      expect(style, `mark ${i} must declare its along position`).toContain(
        `--along:${expected.along}`,
      );
      expect(style, `mark ${i} must declare its side`).toContain(`--side:${expected.side}`);
      expect(style, `mark ${i} must declare its reach`).toContain(
        `--reach:${expected.reach.toFixed(3)}`,
      );
    });
  });

  it("builds those marks without randomness, so every build ships the same field", () => {
    const sides = new Set(SCATTER_MARKS.map((m) => m.side));
    expect(sides, "light must be turned aside to both sides of the route").toEqual(
      new Set([-1, 1]),
    );

    for (const [i, mark] of SCATTER_MARKS.entries()) {
      expect(mark.along, `mark ${i} along`).toBeGreaterThan(0);
      expect(mark.along, `mark ${i} along`).toBeLessThanOrEqual(1);
      expect(mark.reach, `mark ${i} reach`).toBeGreaterThan(0);
      expect(mark.reach, `mark ${i} reach`).toBeLessThanOrEqual(1);
      expect(Number.isFinite(mark.tilt), `mark ${i} tilt`).toBe(true);
    }
  });

  it("keeps every scattering mark inside the scattering layer", () => {
    const layer = atmosphere?.querySelector('[data-testid="scattering-layer"]');
    const all = atmosphere?.querySelectorAll('[data-testid="scatter-mark"]').length ?? 0;
    const inside = layer?.querySelectorAll('[data-testid="scatter-mark"]').length ?? 0;
    expect(all, "no marks to contain").toBeGreaterThanOrEqual(3);
    expect(inside, "every mark must live inside the scattering layer").toBe(all);
  });

  // Counted rather than asserted on the node itself: a failing DOM-node
  // assertion makes the reporter serialize the element, which trips a jsdom
  // opaque-origin error and hides the real reason.
  it("has dropped the old vertical path gauge", () => {
    expect(doc.querySelectorAll(".path-gauge").length, "old gauge still present").toBe(0);
    expect(doc.querySelectorAll(".path-gauge-fill").length, "old gauge fill still present").toBe(0);
  });
});
