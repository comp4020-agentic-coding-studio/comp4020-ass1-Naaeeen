export const MIN_ELEVATION = 0;
export const MAX_ELEVATION = 90;
export const INITIAL_ELEVATION = 45;

export interface SunScene {
  readonly elevationDeg: number;
  readonly beamAngleDeg: number;
  readonly beamLength: number;
  readonly pathFraction: number;
  readonly pathLength: number;
  readonly scatterStrength: number;
  readonly scatterSpread: number;
  readonly transmitStrength: number;
  readonly transmitWarmth: number;
  readonly pathAmount: number;
  readonly transmission: SpectralTransmission;
  readonly skyColor: string;
  readonly sunColor: string;
  readonly horizonReveal: boolean;
  readonly explanation: string;
}

export interface SpectralTransmission {
  readonly red: number;
  readonly green: number;
  readonly blue: number;
}

export interface SpectrumBand {
  readonly label: string;
  readonly relativeWavelength: number;
  readonly tint: string;
  readonly scatters: boolean;
}

export const SPECTRUM_BANDS: readonly SpectrumBand[] = [
  { label: 'violet', relativeWavelength: 0.66, tint: 'rgb(150 142 255)', scatters: true },
  { label: 'blue', relativeWavelength: 0.72, tint: 'rgb(108 170 255)', scatters: true },
  { label: 'cyan', relativeWavelength: 0.79, tint: 'rgb(120 214 236)', scatters: true },
  { label: 'green', relativeWavelength: 0.86, tint: 'rgb(158 226 158)', scatters: false },
  { label: 'amber', relativeWavelength: 0.93, tint: 'rgb(255 201 122)', scatters: false },
  { label: 'red', relativeWavelength: 1, tint: 'rgb(255 132 108)', scatters: false },
];

const RAYLEIGH_STRENGTH = 0.075;

export function pathAmount(elevationDeg: number): number {
  const clamped = Math.min(MAX_ELEVATION, Math.max(MIN_ELEVATION, elevationDeg));
  const radians = (clamped * Math.PI) / 180;
  return 1 / (Math.sin(radians) + 0.50572 * (clamped + 6.07995) ** -1.6364);
}

function survives(relativeWavelength: number, air: number): number {
  return Math.exp((-RAYLEIGH_STRENGTH * air) / relativeWavelength ** 4);
}

export function bandTransmissions(elevationDeg: number): readonly number[] {
  const air = pathAmount(elevationDeg);
  return SPECTRUM_BANDS.map((band) => survives(band.relativeWavelength, air));
}

function bandNamed(label: string): SpectrumBand {
  const band = SPECTRUM_BANDS.find((candidate) => candidate.label === label);
  if (!band) throw new Error(`no "${label}" band in SPECTRUM_BANDS`);
  return band;
}

export function spectralTransmission(elevationDeg: number): SpectralTransmission {
  const air = pathAmount(elevationDeg);
  return {
    red: survives(bandNamed('red').relativeWavelength, air),
    green: survives(bandNamed('green').relativeWavelength, air),
    blue: survives(bandNamed('blue').relativeWavelength, air),
  };
}

export interface Packet {
  readonly along: number;
  readonly band: number;
  readonly side: number;
  readonly reach: number;
  readonly delay: number;
}

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
  readonly along: number;
  readonly side: number;
  readonly reach: number;
  readonly tilt: number;
}

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

const SKY_HORIZON: Rgb = { r: 255, g: 150, b: 90 };
const SKY_ZENITH: Rgb = { r: 90, g: 150, b: 230 };

function lerpRgb(zenith: Rgb, horizon: Rgb, warmth: number): Rgb {
  const lerp = (a: number, b: number) => Math.round(a + (b - a) * warmth);
  return { r: lerp(zenith.r, horizon.r), g: lerp(zenith.g, horizon.g), b: lerp(zenith.b, horizon.b) };
}

function toRgbString({ r, g, b }: Rgb): string {
  return `rgb(${r}, ${g}, ${b})`;
}

const clampUnit = (value: number): number => Math.min(1, Math.max(0, value));

export function receivedLightRgb(elevationDeg: number): Rgb {
  const current = spectralTransmission(elevationDeg);
  const overhead = spectralTransmission(MAX_ELEVATION);
  const relative = {
    r: current.red / overhead.red,
    g: current.green / overhead.green,
    b: current.blue / overhead.blue,
  };
  const peak = Math.max(relative.r, relative.g, relative.b, Number.EPSILON);
  const encode = (linear: number): number => Math.round(255 * clampUnit(linear / peak) ** (1 / 2.2));

  return { r: encode(relative.r), g: encode(relative.g), b: encode(relative.b) };
}

export function receivedLightColor(elevationDeg: number): string {
  const { r, g, b } = receivedLightRgb(elevationDeg);
  return `rgb(${r}, ${g}, ${b})`;
}

export function deriveScene(elevationDeg: number): SunScene {
  const clamped = Math.min(MAX_ELEVATION, Math.max(MIN_ELEVATION, elevationDeg));
  const t = clamped / MAX_ELEVATION;
  const beamAngleDeg = 14 + t * 60;
  const beamLength = 32 + t * 28;
  const pathFraction = 0.96 - t * 0.88;
  const pathLength = beamLength * pathFraction;
  const transmission = spectralTransmission(clamped);
  const overhead = spectralTransmission(MAX_ELEVATION);
  const relativeBrightness =
    (transmission.red / overhead.red + transmission.green / overhead.green + transmission.blue / overhead.blue) / 3;
  const scatterStrength = Math.max(0.08, clampUnit(1 - transmission.blue / overhead.blue));
  const scatterSpread = 0.3 + scatterStrength * 0.7;
  const transmitStrength = 0.16 + clampUnit(relativeBrightness) * 0.84;
  const received = receivedLightRgb(clamped);
  const warmth = clampUnit((received.r - received.b) / 255);
  const sunColor = toRgbString(received);
  const skyColor = toRgbString(lerpRgb(SKY_ZENITH, SKY_HORIZON, (1 - t) ** 2));

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
    transmission,
    skyColor,
    sunColor,
    horizonReveal: clamped <= 8,
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
    .join('');

  return (
    `--scatter-strength:${round(scene.scatterStrength)};` +
    `--scatter-spread:${round(scene.scatterSpread)};` +
    `--transmit-strength:${round(scene.transmitStrength)};` +
    `--transmit-warmth:${round(scene.transmitWarmth)};` +
    `--t-red:${round(scene.transmission.red)};` +
    `--t-green:${round(scene.transmission.green)};` +
    `--t-blue:${round(scene.transmission.blue)};` +
    '--horizon-reveal:' + (scene.horizonReveal ? 1 : 0) + ';' +
    bands +
    `--sun-color:${scene.sunColor};` +
    `--sky-color:${scene.skyColor};`
  );
}

export interface BenchSegment {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly opacity: number;
  readonly width: number;
}

export interface BenchPacketSegment extends BenchSegment {
  readonly band: number;
}

export interface BenchGeometry {
  readonly observerX: number;
  readonly observerY: number;
  readonly sunX: number;
  readonly sunY: number;
  readonly pathX: number;
  readonly pathY: number;
  readonly transmittedX: number;
  readonly transmittedY: number;
  readonly labelX: number;
  readonly labelY: number;
  readonly receivedX: number;
  readonly receivedY: number;
  readonly scatterSegments: readonly BenchSegment[];
  readonly packetSegments: readonly BenchPacketSegment[];
}

const OBSERVER_X = 250;
const OBSERVER_Y = 548;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function normalize(x: number, y: number): { x: number; y: number } {
  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length };
}

export function benchGeometry(scene: SunScene): BenchGeometry {
  const t = scene.elevationDeg / MAX_ELEVATION;
  const sunX = lerp(980, 700, t);
  const sunY = lerp(470, 122, t);
  const dx = sunX - OBSERVER_X;
  const dy = sunY - OBSERVER_Y;
  const dir = normalize(dx, dy);
  const perp = { x: -dir.y, y: dir.x };
  const pathT = 0.18 + scene.pathFraction * 0.74;
  const pathX = OBSERVER_X + dx * pathT;
  const pathY = OBSERVER_Y + dy * pathT;
  const transmittedX = OBSERVER_X + dir.x * 134;
  const transmittedY = OBSERVER_Y + dir.y * 134;
  const labelX = lerp(OBSERVER_X, pathX, 0.78) + perp.x * 78;
  const labelY = lerp(OBSERVER_Y, pathY, 0.78) + perp.y * 78;
  const receivedX = OBSERVER_X + 136;
  const receivedY = OBSERVER_Y + 62;
  const transmissionBands = bandTransmissions(scene.elevationDeg);

  const scatterSegments = SCATTER_MARKS.map((mark) => {
    const along = 0.08 + mark.along * pathT * 0.9;
    const baseX = OBSERVER_X + dx * along;
    const baseY = OBSERVER_Y + dy * along;
    const branch = 34 + mark.reach * 108 * scene.scatterSpread;
    const lift = mark.side * branch;
    const drift = 12 + mark.reach * 26;
    return {
      x1: baseX,
      y1: baseY,
      x2: baseX + perp.x * lift + dir.x * drift,
      y2: baseY + perp.y * lift + dir.y * drift,
      opacity: 0.16 + 0.5 * scene.scatterStrength,
      width: 2 + mark.reach * 6,
    };
  });

  const packetSegments = PACKETS.map((packet) => {
    const band = SPECTRUM_BANDS[packet.band];
    if (band.scatters) {
      const along = 0.12 + packet.along * pathT * 0.84;
      const baseX = OBSERVER_X + dx * along;
      const baseY = OBSERVER_Y + dy * along;
      const branch = 22 + packet.reach * 92 * scene.scatterSpread;
      const drift = 18 + packet.reach * 20;
      return {
        band: packet.band,
        x1: baseX,
        y1: baseY,
        x2: baseX + perp.x * packet.side * branch + dir.x * drift,
        y2: baseY + perp.y * packet.side * branch + dir.y * drift,
        opacity: 0.24 + 0.56 * scene.scatterStrength,
        width: 4 + packet.reach * 6,
      };
    }

    const startT = 0.02 + packet.along * 0.34;
    const endT = Math.min(pathT, startT + 0.18 + packet.reach * 0.08);
    const startX = OBSERVER_X + dx * startT;
    const startY = OBSERVER_Y + dy * startT;
    const endX = OBSERVER_X + dx * endT;
    const endY = OBSERVER_Y + dy * endT;
    return {
      band: packet.band,
      x1: startX,
      y1: startY,
      x2: endX,
      y2: endY,
      opacity: 0.22 + 0.72 * transmissionBands[packet.band],
      width: 4 + packet.reach * 5,
    };
  });

  return {
    observerX: OBSERVER_X,
    observerY: OBSERVER_Y,
    sunX,
    sunY,
    pathX,
    pathY,
    transmittedX,
    transmittedY,
    labelX,
    labelY,
    receivedX,
    receivedY,
    scatterSegments,
    packetSegments,
  };
}

interface BenchDom {
  readonly directBeam: SVGLineElement | null;
  readonly beamCore: SVGLineElement | null;
  readonly path: SVGLineElement | null;
  readonly transmitted: SVGLineElement | null;
  readonly sun: SVGCircleElement | null;
  readonly bloom: SVGCircleElement | null;
  readonly label: SVGTextElement | null;
  readonly swatch: SVGCircleElement | null;
  readonly scatters: readonly SVGLineElement[];
  readonly packets: readonly SVGLineElement[];
}

function setLine(line: SVGLineElement | null, segment: BenchSegment): void {
  if (!line) return;
  line.setAttribute('x1', round(segment.x1));
  line.setAttribute('y1', round(segment.y1));
  line.setAttribute('x2', round(segment.x2));
  line.setAttribute('y2', round(segment.y2));
  line.setAttribute('opacity', round(segment.opacity));
  line.setAttribute('stroke-width', round(segment.width));
}

function renderBench(scene: SunScene, bench: BenchDom): void {
  const geometry = benchGeometry(scene);
  const fullBeam: BenchSegment = {
    x1: geometry.observerX,
    y1: geometry.observerY,
    x2: geometry.sunX,
    y2: geometry.sunY,
    opacity: 0.16 + 0.18 * scene.transmitStrength,
    width: 26,
  };
  const coreBeam: BenchSegment = {
    x1: geometry.observerX,
    y1: geometry.observerY,
    x2: geometry.sunX,
    y2: geometry.sunY,
    opacity: 0.48 + 0.42 * scene.transmitStrength,
    width: 6,
  };
  const pathBeam: BenchSegment = {
    x1: geometry.observerX,
    y1: geometry.observerY,
    x2: geometry.pathX,
    y2: geometry.pathY,
    opacity: 0.42 + 0.38 * scene.scatterStrength,
    width: 34,
  };
  const transmitted: BenchSegment = {
    x1: geometry.observerX,
    y1: geometry.observerY,
    x2: geometry.transmittedX,
    y2: geometry.transmittedY,
    opacity: 0.34 + 0.58 * scene.transmitStrength,
    width: 16,
  };

  setLine(bench.directBeam, fullBeam);
  setLine(bench.beamCore, coreBeam);
  setLine(bench.path, pathBeam);
  setLine(bench.transmitted, transmitted);

  if (bench.sun) {
    bench.sun.setAttribute('cx', round(geometry.sunX));
    bench.sun.setAttribute('cy', round(geometry.sunY));
    bench.sun.setAttribute('fill', scene.sunColor);
  }
  if (bench.bloom) {
    bench.bloom.setAttribute('cx', round(geometry.sunX));
    bench.bloom.setAttribute('cy', round(geometry.sunY));
  }
  if (bench.label) {
    bench.label.setAttribute('x', round(geometry.labelX));
    bench.label.setAttribute('y', round(geometry.labelY));
  }
  if (bench.swatch) {
    bench.swatch.setAttribute('fill', scene.sunColor);
  }

  geometry.scatterSegments.forEach((segment, index) => {
    const line = bench.scatters[index];
    if (!line) return;
    setLine(line, segment);
  });

  geometry.packetSegments.forEach((segment, index) => {
    const line = bench.packets[index];
    if (!line) return;
    setLine(line, segment);
    line.setAttribute('stroke', SPECTRUM_BANDS[segment.band].tint);
  });
}

const PULSE_MS = 620;
const SETTLE_MS = 130;

function init(): void {
  const range = document.querySelector<HTMLInputElement>('#elevation');
  const scene = document.querySelector<HTMLElement>('[data-testid="scene"]');
  const explanation = document.querySelector<HTMLOutputElement>('#explanation');
  const readout = document.querySelector<HTMLElement>('[data-testid="value-readout"]');
  const airMassReadout = document.querySelector<HTMLOutputElement>('[data-testid="airmass-value"]');
  const horizonReveal = document.querySelector<HTMLElement>('[data-testid="horizon-reveal"]');
  if (!range || !scene || !explanation) return;

  const bench: BenchDom = {
    directBeam: document.querySelector<SVGLineElement>('[data-testid="direct-beam"]'),
    beamCore: document.querySelector<SVGLineElement>('.bench-ray-core'),
    path: document.querySelector<SVGLineElement>('[data-testid="atmospheric-path"]'),
    transmitted: document.querySelector<SVGLineElement>('[data-testid="transmitted-beam"]'),
    sun: document.querySelector<SVGCircleElement>('.bench-sun-disc'),
    bloom: document.querySelector<SVGCircleElement>('.bench-sun-bloom'),
    label: document.querySelector<SVGTextElement>('.bench-caption-scatter'),
    swatch: document.querySelector<SVGCircleElement>('[data-bench-received-swatch]'),
    scatters: [...document.querySelectorAll<SVGLineElement>('[data-bench-scatter-index]')],
    packets: [...document.querySelectorAll<SVGLineElement>('[data-bench-packet-index]')],
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let settleTimer = 0;
  let pulseFrame = 0;
  let pointerScrubbing = false;

  const render = (): void => {
    const next = deriveScene(range.valueAsNumber);
    scene.setAttribute('style', sceneStyle(next));
    explanation.textContent = next.explanation;
    if (readout) readout.textContent = `${Math.round(next.elevationDeg)}°`;
    if (airMassReadout) airMassReadout.textContent = `×${next.pathAmount.toFixed(1)}`;
    if (horizonReveal) horizonReveal.setAttribute('aria-hidden', String(!next.horizonReveal));
    renderBench(next, bench);
  };

  const stopPulse = (): void => {
    window.clearTimeout(settleTimer);
    window.cancelAnimationFrame(pulseFrame);
    scene.classList.remove('is-pulsing');
  };

  const pulse = (): void => {
    if (reduceMotion.matches || document.hidden) return;
    stopPulse();
    pulseFrame = window.requestAnimationFrame(() => {
      pulseFrame = window.requestAnimationFrame(() => {
        scene.classList.add('is-pulsing');
        settleTimer = window.setTimeout(() => {
          scene.classList.remove('is-pulsing');
        }, PULSE_MS + 120);
      });
    });
  };

  const beginScrub = (): void => {
    pointerScrubbing = true;
    stopPulse();
    scene.classList.add("is-scrubbing");
  };

  const endScrub = (): void => {
    if (!pointerScrubbing) return;
    pointerScrubbing = false;
    scene.classList.remove("is-scrubbing");
    stopPulse();
    settleTimer = window.setTimeout(pulse, SETTLE_MS);
  };

  range.addEventListener('pointerdown', beginScrub);
  window.addEventListener('pointerup', endScrub);
  window.addEventListener('pointercancel', endScrub);

  range.addEventListener('input', () => {
    render();
    stopPulse();
    if (!pointerScrubbing) settleTimer = window.setTimeout(pulse, SETTLE_MS);
  });

  range.addEventListener('change', () => {
    render();
    if (!pointerScrubbing) pulse();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopPulse();
  });

  render();
}

if (typeof document !== 'undefined') {
  init();
}
