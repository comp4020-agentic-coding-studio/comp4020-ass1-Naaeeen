import { describe, expect, it } from "vitest";
import { deriveScene } from "../src/scripts/main";

// Regression test for a real-browser finding: the sky/Sun colour passed
// through a saturated green partway across the elevation range, because a
// single linear hue rotation (orange -> blue) necessarily crosses green on
// the HSL wheel. This asserts semantic channel relationships instead of
// exact colour snapshots, so it holds regardless of the colour-string
// format (rgb(...) or hsl(...)) `deriveScene` happens to return.

const SAMPLE_ELEVATIONS = [0, 10, 20, 30, 45, 60, 75, 90];

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hPrime = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hPrime % 2) - 1));
  let [r1, g1, b1] = [0, 0, 0];
  if (hPrime < 1) [r1, g1, b1] = [c, x, 0];
  else if (hPrime < 2) [r1, g1, b1] = [x, c, 0];
  else if (hPrime < 3) [r1, g1, b1] = [0, c, x];
  else if (hPrime < 4) [r1, g1, b1] = [0, x, c];
  else if (hPrime < 5) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  const m = l - c / 2;
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

function parseColor(color: string): Rgb {
  const rgbMatch = color.match(/rgb\(\s*(\d+),?\s*(\d+),?\s*(\d+)\s*\)/i);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return { r: Number(r), g: Number(g), b: Number(b) };
  }

  const hslMatch = color.match(
    /hsl\(\s*(-?\d+(?:\.\d+)?)deg\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%\s*\)/i,
  );
  if (hslMatch) {
    const [, h, s, l] = hslMatch;
    return hslToRgb(Number(h), Number(s) / 100, Number(l) / 100);
  }

  throw new Error(`expected an rgb(...) or hsl(...) colour, got "${color}"`);
}

function isGreenDominant(c: Rgb): boolean {
  return c.g > c.r && c.g > c.b;
}

describe("assignment 1: the sky and Sun never read as scattering-implausible green", () => {
  for (const elevationDeg of SAMPLE_ELEVATIONS) {
    it(`at ${elevationDeg}°, neither the sky nor the Sun is green-dominant`, () => {
      const scene = deriveScene(elevationDeg);
      const sky = parseColor(scene.skyColor);
      const sun = parseColor(scene.sunColor);

      expect(isGreenDominant(sky), `sky ${scene.skyColor} reads as green`).toBe(false);
      expect(isGreenDominant(sun), `Sun ${scene.sunColor} reads as green`).toBe(false);
    });
  }

  it("near the horizon, the direct Sun is warm: red strongest, then green, then blue", () => {
    for (const elevationDeg of [0, 10, 20]) {
      const { r, g, b } = parseColor(deriveScene(elevationDeg).sunColor);
      expect(r, `at ${elevationDeg}° expected red >= green`).toBeGreaterThanOrEqual(g);
      expect(g, `at ${elevationDeg}° expected green >= blue`).toBeGreaterThanOrEqual(b);
      expect(r, `at ${elevationDeg}° expected red > blue (a warm Sun)`).toBeGreaterThan(b);
    }
  });

  it("at high elevation, the direct Sun is warm-neutral or near-white, not blue", () => {
    for (const elevationDeg of [75, 90]) {
      const { r, b } = parseColor(deriveScene(elevationDeg).sunColor);
      expect(b, `at ${elevationDeg}° expected blue not to exceed red (no blue Sun)`).toBeLessThanOrEqual(r);
      expect(r - b, `at ${elevationDeg}° expected the Sun close to neutral`).toBeLessThan(60);
    }
  });

  it("at medium and high elevation, the sky is blue-family or neutral", () => {
    for (const elevationDeg of [45, 60, 75, 90]) {
      const { r, b } = parseColor(deriveScene(elevationDeg).skyColor);
      expect(b, `at ${elevationDeg}° expected the sky's blue channel to reach its red`).toBeGreaterThanOrEqual(r);
    }
  });

  it("at low elevation, the sky may warm, but never through a saturated green", () => {
    for (const elevationDeg of [0, 10]) {
      const { r, g, b } = parseColor(deriveScene(elevationDeg).skyColor);
      expect(g, `at ${elevationDeg}° expected green not to dominate the sky`).toBeLessThanOrEqual(Math.max(r, b));
    }
  });
});
