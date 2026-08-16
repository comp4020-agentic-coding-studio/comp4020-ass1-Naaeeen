import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import {
  SPECTRUM_BANDS,
  bandTransmissions,
  deriveScene,
  pathAmount,
  spectralTransmission,
} from "../src/scripts/main";

// Wavelength-selective transmission, checked as relationships rather than
// snapshots: shorter wavelengths must lose more of the direct beam, and the
// gap between the ends must widen as the route lengthens. The exact numbers
// are an illustrative model and are free to be retuned — these orderings are
// not.
//
// Nothing here claims the rendered spectrum looks right, is positioned well,
// or animates correctly. That is browser work, verified there.

const SAMPLES = [0, 10, 25, 45, 60, 80, 90];

describe("spectral transmission: the model", () => {
  it("is deterministic — same elevation, same answer", () => {
    expect(spectralTransmission(37)).toEqual(spectralTransmission(37));
    expect(bandTransmissions(37)).toEqual(bandTransmissions(37));
  });

  it("stays finite and bounded to 0-1 at every sampled elevation", () => {
    for (const elevationDeg of SAMPLES) {
      const t = spectralTransmission(elevationDeg);
      for (const [channel, value] of Object.entries(t)) {
        expect(Number.isFinite(value), `${channel} at ${elevationDeg}° must be finite`).toBe(true);
        expect(value, `${channel} at ${elevationDeg}°`).toBeGreaterThan(0);
        expect(value, `${channel} at ${elevationDeg}°`).toBeLessThanOrEqual(1);
      }

      for (const [i, value] of bandTransmissions(elevationDeg).entries()) {
        expect(
          Number.isFinite(value),
          `band ${SPECTRUM_BANDS[i].label} at ${elevationDeg}° must be finite`,
        ).toBe(true);
        expect(value, `band ${SPECTRUM_BANDS[i].label} at ${elevationDeg}°`).toBeGreaterThan(0);
        expect(value, `band ${SPECTRUM_BANDS[i].label} at ${elevationDeg}°`).toBeLessThanOrEqual(1);
      }
    }
  });

  it("always lets red through most, then green, then blue", () => {
    for (const elevationDeg of SAMPLES) {
      const { red, green, blue } = spectralTransmission(elevationDeg);
      expect(red, `at ${elevationDeg}° red should reach green`).toBeGreaterThanOrEqual(green);
      expect(green, `at ${elevationDeg}° green should reach blue`).toBeGreaterThanOrEqual(blue);
    }
  });

  it("transmits less in every channel when the Sun is low", () => {
    const low = spectralTransmission(10);
    const high = spectralTransmission(80);
    for (const channel of ["red", "green", "blue"] as const) {
      expect(
        low[channel],
        `${channel} should transmit less at 10° (${low[channel]}) than at 80° (${high[channel]})`,
      ).toBeLessThan(high[channel]);
    }
  });

  it("separates red from blue more strongly when the Sun is low", () => {
    const low = spectralTransmission(10);
    const high = spectralTransmission(80);
    expect(low.red - low.blue).toBeGreaterThan(high.red - high.blue);
  });

  it("orders its bands from short to long wavelength, with the short end scattering", () => {
    expect(SPECTRUM_BANDS.length).toBeGreaterThanOrEqual(4);

    for (const [i, band] of SPECTRUM_BANDS.entries()) {
      expect(band.label.trim(), `band ${i} needs a word, not just a colour`).not.toBe("");
      expect(band.relativeWavelength, `band ${i}`).toBeGreaterThan(0);
      if (i > 0) {
        expect(
          band.relativeWavelength,
          "bands must run short-wavelength first",
        ).toBeGreaterThan(SPECTRUM_BANDS[i - 1].relativeWavelength);
      }
    }

    // The short end is the end that gets turned aside; the long end survives.
    expect(SPECTRUM_BANDS[0].scatters, "the shortest band must scatter").toBe(true);
    expect(
      SPECTRUM_BANDS[SPECTRUM_BANDS.length - 1].scatters,
      "the longest band must survive",
    ).toBe(false);

    // Shorter wavelengths are hit harder, so band transmission rises across
    // the list at every elevation.
    for (const elevationDeg of SAMPLES) {
      const t = bandTransmissions(elevationDeg);
      for (let i = 1; i < t.length; i++) {
        expect(
          t[i],
          `at ${elevationDeg}°, ${SPECTRUM_BANDS[i].label} should transmit at least ${SPECTRUM_BANDS[i - 1].label}`,
        ).toBeGreaterThanOrEqual(t[i - 1]);
      }
    }
  });

  it("carries the same transmission into the scene it renders", () => {
    const scene = deriveScene(23);
    expect(scene.transmission).toEqual(spectralTransmission(23));
    expect(scene.pathAmount, "relative path amount must be finite").toBeGreaterThanOrEqual(1);
    expect(Number.isFinite(scene.pathAmount)).toBe(true);
  });

  // The three channels and the six bars are two views of one model. If the band
  // table is retuned and the channels are not, the bars and the sky would be
  // describing different atmospheres — so tie them together explicitly.
  it("derives its three channels from the band table, not from a second copy", () => {
    const indexOf = (label: string) => SPECTRUM_BANDS.findIndex((b) => b.label === label);
    for (const elevationDeg of SAMPLES) {
      const bands = bandTransmissions(elevationDeg);
      const channels = spectralTransmission(elevationDeg);
      expect(channels.red, `red at ${elevationDeg}°`).toBe(bands[indexOf("red")]);
      expect(channels.green, `green at ${elevationDeg}°`).toBe(bands[indexOf("green")]);
      expect(channels.blue, `blue at ${elevationDeg}°`).toBe(bands[indexOf("blue")]);
    }
  });

  // A clamped air path would freeze the whole instrument across the last few
  // degrees — the most interesting part of the range. It must keep moving.
  it("keeps responding all the way down to the horizon", () => {
    let previous = Infinity;
    for (let elevationDeg = 12; elevationDeg >= 0; elevationDeg -= 1) {
      const air = pathAmount(elevationDeg);
      expect(air, `air at ${elevationDeg}° must exceed the degree above it`).toBeGreaterThan(
        previous === Infinity ? 0 : previous,
      );
      previous = air;
    }

    // Same again for what the visitor actually sees.
    const red = (deg: number) => spectralTransmission(deg).red;
    for (let elevationDeg = 12; elevationDeg >= 1; elevationDeg -= 1) {
      expect(
        red(elevationDeg - 1),
        `red at ${elevationDeg - 1}° must differ from ${elevationDeg}°`,
      ).toBeLessThan(red(elevationDeg));
    }
  });
});

describe("spectral transmission: what the built page shows", () => {
  const doc = new JSDOM(readFileSync(resolve("dist/index.html"), "utf8")).window.document;

  it("ships exactly one arrival spectrum", () => {
    expect(doc.querySelectorAll('[data-testid="arrival-spectrum"]').length).toBe(1);
  });

  it("explains the spectrum in words, not only in colour", () => {
    const spectrum = doc.querySelector('[data-testid="arrival-spectrum"]');
    const text = (spectrum?.textContent ?? "").replace(/\s+/g, " ").trim().toLowerCase();

    expect(text, "the spectrum needs readable text").not.toBe("");
    expect(text, "name the short-wavelength end").toContain("blue");
    expect(text, "name the long-wavelength end").toContain("red");

    const bands = spectrum?.querySelectorAll('[data-testid="spectrum-band"]') ?? [];
    expect(bands.length, "expected one element per band").toBe(SPECTRUM_BANDS.length);
    for (const band of bands) {
      expect(
        (band.getAttribute("data-band") ?? "").trim(),
        "every band must name itself for assistive tech and for tests",
      ).not.toBe("");
    }
  });

  it("still has exactly one control driving one canonical state", () => {
    expect(doc.querySelectorAll('input[type="range"]').length).toBe(1);
    expect(
      doc.querySelectorAll('input:not([type="range"]), select, textarea').length,
      "no second input may compete with the elevation control",
    ).toBe(0);
    expect(doc.querySelectorAll('[data-testid="scene"]').length).toBe(1);
  });
});
