interface SessionTrace {
  readonly startedAt: number;
  readonly moves: number;
  readonly minElevation: number;
  readonly maxElevation: number;
  readonly modes: readonly string[];
  readonly resizes: number;
  readonly visibilityChanges: number;
}

const range = document.querySelector<HTMLInputElement>("#elevation");
const stage = document.querySelector<HTMLElement>('[data-testid="scene"]');
const aperture = document.querySelector<HTMLButtonElement>('[data-testid="trace-aperture"]');
const coda = document.querySelector<HTMLElement>('[data-testid="footprint-coda"]');
const codaTitle = document.querySelector<HTMLElement>("#footprint-title");
const cards = [...document.querySelectorAll<HTMLElement>("[data-trace-card]")];
const previous = document.querySelector<HTMLButtonElement>("[data-trace-previous]");
const next = document.querySelector<HTMLButtonElement>("[data-trace-next]");
const returnButton = document.querySelector<HTMLButtonElement>("[data-trace-return]");
const eraseButton = document.querySelector<HTMLButtonElement>("[data-trace-erase]");
const sunParts = [
  document.querySelector<HTMLElement>('[data-testid="atmosphere"]'),
  document.querySelector<HTMLElement>(".overlay"),
  document.querySelector<HTMLElement>('[data-testid="rail"]'),
].filter((part): part is HTMLElement => part !== null);

function initialTrace(elevation: number): SessionTrace {
  return {
    startedAt: performance.now(),
    moves: 0,
    minElevation: elevation,
    maxElevation: elevation,
    modes: [],
    resizes: 0,
    visibilityChanges: 0,
  };
}

function put(selector: string, value: string): void {
  const target = document.querySelector<HTMLElement>('[data-trace="' + selector + '"]');
  if (target) target.textContent = value;
}

function addMode(trace: SessionTrace, mode: string): SessionTrace {
  if (trace.modes.includes(mode)) return trace;
  return { ...trace, modes: [...trace.modes, mode] };
}

function displayPreference(): string {
  const motion = matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "reduced motion"
    : "full motion";
  const contrast = matchMedia("(prefers-contrast: more)").matches ? "more contrast" : "standard contrast";
  return motion + " · " + contrast;
}

function renderTrace(trace: SessionTrace): void {
  const seconds = Math.max(1, Math.round((performance.now() - trace.startedAt) / 1000));
  put("elapsed", seconds + (seconds === 1 ? " second" : " seconds"));
  put("moves", String(trace.moves));
  put("range", Math.round(trace.minElevation) + "° → " + Math.round(trace.maxElevation) + "°");
  put("modes", trace.modes.length > 0 ? trace.modes.join(" + ") : "none yet");
  put("viewport", innerWidth + " × " + innerHeight);
  put("pixels", devicePixelRatio.toFixed(2) + "×");
  put("language", navigator.language || "not exposed");
  put("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone || "not exposed");
  put("display", displayPreference());
  put("resizes", String(trace.resizes));
  put("visibility", String(trace.visibilityChanges));
}

function setSunUnavailable(unavailable: boolean): void {
  for (const part of sunParts) {
    part.toggleAttribute("inert", unavailable);
    if (unavailable) part.setAttribute("aria-hidden", "true");
    else part.removeAttribute("aria-hidden");
  }
}

function setCard(index: number): number {
  const active = Math.min(cards.length - 1, Math.max(0, index));
  cards.forEach((card, cardIndex) => {
    card.hidden = cardIndex !== active;
  });
  if (previous) previous.disabled = active === 0;
  if (next) {
    next.disabled = active === cards.length - 1;
    next.textContent = active === cards.length - 1 ? "End of trace" : "Next signal";
  }
  put("progress", active + 1 + " / " + cards.length);
  return active;
}

function initialise(): void {
  if (!range || !stage || !aperture || !coda || !codaTitle) return;

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let trace = initialTrace(range.valueAsNumber);
  let activeCard = 0;
  let closeTimer = 0;

  const updateReadiness = (): void => {
    stage.classList.toggle("is-trace-ready", trace.moves >= 3 || range.valueAsNumber <= 8);
  };

  const openCoda = (): void => {
    window.clearTimeout(closeTimer);
    renderTrace(trace);
    activeCard = setCard(0);
    coda.hidden = false;
    coda.setAttribute("aria-hidden", "false");
    aperture.setAttribute("aria-expanded", "true");
    setSunUnavailable(true);
    stage.classList.add("is-portal-opening");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => stage.classList.add("is-coda-open"));
    });
    closeTimer = window.setTimeout(
      () => stage.classList.remove("is-portal-opening"),
      reduceMotion.matches ? 0 : 940,
    );
    codaTitle.focus({ preventScroll: true });
  };

  const closeCoda = (erase: boolean): void => {
    window.clearTimeout(closeTimer);
    if (erase) trace = initialTrace(range.valueAsNumber);
    stage.classList.remove("is-coda-open", "is-portal-opening");
    aperture.setAttribute("aria-expanded", "false");
    setSunUnavailable(false);
    closeTimer = window.setTimeout(
      () => {
        coda.hidden = true;
        coda.setAttribute("aria-hidden", "true");
        aperture.focus({ preventScroll: true });
        updateReadiness();
      },
      reduceMotion.matches ? 0 : 460,
    );
  };

  range.addEventListener("pointerdown", (event) => {
    trace = addMode(trace, event.pointerType === "touch" ? "touch" : "pointer");
  });
  range.addEventListener("keydown", () => {
    trace = addMode(trace, "keyboard");
  });
  range.addEventListener("input", () => {
    const elevation = range.valueAsNumber;
    trace = {
      ...trace,
      moves: trace.moves + 1,
      minElevation: Math.min(trace.minElevation, elevation),
      maxElevation: Math.max(trace.maxElevation, elevation),
    };
    updateReadiness();
  });
  window.addEventListener("resize", () => {
    trace = { ...trace, resizes: trace.resizes + 1 };
  });
  document.addEventListener("visibilitychange", () => {
    trace = { ...trace, visibilityChanges: trace.visibilityChanges + 1 };
    if (document.hidden) stage.classList.remove("is-portal-opening");
  });

  aperture.addEventListener("click", openCoda);
  previous?.addEventListener("click", () => {
    activeCard = setCard(activeCard - 1);
  });
  next?.addEventListener("click", () => {
    activeCard = setCard(activeCard + 1);
  });
  returnButton?.addEventListener("click", () => closeCoda(false));
  eraseButton?.addEventListener("click", () => closeCoda(true));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !coda.hidden) closeCoda(false);
  });

  activeCard = setCard(activeCard);
  updateReadiness();
}

initialise();
