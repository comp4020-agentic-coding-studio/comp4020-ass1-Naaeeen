import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const doc = new JSDOM(readFileSync(resolve("dist/index.html"), "utf8")).window.document;

describe("responsive layout domains", () => {
  it("reserves the atmosphere for scene geometry only", () => {
    const atmosphere = doc.querySelector('[data-testid="atmosphere"]');

    expect(atmosphere).toBeTruthy();
    expect(atmosphere?.querySelector('[data-testid="direct-beam"]')).toBeTruthy();
    expect(atmosphere?.querySelector('[data-testid="trace-aperture"]')).toBeTruthy();
    expect(atmosphere?.querySelector("h1")).toBeFalsy();
    expect(atmosphere?.querySelector('[data-testid="horizon-reveal"]')).toBeFalsy();
    expect(atmosphere?.querySelector('[data-testid="airmass-model"]')).toBeFalsy();
    expect(atmosphere?.querySelector('[data-testid="arrival-spectrum"]')).toBeFalsy();
    expect(atmosphere?.querySelector('input[type="range"]')).toBeFalsy();
  });

  it("gives the HUD one stable narrative responsibility", () => {
    const hud = doc.querySelector('[data-testid="hero-copy"]');

    expect(hud).toBeTruthy();
    expect(hud?.querySelectorAll("nav").length).toBe(1);
    expect(hud?.querySelectorAll("h1").length).toBe(1);
    expect(hud?.querySelector('[data-testid="instruction"]')).toBeTruthy();
    expect(hud?.querySelector('[data-testid="horizon-reveal"]')).toBeTruthy();
    expect(hud?.querySelector('[data-testid="airmass-model"]')).toBeFalsy();
  });

  it("gives the rail one stable control and explanation responsibility", () => {
    const rail = doc.querySelector('[data-testid="rail"]');

    expect(rail).toBeTruthy();
    expect(rail?.querySelectorAll('input[type="range"]').length).toBe(1);
    expect(rail?.querySelector("#explanation")).toBeTruthy();
    expect(rail?.querySelector('[data-testid="arrival-spectrum"]')).toBeTruthy();
    expect(rail?.querySelector('[data-testid="airmass-model"]')).toBeTruthy();
    expect(rail?.querySelector('[data-testid="physics-disclosure"]')).toBeTruthy();
  });
});
