import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

// This tests the built DOM shell only (dist/index.html as shipped). Astro
// emits the client script as `<script type="module">`, and jsdom's
// module-script execution remains an unreliable, open limitation
// (https://github.com/jsdom/jsdom/issues/2475) — so this file never runs
// scripts and makes no claim about runtime state change. Whether dragging,
// touching, or keying the control actually moves the scene/spectrum/
// explanation is verified in a real production browser at the next green
// slice, not simulated here.

function accessibleName(el: Element, doc: Document): string {
  const ariaLabel = el.getAttribute("aria-label")?.trim();
  if (ariaLabel) return ariaLabel;

  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    const text = labelledBy
      .split(/\s+/)
      .map((id) => doc.getElementById(id)?.textContent?.trim() ?? "")
      .join(" ")
      .trim();
    if (text) return text;
  }

  const id = el.getAttribute("id");
  if (id) {
    const text = doc.querySelector(`label[for="${id}"]`)?.textContent?.trim();
    if (text) return text;
  }

  const wrappingLabel = el.closest("label")?.textContent?.trim();
  if (wrappingLabel) return wrappingLabel;

  return "";
}

function associatedOutput(control: Element, doc: Document): Element | null {
  const id = control.getAttribute("id");
  if (id) {
    const output = doc.querySelector(`output[for~="${id}"]`);
    if (output) return output;
  }

  for (const describedId of control.getAttribute("aria-describedby")?.split(/\s+/) ?? []) {
    const el = doc.getElementById(describedId);
    if (el) return el;
  }

  return null;
}

describe("assignment 1: sun-elevation shell contract", () => {
  it("exposes one labelled elevation control, a named scene, and its associated explanation — and drops the starter", () => {
    const doc = new JSDOM(readFileSync(resolve("dist/index.html"), "utf8")).window.document;

    const ranges = doc.querySelectorAll('input[type="range"]');
    expect(
      ranges.length,
      "expected exactly one input[type=range] as the Sun-elevation control",
    ).toBe(1);
    const control = ranges[0];

    expect(
      accessibleName(control, doc),
      "the elevation control needs an accessible name — a <label for>, aria-label, or aria-labelledby",
    ).not.toBe("");

    const scene = doc.querySelector('[data-testid="scene"]');
    expect(
      scene,
      'expected one [data-testid="scene"] region for the Sun/atmosphere visual',
    ).toBeTruthy();
    expect(
      scene?.getAttribute("aria-label")?.trim(),
      "the scene region needs a non-empty aria-label so it's meaningful without sight",
    ).toBeTruthy();

    const output = associatedOutput(control, doc);
    expect(
      output,
      "expected an <output for=...> or aria-describedby-linked region explaining the current state",
    ).toBeTruthy();
    expect(
      output?.textContent?.trim(),
      "the explanation/output region must not be empty",
    ).not.toBe("");
    expect(
      output?.hasAttribute("hidden"),
      "the explanation/output region must be visible",
    ).toBe(false);

    expect(
      doc.querySelector('[data-testid="intro"]'),
      'the starter\'s [data-testid="intro"] placeholder should be gone, replaced by the real explainer',
    ).toBeFalsy();
  });
});
