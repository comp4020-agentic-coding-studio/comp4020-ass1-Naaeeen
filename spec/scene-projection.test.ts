import { describe, expect, it } from "vitest";
import { benchGeometry, deriveScene } from "../src/scripts/main";

const WIDTH = 1200;
const HEIGHT = 720;

function expectPointInside(x: number, y: number, label: string): void {
  expect(Number.isFinite(x), `${label} x must be finite`).toBe(true);
  expect(Number.isFinite(y), `${label} y must be finite`).toBe(true);
  expect(x, `${label} x must stay inside the viewBox`).toBeGreaterThanOrEqual(0);
  expect(x, `${label} x must stay inside the viewBox`).toBeLessThanOrEqual(WIDTH);
  expect(y, `${label} y must stay inside the viewBox`).toBeGreaterThanOrEqual(0);
  expect(y, `${label} y must stay inside the viewBox`).toBeLessThanOrEqual(HEIGHT);
}

describe("optical-bench projection", () => {
  it("keeps every state-bearing point inside one viewBox for all 91 elevations", () => {
    for (let elevation = 0; elevation <= 90; elevation += 1) {
      const geometry = benchGeometry(deriveScene(elevation));
      expectPointInside(geometry.observerX, geometry.observerY, `${elevation}° observer`);
      expectPointInside(geometry.sunX, geometry.sunY, `${elevation}° Sun`);
      expectPointInside(geometry.pathX, geometry.pathY, `${elevation}° path`);
      expectPointInside(
        geometry.transmittedX,
        geometry.transmittedY,
        `${elevation}° transmitted beam`,
      );
      for (const [index, segment] of geometry.scatterSegments.entries()) {
        expectPointInside(segment.x1, segment.y1, `${elevation}° scatter ${index} start`);
        expectPointInside(segment.x2, segment.y2, `${elevation}° scatter ${index} end`);
      }
      for (const [index, segment] of geometry.packetSegments.entries()) {
        expectPointInside(segment.x1, segment.y1, `${elevation}° packet ${index} start`);
        expectPointInside(segment.x2, segment.y2, `${elevation}° packet ${index} end`);
      }
    }
  });

  it("moves the Sun upward monotonically without inventing breakpoint geometry", () => {
    let previousY = benchGeometry(deriveScene(0)).sunY;
    for (let elevation = 1; elevation <= 90; elevation += 1) {
      const nextY = benchGeometry(deriveScene(elevation)).sunY;
      expect(nextY, `Sun y at ${elevation}°`).toBeLessThan(previousY);
      previousY = nextY;
    }
  });

  it("keeps the atmospheric path on the exact observer-to-Sun route", () => {
    for (const elevation of [0, 10, 45, 80, 90]) {
      const geometry = benchGeometry(deriveScene(elevation));
      const beamX = geometry.sunX - geometry.observerX;
      const beamY = geometry.sunY - geometry.observerY;
      const pathX = geometry.pathX - geometry.observerX;
      const pathY = geometry.pathY - geometry.observerY;
      const crossProduct = beamX * pathY - beamY * pathX;
      expect(crossProduct, `path alignment at ${elevation}°`).toBeCloseTo(0, 8);
    }
  });
});
