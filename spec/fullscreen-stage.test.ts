import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const doc = new JSDOM(readFileSync(resolve("dist/index.html"), "utf8")).window.document;

function accessibleName(el: Element): string {
  const label = el.getAttribute('aria-label')?.trim();
  if (label) return label;

  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    return labelledBy
      .split(/\s+/)
      .map((id) => doc.getElementById(id)?.textContent?.trim() ?? '')
      .join(' ')
      .trim();
  }

  return '';
}

function normalized(el: Element | null): string {
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

describe('full-screen stage: structure and semantics', () => {
  it('ships one scene with one simulation pane and one explanation pane', () => {
    const stages = doc.querySelectorAll('[data-testid="scene"]');
    expect(stages.length, 'expected exactly one stage').toBe(1);
    const stage = stages[0];

    expect(stage.querySelectorAll('[data-testid="simulation-pane"]').length).toBe(1);
    expect(stage.querySelectorAll('[data-testid="explanation-pane"]').length).toBe(1);
  });

  it('nests one named optical bench svg inside the simulation pane', () => {
    const bench = doc.querySelector('[data-testid="optical-bench"]');
    expect(bench).toBeTruthy();
    expect(bench?.tagName.toLowerCase()).toBe('svg');
    expect(bench?.getAttribute('role')).toBe('img');
    expect(accessibleName(bench!)).not.toBe('');
  });

  it('keeps the output, note, and equations visible in the explanation pane', () => {
    const pane = doc.querySelector('[data-testid="explanation-pane"]');
    const note = pane?.querySelector('[data-testid="model-note"]') ?? null;

    expect(pane?.querySelector('#explanation')).toBeTruthy();
    expect(pane?.querySelectorAll('[data-testid="model-equation"]').length).toBe(3);
    expect(note, 'the explanation pane must carry the simplified-illustration note').toBeTruthy();
    expect(normalized(note), 'the model note must not be empty').not.toBe('');
    expect(note?.hasAttribute('hidden'), 'the model note must be visible').toBe(false);
  });

  it('opens with the contract\'s exact instruction', () => {
    const stage = doc.querySelector('[data-testid="scene"]');
    const instructions = stage?.querySelectorAll('[data-testid="instruction"]') ?? [];
    expect(instructions.length, 'expected exactly one instruction').toBe(1);
    expect(normalized(instructions[0])).toBe('Move the Sun toward the horizon.');
    expect(instructions[0].hasAttribute('hidden'), 'the instruction must be visible').toBe(false);
  });
});
