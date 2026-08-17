import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve("src/styles/global.css"), "utf8");

describe("responsive layout: viewport-specific composition", () => {
  it("caps the bottom rail instead of letting it scale endlessly with desktop width", () => {
    expect(css).toMatch(/\.rail\s*\{[\s\S]*width:\s*min\(100%, 80rem\);[\s\S]*margin-inline:\s*auto;/);
  });

  it("ships a dedicated phone breakpoint for the science strip and received-colour witness", () => {
    expect(css).toMatch(/@media \(width < 44rem\) \{[\s\S]*\.model-strip\s*\{[\s\S]*left:\s*0\.75rem;[\s\S]*width:\s*auto;[\s\S]*\}[\s\S]*\.received-colour\s*\{[\s\S]*max-width:\s*7rem;/);
  });

  it("ships a middle breakpoint so tablet widths do not reuse phone or wide-desktop positions", () => {
    expect(css).toMatch(/@media \(width >= 44rem\) and \(width < 78rem\) \{[\s\S]*\.received-colour\s*\{[\s\S]*max-width:\s*9\.75rem;[\s\S]*\}[\s\S]*\.model-strip\s*\{[\s\S]*width:\s*min\(17rem, 33vw\);/);
  });

  it("keeps a separate wide-screen rule for the expanded science strip", () => {
    expect(css).toMatch(/@media \(width >= 90rem\) \{[\s\S]*\.model-strip\s*\{[\s\S]*width:\s*min\(56rem, 46vw\);/);
  });
});