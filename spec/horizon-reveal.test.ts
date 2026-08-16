import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { deriveScene, sceneStyle } from "../src/scripts/main";

describe("near-horizon payoff", () => {
  it("is derived only from the same elevation state at the eight-degree threshold", () => {
    expect(deriveScene(8).horizonReveal).toBe(true);
    expect(deriveScene(9).horizonReveal).toBe(false);
    expect(sceneStyle(deriveScene(8))).toContain("--horizon-reveal:1;");
    expect(sceneStyle(deriveScene(9))).toContain("--horizon-reveal:0;");
  });

  it("ships the conclusion in words inside the atmospheric stage", () => {
    const doc = new JSDOM(readFileSync(resolve("dist/index.html"), "utf8")).window.document;
    const reveal = doc.querySelector('[data-testid="horizon-reveal"]');
    const text = (reveal?.textContent ?? "").replace(/\s+/g, " ").trim().toLowerCase();
    expect(reveal).toBeTruthy();
    expect(text).toContain("sun never turned red");
    expect(text).toContain("atmosphere changed what reached you");
  });
});
