// One canonical elevation value drives every visible output — where the Sun
// sits, the angle and length of its route to the observer, how much light is
// scattered aside, how much still arrives, the sky and Sun colours, and the
// explanation text. `deriveScene` is a pure function so the server-rendered
// markup (see index.astro) and the client-side update on every `input` event
// compute the exact same thing from the exact same number.

export const MIN_ELEVATION = 0;
export const MAX_ELEVATION = 90;
export const INITIAL_ELEVATION = 45;

export interface SunScene {
  readonly elevationDeg: number;
  /** Angle of the Sun-to-observer route, in degrees above the ground. */
  readonly beamAngleDeg: number;
  /** Whole route length, in `--u` units (see global.css). */
  readonly beamLength: number;
  /** Fraction of that route drawn as the lit atmospheric traverse, 0-1. */
  readonly pathFraction: number;
  /** The traverse itself, in `--u` units: beamLength x pathFraction. */
  readonly pathLength: number;
  /** How much short-wavelength light is being turned aside, 0-1. */
  readonly scatterStrength: number;
  /** How far the redirected light spreads from the route, 0-1. */
  readonly scatterSpread: number;
  /** How much direct light still reaches the observer, 0-1. */
  readonly transmitStrength: number;
  /** How warm that surviving direct light looks, 0-1. */
  readonly transmitWarmth: number;
  readonly skyColor: string;
  readonly sunColor: string;
  readonly explanation: string;
}

export interface ScatterMark {
  /** Position along the lit traverse, 0-1. */
  readonly along: number;
  /** Which side of the route this light is turned toward: -1 or 1. */
  readonly side: number;
  /** How far out this mark reaches, 0-1. */
  readonly reach: number;
  /** Extra fan angle, in degrees. */
  readonly tilt: number;
}

// A fixed cast of marks, not a particle system: positions come from the index
// so the same 16 marks ship every build and every render. Elevation changes
// how far they reach and how visible they are, never how many there are or
// where they start — which keeps the scene verifiable.
export const SCATTER_MARKS: readonly ScatterMark[] = Array.from(
  { length: 16 },
  (_unused, i): ScatterMark => ({
    along: (i + 0.6) / 16,
    side: i % 2 === 0 ? -1 : 1,
    reach: 0.38 + (((i * 37) % 16) / 15) * 0.62,
    tilt: -26 + (((i * 53) % 11) / 10) * 52,
  }),
);

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

  // A low Sun sits far off toward the horizon, so its light arrives along a
  // shallow, drawn-out route; a high Sun is steep and close. Both the angle
  // and the length of the route come from this one number, so the geometry
  // can never disagree with the colour or the words.
  const beamAngleDeg = 14 + t * 60;
  const beamLength = 32 + t * 28;

  // The share of that route drawn as atmosphere the light has to cross. It
  // shrinks as the Sun climbs, which is the whole point: the shallow route
  // spends far longer in the air. Kept <= 1 so the lit traverse can never be
  // longer than the route it lies on.
  //
  // These two curves are tuned together, not independently. The route grows
  // as the Sun rises while this share shrinks, and the shrink has to win at
  // every elevation, or a higher Sun could end up with a *longer* lit path —
  // which would be backwards. `spec/light-story.test.ts` pins that down.
  const pathFraction = 0.96 - t * 0.88;
  const pathLength = beamLength * pathFraction;

  // More air crossed means more short-wavelength light turned aside, so less
  // direct light left over — and what is left looks warmer. The floor on
  // scattering keeps a little blue in play overhead, because scattering never
  // actually stops; it just has less air to work with.
  const scatterStrength = 0.08 + (1 - t) ** 0.85 * 0.92;
  const scatterSpread = 0.3 + (1 - t) * 0.7;
  const transmitStrength = 0.26 + t * 0.68;

  // Warmth is squared so it's concentrated near the horizon, rather than
  // fading linearly across the full 0-90° range — real skies are already
  // blue well before the Sun reaches the zenith.
  const warmth = (1 - t) ** 2;
  const sunColor = toRgbString(lerpRgb(SUN_ZENITH, SUN_HORIZON, warmth));
  const skyColor = toRgbString(lerpRgb(SKY_ZENITH, SKY_HORIZON, warmth));

  return {
    elevationDeg: clamped,
    beamAngleDeg,
    beamLength,
    pathFraction,
    pathLength,
    scatterStrength,
    scatterSpread,
    transmitStrength,
    transmitWarmth: warmth,
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

const round = (n: number): string => n.toFixed(3);

export function sceneStyle(scene: SunScene): string {
  return (
    `--beam-angle:${round(scene.beamAngleDeg)}deg;` +
    `--beam-len:${round(scene.beamLength)};` +
    `--path-len:${round(scene.pathLength)};` +
    `--scatter-strength:${round(scene.scatterStrength)};` +
    `--scatter-spread:${round(scene.scatterSpread)};` +
    `--transmit-strength:${round(scene.transmitStrength)};` +
    `--transmit-warmth:${round(scene.transmitWarmth)};` +
    `--sun-color:${scene.sunColor};` +
    `--sky-color:${scene.skyColor};`
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
