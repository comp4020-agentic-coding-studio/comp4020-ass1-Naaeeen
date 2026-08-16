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
  /** Relative amount of air on the route: 1 overhead, larger near the horizon. */
  readonly pathAmount: number;
  /** How much of each channel survives the crossing. */
  readonly transmission: SpectralTransmission;
  readonly skyColor: string;
  readonly sunColor: string;
  readonly explanation: string;
}

/** How much of each channel survives the trip, 0-1. */
export interface SpectralTransmission {
  readonly red: number;
  readonly green: number;
  readonly blue: number;
}

export interface SpectrumBand {
  /** A word for the band, so the spectrum reads without relying on colour. */
  readonly label: string;
  /** Wavelength relative to the long end, which is 1. Short bands are < 1. */
  readonly relativeWavelength: number;
  readonly tint: string;
  /** Whether this band is the kind that gets turned aside out of the beam. */
  readonly scatters: boolean;
}

// Short wavelengths first. The relative figures are ratios, not measurements:
// they only have to be ordered and spaced plausibly for the 1/wavelength^4
// relationship below to produce the right *ranking* of survival.
export const SPECTRUM_BANDS: readonly SpectrumBand[] = [
  { label: "violet", relativeWavelength: 0.66, tint: "rgb(150 142 255)", scatters: true },
  { label: "blue", relativeWavelength: 0.72, tint: "rgb(108 170 255)", scatters: true },
  { label: "cyan", relativeWavelength: 0.79, tint: "rgb(120 214 236)", scatters: true },
  { label: "green", relativeWavelength: 0.86, tint: "rgb(158 226 158)", scatters: false },
  { label: "amber", relativeWavelength: 0.93, tint: "rgb(255 201 122)", scatters: false },
  { label: "red", relativeWavelength: 1, tint: "rgb(255 132 108)", scatters: false },
];

// Rayleigh scattering removes short wavelengths from a beam far more readily
// than long ones — the classic 1/wavelength^4 dependence. Feed that into
// Beer-Lambert (survival = e^-(strength x path)) and both facts we need fall
// out of one expression: every band dims as the path grows, and the short
// bands dim fastest, so the surviving beam skews warm.
//
// The constant sets how thick the illustrated air is. It is chosen for
// legibility on screen, not measured from the sky, and no number from this
// model is ever shown to the visitor.
const RAYLEIGH_STRENGTH = 0.075;

/**
 * Relative amount of air on the route: 1 straight up, rising as the Sun drops.
 *
 * Real air mass goes as 1/sin(elevation), which diverges at the horizon. Rather
 * than clamp that — a clamp would freeze the model across the last few degrees,
 * exactly where the interesting states are — the sine is remapped into
 * [HORIZON_FLOOR, 1]. That stays bounded and stays *strictly* monotonic, so
 * every one-degree nudge still changes the answer right down to 0°.
 */
const HORIZON_FLOOR = 0.14;

export function pathAmount(elevationDeg: number): number {
  const clamped = Math.min(MAX_ELEVATION, Math.max(MIN_ELEVATION, elevationDeg));
  const sin = Math.sin((clamped * Math.PI) / 180);
  return 1 / (sin * (1 - HORIZON_FLOOR) + HORIZON_FLOOR);
}

function survives(relativeWavelength: number, air: number): number {
  return Math.exp((-RAYLEIGH_STRENGTH * air) / relativeWavelength ** 4);
}

/** Per-band survival, in the same order as `SPECTRUM_BANDS`. */
export function bandTransmissions(elevationDeg: number): readonly number[] {
  const air = pathAmount(elevationDeg);
  return SPECTRUM_BANDS.map((band) => survives(band.relativeWavelength, air));
}

function bandNamed(label: string): SpectrumBand {
  const band = SPECTRUM_BANDS.find((b) => b.label === label);
  if (!band) throw new Error(`no "${label}" band in SPECTRUM_BANDS`);
  return band;
}

/**
 * The same model reduced to three channels, for colour and for testing.
 *
 * Reads its wavelengths out of `SPECTRUM_BANDS` rather than repeating them, so
 * retuning the band table can never leave the three channels describing a
 * different atmosphere from the bars the visitor is looking at.
 */
export function spectralTransmission(elevationDeg: number): SpectralTransmission {
  const air = pathAmount(elevationDeg);
  return {
    red: survives(bandNamed("red").relativeWavelength, air),
    green: survives(bandNamed("green").relativeWavelength, air),
    blue: survives(bandNamed("blue").relativeWavelength, air),
  };
}

export interface Packet {
  /** Where along the lit traverse this packet sits, 0-1. */
  readonly along: number;
  /** Index into `SPECTRUM_BANDS`. */
  readonly band: number;
  /** Which way it is turned aside, if it is the scattering kind: -1 or 1. */
  readonly side: number;
  /** How far it travels once turned aside, 0-1. */
  readonly reach: number;
  /** Stagger within the explanatory pulse, 0-1. */
  readonly delay: number;
}

// A fixed cast again, alternating short and long bands along the route so both
// outcomes — turned aside, or carrying on — are visible at once. Positions,
// bands and stagger all come from the index, so every build ships the same
// field and a screenshot is reproducible.
export const PACKETS: readonly Packet[] = Array.from({ length: 14 }, (_unused, i): Packet => {
  const bandOrder = [0, 5, 1, 4, 2, 3, 1, 5];
  return {
    along: (i + 0.5) / 14,
    band: bandOrder[i % bandOrder.length],
    side: i % 2 === 0 ? -1 : 1,
    reach: 0.42 + (((i * 29) % 13) / 12) * 0.58,
    delay: (i % 7) / 7,
  };
});

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
    pathAmount: pathAmount(clamped),
    transmission: spectralTransmission(clamped),
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
  const bands = bandTransmissions(scene.elevationDeg)
    .map((value, i) => `--band-${i}:${round(value)};`)
    .join("");

  return (
    `--beam-angle:${round(scene.beamAngleDeg)}deg;` +
    `--beam-len:${round(scene.beamLength)};` +
    `--path-len:${round(scene.pathLength)};` +
    `--scatter-strength:${round(scene.scatterStrength)};` +
    `--scatter-spread:${round(scene.scatterSpread)};` +
    `--transmit-strength:${round(scene.transmitStrength)};` +
    `--transmit-warmth:${round(scene.transmitWarmth)};` +
    `--t-red:${round(scene.transmission.red)};` +
    `--t-green:${round(scene.transmission.green)};` +
    `--t-blue:${round(scene.transmission.blue)};` +
    bands +
    `--sun-color:${scene.sunColor};` +
    `--sky-color:${scene.skyColor};`
  );
}

/** How long the explanatory pulse runs, in milliseconds. */
const PULSE_MS = 620;
/** Quiet needed after the last input before the pulse is worth playing. */
const SETTLE_MS = 130;

function init(): void {
  const range = document.querySelector<HTMLInputElement>("#elevation");
  const scene = document.querySelector<HTMLElement>('[data-testid="scene"]');
  const explanation = document.querySelector<HTMLOutputElement>("#explanation");
  const readout = document.querySelector<HTMLElement>('[data-testid="value-readout"]');
  if (!range || !scene || !explanation) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let settleTimer = 0;
  let pulseFrame = 0;

  // Scrubbing updates state and nothing else: geometry and colour follow the
  // slider with no queued animation in the way.
  const render = (): void => {
    const next = deriveScene(range.valueAsNumber);
    scene.setAttribute("style", sceneStyle(next));
    explanation.textContent = next.explanation;
    if (readout) readout.textContent = `${Math.round(next.elevationDeg)}°`;
  };

  const stopPulse = (): void => {
    window.clearTimeout(settleTimer);
    window.cancelAnimationFrame(pulseFrame);
    scene.classList.remove("is-pulsing");
  };

  // One pulse, and a new input retargets it: the class comes off, pending
  // frames are dropped, and it goes back on next frame so the animation
  // restarts from the current state instead of queueing behind the old one.
  const pulse = (): void => {
    if (reduceMotion.matches || document.hidden) return;
    stopPulse();
    pulseFrame = window.requestAnimationFrame(() => {
      pulseFrame = window.requestAnimationFrame(() => {
        scene.classList.add("is-pulsing");
        settleTimer = window.setTimeout(() => {
          scene.classList.remove("is-pulsing");
        }, PULSE_MS + 120);
      });
    });
  };

  range.addEventListener("input", () => {
    render();
    stopPulse();
    settleTimer = window.setTimeout(pulse, SETTLE_MS);
  });

  // Drag end / key release: explain straight away rather than waiting out the
  // settle window.
  range.addEventListener("change", () => {
    render();
    pulse();
  });

  // Nothing should keep animating for a tab nobody is looking at.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopPulse();
  });

  render();
}

// Guarded so this module can also be imported from Astro's server-rendered
// frontmatter (no `document` there) to compute the initial scene — the same
// function, not a second implementation.
if (typeof document !== "undefined") {
  init();
}
