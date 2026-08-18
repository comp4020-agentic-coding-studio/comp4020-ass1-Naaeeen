import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const html = readFileSync(resolve("dist/index.html"), "utf8");
const css = readFileSync(resolve("src/styles/global.css"), "utf8");
const document = new JSDOM(html).window.document;

function isRemote(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

describe("slow-network and no-script resilience", () => {
  it("ships the complete first lesson in the initial HTML", () => {
    const range = document.querySelector('input[type="range"]');
    const scene = document.querySelector('[data-testid="optical-bench"]');
    const explanation = document.querySelector("#explanation");
    const equations = document.querySelectorAll('[data-testid="model-equation"]');

    expect(range).toBeTruthy();
    expect(scene).toBeTruthy();
    expect((explanation?.textContent ?? "").trim()).not.toBe("");
    expect(equations.length).toBe(3);
  });

  it("does not wait for third-party resources to render the lesson", () => {
    const resources = [
      ...[...document.querySelectorAll<HTMLScriptElement>("script[src]")]
        .map((node) => node.getAttribute("src") ?? ""),
      ...[...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href]')]
        .map((node) => node.getAttribute("href") ?? ""),
      ...[...document.querySelectorAll<HTMLImageElement>("img[src]")]
        .map((node) => node.getAttribute("src") ?? ""),
    ];

    expect(resources.length).toBeGreaterThan(0);
    for (const resource of resources) expect(isRemote(resource)).toBe(false);
    expect(css).not.toMatch(/@import\s+url\s*\(\s*["']?https?:\/\//i);
    expect(css).not.toMatch(/url\s*\(\s*["']?https?:\/\//i);
  });

  it("does not hide usable server-rendered content behind a blocking loader", () => {
    const bodyText = (document.body.textContent ?? "").replace(/\s+/g, " ").trim();

    expect(document.querySelector('[aria-busy="true"]')).toBeNull();
    expect(document.querySelector('[data-testid="loading-screen"]')).toBeNull();
    expect(bodyText).toContain("The Sun Never Turned Red");
    expect(bodyText).toContain("Sun elevation");
  });
});
