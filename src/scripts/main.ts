// One canonical elevation value drives every visible output — the scene's
// sun position and colour, the atmospheric-path gauge, and the explanation
// text. `deriveScene` is a pure function so the server-rendered initial
// markup (see index.astro) and the client-side update on every `input`
// event compute the exact same thing from the exact same number.

export const MIN_ELEVATION = 0;
export const MAX_ELEVATION = 90;
export const INITIAL_ELEVATION = 45;

export interface SunScene {
  readonly elevationDeg: number;
  readonly sunTopPercent: number;
  readonly pathPercent: number;
  readonly skyColor: string;
  readonly sunColor: string;
  readonly explanation: string;
}

interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

// Anchor colours for the direct solar disc: warm orange-red near the
// horizon, pale warm near-white overhead — never blue. The red channel is
// pinned at 255 at both ends, so every colour in between keeps red as the
// largest channel: the direct beam can never read as green or blue.
const SUN_HORIZON: Rgb = { r: 255, g: 110, b: 40 };
const SUN_ZENITH: Rgb = { r: 255, g: 244, b: 214 };

// Anchor colours for the sky: warm orange near the horizon, blue overhead.
// The green channel is pinned at 150 at both ends, so red and blue are
// always the two channels doing the work of the transition — green never
// becomes the dominant channel, so the sky can never read as bright green.
const SKY_HORIZON: Rgb = { r: 255, g: 150, b: 90 };
const SKY_ZENITH: Rgb = { r: 90, g: 150, b: 230 };

function lerpRgb(zenith: Rgb, horizon: Rgb, warmth: number): Rgb {
  const lerp = (a: number, b: number) => Math.round(a + (b - a) * warmth);
  return { r: lerp(zenith.r, horizon.r), g: lerp(zenith.g, horizon.g), b: lerp(zenith.b, horizon.b) };
}

function toRgbString({ r, g, b }: Rgb): string {
  return `rgb(${r}, ${g}, ${b})`;
}

export function deriveScene(elevationDeg: number): SunScene {
  const clamped = Math.min(MAX_ELEVATION, Math.max(MIN_ELEVATION, elevationDeg));
  const t = clamped / MAX_ELEVATION; // 0 at the horizon, 1 overhead

  const sunTopPercent = 78 - t * 70;
  const pathPercent = 12 + (1 - t) * 82;

  // Warmth is squared so it's concentrated near the horizon, rather than
  // fading linearly across the full 0-90° range — real skies are already
  // blue well before the Sun reaches the zenith.
  const warmth = (1 - t) ** 2;
  const sunColor = toRgbString(lerpRgb(SUN_ZENITH, SUN_HORIZON, warmth));
  const skyColor = toRgbString(lerpRgb(SKY_ZENITH, SKY_HORIZON, warmth));

  return {
    elevationDeg: clamped,
    sunTopPercent,
    pathPercent,
    skyColor,
    sunColor,
    explanation: explain(clamped, t),
  };
}

function explain(elevationDeg: number, t: number): string {
  const degrees = Math.round(elevationDeg);
  if (t > 0.66) {
    return `At ${degrees}° the Sun sits high overhead. Its light takes a short path through the atmosphere, so little of it is scattered away — the direct beam still looks close to white.`;
  }
  if (t > 0.28) {
    return `At ${degrees}° the Sun is partway down the sky. Its light now crosses more atmosphere, scattering out more of the short-wavelength light and leaving the direct beam looking a little warmer.`;
  }
  return `At ${degrees}° the Sun is near the horizon. Its light crosses a much longer stretch of atmosphere, scattering away most of the short-wavelength light — the direct beam that reaches here looks distinctly warm, even though the Sun itself hasn't changed colour.`;
}

export function sceneStyle(scene: SunScene): string {
  return (
    `--sun-top:${scene.sunTopPercent}%;` +
    `--sun-color:${scene.sunColor};` +
    `--sky-color:${scene.skyColor};` +
    `--path-height:${scene.pathPercent}%;`
  );
}

function init(): void {
  const range = document.querySelector<HTMLInputElement>("#elevation");
  const scene = document.querySelector<HTMLElement>('[data-testid="scene"]');
  const explanation = document.querySelector<HTMLOutputElement>("#explanation");
  if (!range || !scene || !explanation) return;

  const render = (): void => {
    const next = deriveScene(range.valueAsNumber);
    scene.setAttribute("style", sceneStyle(next));
    explanation.textContent = next.explanation;
  };

  range.addEventListener("input", render);
  render();
}

// Guarded so this module can also be imported from Astro's server-rendered
// frontmatter (no `document` there) to compute the initial scene — the same
// function, not a second implementation.
if (typeof document !== "undefined") {
  init();
}
