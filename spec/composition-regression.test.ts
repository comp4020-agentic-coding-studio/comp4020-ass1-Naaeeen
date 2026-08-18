import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const doc = new JSDOM(readFileSync(resolve("dist/index.html"), "utf8")).window.document;

function normalizedText(element: Element | null): string {
  return (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

describe('adaptive composition regression', () => {
  it('keeps the thesis inside the simulation pane and out of the explanation pane', () => {
    const simulation = doc.querySelector('[data-testid="simulation-pane"]');
    const explanation = doc.querySelector('[data-testid="explanation-pane"]');
    const title = normalizedText(simulation?.querySelector('h1') ?? null).toLowerCase();

    expect(title).toContain('sun never turned red');
    expect(explanation?.querySelector('h1')).toBeFalsy();
  });

  it('keeps science readouts and all three equations in the explanation pane with no disclosure shell', () => {
    const explanation = doc.querySelector('[data-testid="explanation-pane"]');
    const model = doc.querySelector('[data-testid="airmass-model"]');
    const arrival = doc.querySelector('[data-testid="arrival-spectrum"]');

    expect(explanation?.contains(model ?? null)).toBe(true);
    expect(explanation?.contains(arrival ?? null)).toBe(true);
    expect(explanation?.querySelector('details')).toBeFalsy();
    expect(model?.querySelectorAll('[data-testid="model-equation"]').length).toBe(3);
  });

  it('ships unique IDs so one responsive DOM owns one state', () => {
    const ids = [...doc.querySelectorAll('[id]')].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(doc.querySelectorAll('input[type="range"]').length).toBe(1);
    expect(doc.querySelectorAll('h1').length).toBe(1);
  });
});
