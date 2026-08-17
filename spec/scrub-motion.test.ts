import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve("src/styles/global.css"), "utf8");
const script = readFileSync(resolve("src/scripts/main.ts"), "utf8");

describe("sun elevation scrubbing", () => {
  it("marks active pointer scrubbing and removes easing while the control is moving", () => {
    expect(script).toContain('scene.classList.add("is-scrubbing")');
    expect(script).toContain('scene.classList.remove("is-scrubbing")');
    expect(script).toMatch(/pointerdown/);
    expect(script).toMatch(/pointerup/);
    expect(css).toMatch(/\.stage\.is-scrubbing[\s\S]{0,900}transition:\s*none/);
  });

  it("never restarts state-bearing light geometry from an invented baseline", () => {
    expect(css).not.toContain("scale: 1 0.06");
    expect(css).not.toContain("translate: calc((1 - var(--along))");
  });
});
