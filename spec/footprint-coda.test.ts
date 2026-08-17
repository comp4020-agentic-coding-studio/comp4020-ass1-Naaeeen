import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const built = readFileSync(resolve("dist/index.html"), "utf8");
const doc = new JSDOM(built).window.document;

describe("assignment 1: the observer opens a local-only footprint coda", () => {
  it("uses the aperture as one named, keyboard-operable gateway", () => {
    const gate = doc.querySelector('[data-testid="trace-aperture"]');
    expect(gate?.tagName).toBe("BUTTON");
    expect(gate?.getAttribute("type")).toBe("button");
    expect((gate?.getAttribute("aria-label") ?? "").trim()).not.toBe("");
    expect(gate?.getAttribute("aria-controls")).toBe("footprint-coda");
  });

  it("ships one initially hidden coda with four ordered signal cards", () => {
    const coda = doc.querySelector('[data-testid="footprint-coda"]');
    expect(coda).toBeTruthy();
    expect(coda?.hasAttribute("hidden")).toBe(true);
    expect(coda?.querySelectorAll('[data-testid="trace-card"]').length).toBe(4);
    expect(coda?.querySelector("[data-trace-next]")).toBeTruthy();
    expect(coda?.querySelector("[data-trace-previous]")).toBeTruthy();
    expect(coda?.querySelector("[data-trace-erase]")).toBeTruthy();
  });

  it("names the permission-free environment and behaviour signals it reveals", () => {
    const coda = doc.querySelector('[data-testid="footprint-coda"]');
    for (const signal of [
      "elapsed", "moves", "range", "modes", "pointer-moves", "clicks", "keys",
      "viewport", "pixels",
      "language", "languages", "timezone", "colour-depth", "touch",
      "cores", "memory", "connection", "privacy", "display",
      "resizes", "visibility"
    ]) {
      const value = coda?.querySelector(`[data-trace="${signal}"]`);
      expect(value, `missing visible signal: ${signal}`).toBeTruthy();
      expect((value?.textContent ?? "").trim(), `empty fallback: ${signal}`).not.toBe("");
    }
  });

  it("states the privacy boundary in plain language", () => {
    const text = (doc.querySelector('[data-testid="footprint-coda"]')?.textContent ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    expect(text).toContain("this session");
    expect(text).toMatch(/nothing (?:is|was) saved|saved records\s*0/);
    expect(text).toMatch(/nothing (?:is|was) sent|trace uploads\s*0/);
    expect(text).toMatch(/permission prompts\s*0/);
    expect(text).toContain("erase");
  });

  it("lists multiple browser and device hints inside the environment card", () => {
    const text = (doc.querySelector('[data-trace-card="2"]')?.textContent ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    for (const phrase of [
      "language stack",
      "colour depth",
      "touch points",
      "cpu hint",
      "memory hint",
      "connection hint",
      "privacy signals",
    ]) {
      expect(text).toContain(phrase);
    }
  });

  it("ships a deterministic portal field, not a random runtime particle generator", () => {
    const particles = doc.querySelectorAll('[data-testid="portal-particle"]');
    expect(particles.length).toBeGreaterThanOrEqual(16);
    for (const particle of particles) {
      expect(particle.getAttribute("aria-hidden")).toBe("true");
      expect((particle.getAttribute("style") ?? "").trim()).not.toBe("");
    }
  });

  it("does not introduce sensitive permissions, persistence, analytics, or uploads", () => {
    const source = ["src/scripts/main.ts", "src/scripts/footprint.ts"]
      .map((file) => readFileSync(resolve(file), "utf8"))
      .join("\n");
    for (const forbidden of [
      "getUserMedia",
      "navigator.geolocation",
      "Notification.requestPermission",
      "localStorage",
      "sessionStorage",
      "document.cookie",
      "indexedDB",
      "XMLHttpRequest",
    ]) {
      expect(source, "forbidden API: " + forbidden).not.toContain(forbidden);
    }
    expect(source).not.toMatch(/\bfetch\s*\(/);
  });
});
