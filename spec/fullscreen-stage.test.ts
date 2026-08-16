import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

// Structural contract for the full-screen stage (PLAN.md's visual-direction
// contract). This inspects the built dist/index.html for user-visible
// structure and semantics only — which regions exist, how they nest, and
// what they're named. It deliberately does NOT read CSS, class names, or
// pixel values: whether the stage actually fills the viewport is a rendered
// -layout question that only a real browser can answer, and it's verified
// there, not faked here.

const doc = new JSDOM(readFileSync(resolve("dist/index.html"), "utf8")).window
  .document;

function accessibleName(el: Element): string {
  const label = el.getAttribute("aria-label")?.trim();
  if (label) return label;

  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    return labelledBy
      .split(/\s+/)
      .map((id) => doc.getElementById(id)?.textContent?.trim() ?? "")
      .join(" ")
      .trim();
  }

  return "";
}

function normalized(el: Element | null): string {
  return (el?.textContent ?? "").replace(/\s+/g, " ").trim();
}

describe("full-screen stage: structure and semantics", () => {
  it("nests a named atmosphere field inside a stage that stays interactive", () => {
    const stages = doc.querySelectorAll('[data-testid="scene"]');
    expect(stages.length, "expected exactly one stage").toBe(1);
    const stage = stages[0];

    const fields = stage.querySelectorAll('[data-testid="atmosphere"]');
    expect(
      fields.length,
      "expected exactly one atmosphere field inside the stage",
    ).toBe(1);
    const atmosphere = fields[0];

    // The stage holds the range control, so it must not be image-role —
    // that would bury an interactive control inside image semantics.
    expect(
      stage.getAttribute("role"),
      'the stage must not be role="img" — it contains the control',
    ).not.toBe("img");
    expect(
      accessibleName(stage),
      "the stage still needs an accessible label",
    ).not.toBe("");

    expect(
      atmosphere.getAttribute("role"),
      'the atmosphere field carries the visual semantics, so it needs role="img"',
    ).toBe("img");
    expect(
      accessibleName(atmosphere),
      "the atmosphere field needs a non-empty accessible name describing the illustration",
    ).not.toBe("");
  });

  it("gathers the control, its output, and the model note into one rail", () => {
    const stage = doc.querySelector('[data-testid="scene"]');
    const rails = stage?.querySelectorAll('[data-testid="rail"]') ?? [];
    expect(rails.length, "expected exactly one rail inside the stage").toBe(1);
    const rail = rails[0];

    expect(
      rail.querySelectorAll('input[type="range"]').length,
      "the rail must contain the single range control",
    ).toBe(1);

    const range = rail.querySelector('input[type="range"]');
    const rangeId = range?.getAttribute("id") ?? "";
    expect(
      rail.querySelector(`output[for~="${rangeId}"]`),
      "the rail must contain the output associated with the range",
    ).toBeTruthy();

    const note = rail.querySelector('[data-testid="model-note"]');
    expect(note, "the rail must carry the simplified-illustration note").toBeTruthy();
    expect(normalized(note), "the model note must not be empty").not.toBe("");
    expect(
      note?.hasAttribute("hidden"),
      "the model note must be visible",
    ).toBe(false);
  });

  it("opens with the contract's exact instruction", () => {
    const stage = doc.querySelector('[data-testid="scene"]');
    const instructions = stage?.querySelectorAll('[data-testid="instruction"]') ?? [];
    expect(instructions.length, "expected exactly one instruction").toBe(1);
    const instruction = instructions[0];

    expect(normalized(instruction)).toBe("Move the Sun toward the horizon.");
    expect(
      instruction.hasAttribute("hidden"),
      "the instruction must be visible",
    ).toBe(false);
  });
});
