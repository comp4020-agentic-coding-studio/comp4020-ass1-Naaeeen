import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const document = new JSDOM(readFileSync(resolve("dist/index.html"), "utf8")).window.document;

function text(element: Element | null): string {
  return (element?.textContent ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

describe("short-screen interactive lesson", () => {
  it("gives the control and live observation stable, separate regions", () => {
    const simulation = document.querySelector('[data-testid="simulation-pane"]');
    const explanation = document.querySelector('[data-testid="explanation-pane"]');

    expect(simulation?.querySelector('[data-testid="instrument-control"]')).toBeTruthy();
    expect(explanation?.querySelector('[data-testid="live-observation"]')).toBeTruthy();
  });

  it("leads with plain-language observations before the equations", () => {
    const guide = document.querySelector('[data-testid="plain-language-guide"]');
    const guideText = text(guide);
    const modelSteps = [...document.querySelectorAll('[data-testid="airmass-model"] > li')];

    expect(guide).toBeTruthy();
    expect(guide?.querySelectorAll("li").length).toBeGreaterThanOrEqual(5);
    expect(guideText).toContain("longer trip through air");
    expect(guideText).toContain("scattered sideways");
    expect(guideText).toContain("not destroyed");
    expect(guideText).toContain("looks warmer");
    expect(guideText).toContain("dust");
    expect(guideText).toContain("same event seen two ways");

    expect(modelSteps.length).toBe(3);
    for (const step of modelSteps) {
      const plain = step.querySelector(".model-plain");
      const equation = step.querySelector('[data-testid="model-equation"]');
      expect(text(plain)).not.toBe("");
      expect(equation).toBeTruthy();
      expect(
        Boolean(plain && equation && (plain.compareDocumentPosition(equation) & 4)),
        "plain-language explanation should come before its equation",
      ).toBe(true);
    }
  });

  it("uses one visible invitation for the hidden observer control", () => {
    const button = document.querySelector<HTMLButtonElement>('[data-testid="trace-aperture"]');
    const tips = document.querySelectorAll('[data-testid="observer-tip"]');
    const benchText = text(document.querySelector('[data-testid="optical-bench"]'));

    expect(button?.getAttribute("aria-label")).toContain("session trace");
    expect(button?.getAttribute("aria-describedby")).toBe("observer-tip");
    expect(tips.length).toBe(1);
    expect(text(tips[0])).toContain("press");
    expect(text(tips[0])).toContain("observer");
    expect(benchText).not.toContain("observe the observer");
  });

  it("names the received-colour swatch inside the illustration", () => {
    const label = document.querySelector('[data-testid="received-colour-label"]');
    const received = document.querySelector('[data-testid="received-colour"]');

    expect(label).toBeTruthy();
    expect(text(label)).toContain("light reaching you");
    expect(text(received)).toContain("resulting direct light");
  });
});
