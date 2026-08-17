import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

describe("the science model explains the causal chain", () => {
  const document = new JSDOM(readFileSync(resolve("dist/index.html"), "utf8")).window.document;
  const model = document.querySelector('[data-testid="airmass-model"]');

  it("shows three complete equations instead of placeholder shorthand", () => {
    const equations = [...(model?.querySelectorAll('[data-testid="model-equation"]') ?? [])]
      .map((node) => (node.textContent ?? "").replace(/\s+/g, " ").trim());

    expect(equations).toHaveLength(3);
    expect(equations[0]).toContain("0.50572");
    expect(equations[0]).toContain("6.07995");
    expect(equations[1]).toMatch(/λ[⁻−-]?4|λ\s*4/i);
    expect(equations[2]).toContain("τ");
    expect(equations.join(" ").toLowerCase()).not.toContain("correction");
  });

  it("defines the symbols and connects each equation to the visible result", () => {
    const text = (model?.textContent ?? "").replace(/\s+/g, " ").trim().toLowerCase();

    expect(text).toContain("apparent elevation");
    expect(text).toContain("wavelength");
    expect(text).toContain("relative air mass");
    expect(text).toContain("direct beam");
    expect(text).toContain("dimmer and warmer");
  });
});
