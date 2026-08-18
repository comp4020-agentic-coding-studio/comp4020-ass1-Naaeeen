import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const doc = new JSDOM(readFileSync(resolve("dist/index.html"), "utf8")).window
  .document;

function text(el: Element | null): string {
  return (el?.textContent ?? "").replace(/\s+/g, " ").trim();
}

describe("responsive domains: the reading path is split from the art", () => {
  it("ships a dedicated hero-copy region", () => {
    const heroes = doc.querySelectorAll('[data-testid="hero-copy"]');
    expect(heroes.length, "expected one hero-copy layout region").toBe(1);

    const hero = heroes[0];
    expect(hero.querySelectorAll("nav").length).toBe(1);
    expect(hero.querySelectorAll("h1").length).toBe(1);
    expect(text(hero.querySelector('[data-testid="instruction"]'))).toBe(
      "Move the Sun toward the horizon.",
    );
  });

  it("ships a dedicated simulation-pane with one optical-bench SVG", () => {
    const panes = doc.querySelectorAll('[data-testid="simulation-pane"]');
    expect(panes.length, "expected one simulation-pane layout region").toBe(1);
    expect(
      panes[0].querySelectorAll('svg[data-testid="optical-bench"]').length,
      "the simulation pane should contain one scalable SVG optical bench",
    ).toBe(1);
  });

  it("ships a separate science-panel region for the equations/model", () => {
    const panels = doc.querySelectorAll('[data-testid="science-panel"]');
    expect(panels.length, "expected one science-panel layout region").toBe(1);
    expect(
      panels[0].querySelectorAll('[data-testid="airmass-model"]').length,
      "the science panel should contain the model strip",
    ).toBe(1);
    expect(
      panels[0].querySelectorAll('[data-testid="model-equation"]').length,
      "the science panel should show all three equations without disclosure",
    ).toBe(3);
  });

  it("ships a separate control-deck region for the instrument readout", () => {
    const decks = doc.querySelectorAll('[data-testid="control-deck"]');
    expect(decks.length, "expected one control-deck layout region").toBe(1);

    const deck = decks[0];
    expect(deck.querySelectorAll('[data-testid="rail"]').length).toBe(1);
    expect(deck.querySelectorAll('[data-testid="arrival-spectrum"]').length).toBe(1);
    expect(deck.querySelectorAll('#explanation').length).toBe(1);
    expect(
      deck.querySelectorAll('[data-testid="model-note"]').length,
      "the control deck keeps the note with the readout, not floating elsewhere",
    ).toBe(1);
  });
});
