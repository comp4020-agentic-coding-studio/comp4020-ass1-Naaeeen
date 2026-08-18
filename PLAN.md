# PLAN — The Sun Never Turned Red

## Thesis

Lowering the Sun increases the atmospheric path length, which removes more
short-wavelength light from the direct beam, which changes what the visitor
sees and how it's explained — one physical cause, one visible effect. The
Sun itself never changes colour.

The optional coda turns the same observer around: while the visitor uses the
instrument, the browser can describe the visit from ordinary, local session
signals. It is a short reveal about mediated observation, not a second app or
an excuse to collect data.

## Core interaction

The visitor drags, touches, or keys one control (a native range input) to
set the Sun's elevation, 0–90°. Pointer drag, touch drag, and keyboard
arrows are equivalent ways of operating the same control — none is a second
mechanic.

## Canonical state

One number, Sun elevation, is the only source of truth. It drives, in
lockstep, from that single value:

- the Sun's position in the scene
- the atmospheric-path geometry
- scattering strength
- transmitted-light warmth
- sky appearance
- the displayed current value
- the explanation text
- the near-horizon reveal state

No physics output holds independent state. No randomised particle counts or
per-frame jitter that would make verification unstable — anything visual
that varies must be a deterministic function of elevation.

The coda may keep a separate, ephemeral session summary (elapsed time,
elevation changes, input modality, resize/visibility events, and browser
display preferences). It exists only in memory, is never persisted or sent,
records no content typed by the visitor, and is erased on refresh or by the
visible erase action.

## Scientific scope and limitations

Models Rayleigh scattering at a level appropriate for a one-page explainer:
lower elevation → longer path → more short-wavelength light scattered out
of the direct beam → warmer remaining direct light. This is a
single-variable illustrative model, not a radiative-transfer simulation —
no aerosols, pollution, humidity, cloud, or real atmospheric data. No exact
wavelengths, percentages, or air-mass values. The visualisation is a
stylised diagram of a real mechanism, and says so on the page — that note is
part of the required rail inventory below, not optional dressing.
High-fidelity stylised realism is the visual target; photorealistic
simulation is not a claim the work may make.

One wording trap: the composition may use haze or depth layers as *visual*
atmosphere, but the copy must not explain them as aerosol or pollution
effects — aerosols are outside this model. Unlabelled visual depth is fine;
attributing the phenomenon to particles the model doesn't have is not.

## Fixed non-goals (this cycle)

- No camera, microphone, notifications, or device-orientation access.
- No geolocation (deferred, not attempted).
- No backend, accounts, analytics, persistence, or cookies.
- No second exploratory simulation — elevation remains the only physics
  control. The coda's aperture trigger and slide navigation only reveal the
  session produced while using that control.
- No scores, lives, levels, or timers.
- No second route or network-loaded page. The coda is a same-document scene.
- No remote assets or remote fonts.
- No new animation dependency.
- No Canvas, WebGL, or Three.js in the next implementation slice. If one
  later looks genuinely necessary, it requires its own architecture
  decision first — not an incidental addition mid-slice.
- The core lesson works completely with zero permissions granted.

## Scoped coda — the observer observed

The receiver/aperture becomes an easter-egg trigger only after the visitor has
moved the Sun. It may be visually quiet, but it remains a real named button,
keyboard reachable, focus visible, and understandable without hover. Activating
it launches one finite, interruptible particle transition and swaps to a
visually distinct editorial "session field". Reduced motion skips the travel
and cross-fades directly to the same final information.

The coda contains a short sequence of slides/cards built from local facts only:

- what the browser exposed without a permission prompt (viewport, pixel ratio,
  language/time-zone and colour/motion preferences)
- what this page observed during this visit (elapsed time, elevation range and
  change count, input modalities, resize and visibility-change counts)
- what it deliberately did not request or retain
- an honest erase-and-return action

No geolocation, camera, microphone, notifications, clipboard, IP lookup,
cookies, local/session storage, analytics, fingerprint ID, network submission,
personality inference, or cross-visit comparison. Values are descriptive, not
claims that the visitor is unique or identifiable. The coda uses a different
palette and layout, but the conceptual bridge is explicit: an observer never
receives reality unmediated; the medium decides what becomes visible.

## Visual direction — production contract

The functional baseline (checkpoint 4) is accepted and its colour model is
settled. What follows governs the visual work from checkpoint 6 onward.

### What the browser audit rejected — now durable requirements

The 1920×1080 audit found the illustration was ~640×226 floating in large
unused white space; the composition read as a starter form containing a
demo; the default-looking slider dominated more than the phenomenon; and
the phone version, while functional, felt like an ordinary form page. Those
four characteristics are now standing failures, not one-off notes:

- A small framed illustration inside a mostly-empty page is a failure.
- A centred card, dashboard, or settings-page composition is a failure.
- A control that visually outweighs the phenomenon is a failure.
- A phone layout that reads as a form is a failure.
- Generic glassmorphism, decorative blobs, and arbitrary translucent panels
  are failures.

"Apple-level" here means restraint, precision, hierarchy, and
responsiveness. It does not mean imitating Apple branding, copying an Apple
page, or adding translucent chrome for its own sake.

### Naming, so the measurements below are unambiguous

- **the stage** — the complete viewport-scale experience, carrying
  `data-testid="scene"`. The stage fills the viewport; it is the whole
  composition, rail included.
- **the atmosphere field** — the main illustrated sky/atmosphere area
  *inside* the stage, carrying `data-testid="atmosphere"`. This is the part
  that must occupy most of the stage, and it is what the 70% / 55%
  thresholds below refer to.
- **the path** — the rendered element representing the beam's atmospheric
  traverse. Its measured length is what the 1.5× requirement refers to.
- **the rail** — the bottom instrument group holding the control, value,
  explanation, and the stylised-illustration note.

Every threshold below is measured on the named element's
`getBoundingClientRect()`, and nothing else. `data-testid="atmosphere"` is
an acceptance hook for checkpoint 6 — it does not exist yet and is not added
in this checkpoint.

### Responsive rescue contract

The current branch already proves the science and interaction, but the layout
still fails under real viewport variation because too many narrative elements
share one absolute-positioned stage. The rescue is structural, not a round of
coordinate nudges.

#### Architecture decision — region shell, not duplicated pages

Two approaches were evaluated after the failed browser audit:

- **A — one stable region shell (chosen):** one DOM and one elevation state,
  partitioned into an illustration region, HUD/story region, instrument rail,
  and the existing coda overlay. Breakpoints rearrange whole regions while
  container queries adapt their internals.
- **B — separate desktop and compact DOMs (rejected):** easier to art-direct in
  isolation, but duplicates headings, IDs, controls, accessible descriptions,
  and state consumers. It creates two experiences that can silently drift and
  makes resize-mid-use brittle.

The chosen shell has these durable roles:

- **scene region:** atmosphere, Sun, path, packets, aperture, horizon, and the
  received-colour witness; illustration geometry may be absolute inside it
- **HUD region:** title, instruction, horizon conclusion, and one concise
  dynamic scientific signal
- **rail region:** the labelled range, current value, spectrum, explanation,
  and model limitation note
- **physics disclosure:** equations and supporting explanation in normal flow;
  it may dock beside the scene when space permits, but never becomes an
  independently positioned object inside the atmosphere
- **coda overlay:** a sibling layer with its own responsive layout, never part
  of the Sun composition grid

This corrects the earlier false constraint that every phone element had to fit
inside a fixed `100dvh`. On compact screens the core interaction stays early
and coherent, but deeper science may continue below the fold in normal vertical
flow. WCAG reflow permits vertical scrolling; compressing text until it is
unreadable is not a responsive solution.

Rules for this rescue:

- Breakpoints follow content pressure, not device labels. The browser matrix is
  evidence only; it is not the source of the breakpoint values.
- Absolute positioning is for illustration geometry only: Sun, beam, path,
  packets, aperture, and horizon. Narrative/UI blocks must live in normal grid
  or flex flow.
- The title block, model explanation, arrival spectrum, slider rail, and
  written explanation may overlap the artwork visually, but they may not share
  the same collision domain. Each needs its own layout container.
- Desktop polish may use staged overlap and negative space. Phone and narrow
  portrait layouts must degrade to a readable single-column reading path rather
  than trying to preserve the desktop composition.
- Science uses progressive disclosure: the causal claim and current signal are
  always visible; the three equations and longer explanation remain available
  without competing with the simulation at every size.
- No horizontal scrolling for reading the page's text or operating the control.
- Fluid sizing must be bounded. Large text, panels, and scene objects use
  clamp()/min()/max() or equivalent bounds rather than raw viewport-sized
  growth.
- Viewport-height units are for the stage and scene envelope only. Text blocks
  and explanatory panels are not sized directly from viewport height.
- Hover-only affordances are optional polish. Every essential control and
  reveal remains legible and operable for coarse pointers and keyboard use.
- Resizing across a composition boundary must preserve the elevation, the
  explanation it produces, and whether the coda is open. A breakpoint changes
  layout only, never meaning or state.

The verification matrix for this rescue is:

- wide desktop: 2560x1440
- marking desktop: 1920x1080
- short laptop: 1366x768
- landscape tablet / small laptop: 1024x768
- narrow portrait stress case from the failed audit: 692x1061
- phone marking viewport: 390x844
- small phone: 360x800
- WCAG-style reflow floor: 320px wide single-column reading path

Passing this checkpoint means:

- no overlapping text blocks
- no title/model/reveal collisions
- no horizontal overflow in the reading path
- the control remains comfortably targetable
- the scene still reads as the hero on desktop
- the phone version reads as an intentional story, not a squeezed desktop
  screenshot

### Experience flow

1. The experience opens directly into a full-screen atmospheric scene.
2. The visitor immediately sees one instruction:
   `Move the Sun toward the horizon.`
3. The visitor operates the single elevation control.
4. The Sun, atmospheric path, scattering marks, transmitted light, sky, and
   explanation respond together.
5. At or below 8° elevation, the same mechanic produces the reveal:
   `The Sun didn't turn red. The atmosphere changed what reached you.`

The reveal is an outcome of the existing mechanic — a state the one control
reaches at or below 8° — not a second mechanic, a new screen, or a separate
trigger. 8° is the checkable threshold; it is a legibility choice, not a
physical claim about a specific angle.

### Visual composition

One unified scene, containing:

- a full-bleed layered sky
- a carefully rendered solar disc with restrained bloom
- atmospheric depth or haze layers
- a low horizon or landscape silhouette
- a small observer position
- the direct Sun-to-observer beam
- a visibly highlighted atmospheric path along that beam
- deterministic blue scattering particles or strokes leaving that path
- warmer transmitted light continuing toward the observer
- a restrained bottom rail holding the accessible range control, the current
  value, the concise explanation, and the stylised-illustration note (that
  note is required — it may be quiet, but it may not be dropped)
- subtle texture or grain only where it adds depth and does not introduce
  continuous animation or a full-screen filter

The stage dominates the viewport. Title and instruction stay visually
secondary to the scene.

The items above are a required inventory: each must be present and
identifiable in the rendered page. Everything in "What the browser audit
rejected" is *direction* — judged by a person at review, not measured.

The science readouts are part of the instrument deck, not free-floating lesson
cards in the sky. The arrival spectrum and the three-step causal model may be
styled richly, but on every viewport they belong to the rail's information
cluster so the atmosphere field remains an atmosphere field rather than a
collision between scene and documentation. Wide layouts may dock that cluster
to the rail's right side; narrow layouts stack it below the control. What is
forbidden is a large, absolute-positioned teaching panel or spectrum readout
floating independently over the sky.

### Motion contract

- Motion is user-driven and causal, not decorative autoplay.
- Response is immediate while dragging — the scene tracks the control
  rather than replaying a canned sequence.
- Transitions are short and interruptible; a new input retargets from the
  current position instead of queueing.
- Use `transform` and `opacity` for continuous motion where practical.
  MDN's animation-performance guidance is explicit that staying off
  reflow/repaint is what makes compositor offloading possible, and names
  `transform` as the primary such property.
- No `transition: all`.
- No continuous animation of layout properties.
- No per-frame DOM reconstruction.
- No *looping or autonomous* full-screen blur/filter animation. A
  state-driven filter or gradient that settles to a new value when the
  control moves is allowed — that's the mechanic, not decoration. What's
  banned is a filter that animates on its own clock, and any keyframed
  full-screen filter loop. Prefer `transform`/`opacity` for anything that
  moves continuously during a drag.
- Under `prefers-reduced-motion`, ambient effects stop *animating* but stay
  *rendered*: nothing that carries state may disappear. Reduced motion
  replaces motion, it never removes information. MDN's reduced-motion
  reference sanctions substitution explicitly, and warns that scaling or
  panning large objects is a vestibular trigger — so the reduced path
  conveys state through position, geometry, colour, and text, arriving at
  the same end state without the travel.
- The low and high states must both remain understandable in a still
  screenshot with no motion at all.

### Accessibility and input

- The native labelled range input stays the semantic control.
- Pointer, touch, and keyboard operate the same one state.
- A visible, high-contrast focus indicator.
- The range input's own bounding box is at least 44 CSS pixels on its
  cross-axis (height, for a horizontal slider) — measured on the `<input>`
  itself, not on a padded ancestor, so the touch target is real.
- Colour is never the only carrier of the explanation — geometry,
  scattering marks, and text must also differ between states.
- No `aria-live` region announcing on every input event during a continuous
  drag.
- The reveal must still reach a screen-reader user. Since the explanation
  region is not a live region during dragging, the reveal state must be
  exposed some non-visual way that fires on settle rather than per tick —
  e.g. announcing once on `change` (drag end / key release) rather than on
  `input`, or reflecting the state on the control's accessible description.
  Whichever way it's done, it must not chatter during a drag, and the reveal
  must not be visual-only.

### Desktop acceptance — 1920×1080

Measured (pass/fail):

- The stage's width is at least 98% of `window.innerWidth`.
- The stage's height is at least 98% of `window.innerHeight`.
- The atmosphere field occupies at least 70% of the stage's height.
- The stage is not constrained by a small fixed `max-width` — no centred
  fixed-width box.
- The rail is fully within the viewport, reachable without scrolling.
- No overflow: `document.documentElement.scrollWidth <= window.innerWidth + 1`
  and `document.documentElement.scrollHeight <= window.innerHeight + 2`.
- The Sun, beam, and observer bounding boxes do not intersect any text or
  rail bounding box.

Judged at review: that it reads as a full-screen scene rather than a page
containing a widget, and that title and instruction sit below the scene in
visual hierarchy.

### Phone acceptance — 390×844

Measured (pass/fail):

- The stage uses normal vertical flow with `min-height: 100svh`; it must not
  impose a fixed height that crushes or clips its children.
- The first viewport presents the title, instruction, atmosphere, labelled
  control, and current value as one understandable interaction. Supporting
  equations may follow below it.
- The atmosphere remains a substantial visual region (at least 42svh and at
  least 20rem tall) rather than collapsing behind the rail.
- No horizontal overflow:
  `document.documentElement.scrollWidth <= window.innerWidth + 1`. Vertical
  scrolling is allowed and expected for deeper physics content.
- The control's bounding box clears the bottom safe-area inset.
- At 0°, 45°, and 90°: no HUD, rail, spectrum, equation, or explanatory text
  intersects the Sun, beam, or observer box. Overlap *between* atmospheric
  layers is by design and is not a collision.
- Layout survives mobile browser-chrome resize — use `dvh`/`svh` and
  `env(safe-area-inset-*)`, not naive `100vh` alone.
- At 320 CSS pixels wide, every heading, equation, control, and action remains
  available in a single-column reading path without two-dimensional scrolling.

Judged at review: that the phone composition reads as deliberate rather than
as a form, and that the title stays compact.

Overflow checks are evaluated at the normal marking zoom level (100%), plus the
320px reflow case.
Do not reach for a global `overflow: hidden` to make them pass — that hides
a broken layout instead of fixing it, and it would also mask real overflow
from a marker.

### State comparison acceptance

In the production build, comparing 10° and 80° must visibly show:

- Sun vertical displacement of at least 30% of the stage's height
- the path's rendered length at 10° is at least 1.5× its length at 80° —
  binding, not aspirational, measured on the path element
- stronger or more extensive blue scattering at 10° (more marks, or the same
  marks at higher opacity — either counts, as long as it's visible and
  deterministic)
- warmer transmitted light at 10°
- a pale warm / near-white Sun at 80°
- different human-readable explanation text
- no green-dominant Sun or sky at any elevation (already covered by
  `spec/sun-colour.test.ts`)
- every one of those outcomes derived from the same elevation state

The 1.5× figure is a legibility floor — enough that the difference is
unmistakable on screen. It is deliberately far below the real air-mass ratio
and is not offered as a physical quantity.

### What automated tests can and cannot settle

The responsive suite therefore checks stable region ownership and accessible
content, not exact CSS strings. A real-browser matrix owns widths, heights,
overlap, overflow, state-preserving resize, and screenshots. A test that merely
finds a media query or one hard-coded width is not evidence of responsiveness.
jsdom cannot judge visual quality, layout, or animation. Pure derivation
maths and semantic DOM structure belong in automated tests; composition,
motion, and perceived quality require production-browser evidence. A source
or built-HTML check is never presented as proof of rendered behaviour.

### Architecture replacement — 2026-08-19

The region-shell rescue above improved overflow but failed the more important
visual test. Screenshots at phone, portrait, near-square, and desktop aspect
ratios showed three structural defects: the 90° Sun-to-receiver route left the
useful frame, narrative copy still collided with the illustration, and the
three equations were technically present but effectively absent behind a
collapsed disclosure. These findings supersede the earlier HTML-geometry and
progressive-disclosure decisions wherever they conflict with this section.

#### Chosen structure

1. **Simulation pane.** One inline SVG, `data-testid="optical-bench"`, owns all
   physical geometry in a `0 0 1200 720` coordinate system. It uses
   `preserveAspectRatio="xMidYMid meet"`, so the complete model remains visible
   instead of being cropped at extreme aspect ratios. The existing elevation
   state drives SVG transforms, lengths, opacity, and colour.
2. **Instrument control.** The one labelled native range and its value sit
   directly below the SVG. They remain the only physics input and keep pointer,
   touch, and keyboard parity.
3. **Reading pane.** The current explanation, arrival spectrum, qualitative
   limitation, horizon conclusion, and three-equation causal chain live in
   normal semantic flow. The equations are open by default because they are
   part of the answer, not secondary documentation.
4. **Privacy coda.** The existing named aperture trigger and local-only coda
   remain. Their privacy boundary and ephemeral behaviour do not change.

No new package is approved for this rebuild. SVG already supplies the shared
coordinate space, responsive scaling, gradients, masks, and vector paths the
piece needs; a UI framework, Three.js, or an animation library would increase
the regression surface without addressing a missing capability.

#### Composition by available space

- At wide widths, the simulation pane is the visual anchor and the reading pane
  is a bounded companion column. Neither overlays the other.
- At tablet and portrait widths, simulation, control, explanation, spectrum,
  and equations follow one intentional vertical reading order.
- At phone widths, the SVG keeps a stable aspect ratio, headings stay compact,
  equations wrap inside their own blocks, and all scientific content remains
  available. Vertical scroll is expected; horizontal reading scroll is not.
- Breakpoints only change the page grid. They never change physics coordinates,
  duplicate the range, or move content into the SVG.

#### Test and review gates

- Built DOM: one `scene`, one `simulation-pane`, one `explanation-pane`, one
  labelled range, one SVG optical bench with the fixed viewBox, and three
  always-visible equations outside any `details` or hidden ancestor.
- Model: existing air-mass, spectral ordering, colour, explanation, horizon,
  motion, and coda tests remain green.
- Browser: inspect 320×568, 390×844, 768×1024, 1024×768, 1366×768,
  1600×1180, 1920×1080, and 2560×1440 at 0°, 45°, and 90°. The SVG, range,
  explanation, and equations must be visible/reachable; no title or label may
  overlap the physical route; no horizontal overflow; no app console errors.
- Interaction: pointer, keyboard, and touch update the same SVG scene and
  readouts; resize preserves elevation; reduced motion shows the same final
  state without travel effects; coda open/erase/return still works.

#### Focused implementation sequence

1. Add a structural spec for the optical bench and visible equations; record
   its narrow RED result without committing a broken branch.
2. Replace the Sun composition and its layout CSS while preserving the pure
   physics API and privacy-coda DOM hooks. Return the structural spec and full
   suite to GREEN.
3. Run the production-browser matrix and review screenshots. Fix relationships,
   not individual device coordinates.
4. Commit the verified architecture and any reviewer correction as focused
   local milestones. Do not push without separate approval.

### Production-browser evidence required before accepting visual work

- `pnpm check` green
- production build served and previewed at the real GitHub Pages base path
- screenshots at 1920×1080 and 390×844, at both 10° and 80°
- measured scene bounding boxes and overflow results
- pointer, touch, and keyboard verification
- resize mid-use with state preserved
- reduced-motion verification
- cold-load verification under throttling: with the cache disabled, the
  stage, the control, and a correct initial explanation matching the
  control's initial value are all present and correct before any script
  runs — because the initial state is server-rendered, this must hold even
  if the script never executes
- no application-owned console errors or broken requests. There is no
  performance sensor in this repo, so "does not cost performance" is a
  judgement made at review against the motion rules above, not a measured
  budget — don't report it as a measured pass
- one read-only adversarial visual/accessibility review

### Responsive architecture correction — 2026-08-18

The post-deployment audit found that the previous checks reported zero box
collisions while the screenshots still showed broken hierarchy, tiny science
copy, and layouts that stretched or compressed badly. The sensor had sampled
the wrong relationships. This correction is deliberately recorded before the
source rewrite:

15. `harness: define the adaptive region architecture`
    Done when: this region contract replaces the fixed-phone-height assumption,
    `CLAUDE.md` prevents semantic role switching, and no source file changes.
16. `refactor: rebuild the adaptive experience shell`
    Done when: a test-first region contract goes red in the working tree, the
    implementation returns it and the full suite to green, and the browser
    matrix passes 320/390/692/1024/1366/1920/2560 widths without horizontal
    overflow or cross-region collisions.
17. `fix: harden the privacy coda across composition changes`
    Done when: opening, navigating, erasing, returning, and resizing the coda
    preserve state and remain usable at phone, short-laptop, and ultrawide
    viewports. If verification finds no defect, do not manufacture this commit.

## Commit sequence — one approval gate per commit

Completed:

1. `docs: lock the A1 rebuild plan` — done, `3bab5a3`.
2. `harness: tighten A1 rules and verification` — done, `bf182b1`.
3. `spec: state the Assignment 1 sun-elevation contract as a failing test` —
   done, `24833be`; the one allowed deliberately-red commit.
4. `feat: the explainer, drivable and green against its own spec` — done,
   `d4a29d7`; functional baseline, colour regression fixed, full suite green.

Remaining:

5. `harness: require a full-screen atmospheric microgame`
   Done when: this plan and `CLAUDE.md` carry the visual contract, suite
   still green, no source touched.
6. `feat: compose the full-screen atmospheric stage`
   Done when: the desktop and phone acceptance criteria above are met in a
   real browser, with measured bounding boxes.
7. `feat: visualise atmospheric path and scattering`
   Done when: path highlight, deterministic scattering marks, and warmer
   transmitted light all derive from elevation and differ visibly between
   10° and 80°.
8. `feat: add causal motion and the horizon reveal`
   Done when: motion satisfies the motion contract, and the reveal line
   appears at or below 8° as a state of the one mechanic, reachable by
   keyboard alone and exposed to assistive technology without chattering.
9. `content: humanise the science explanation`
   Done when: copy is accurate, plain, and within the stated scientific
   scope, with the simplified-illustration framing intact.
10. `fix: harden keyboard and reduced-motion behaviour`
    Done when: keyboard-only operation, focus visibility, touch-target
    size, and reduced-motion parity are all verified in a browser.
11. `fix: polish responsive composition and performance`
    Done when: both viewports pass with no overflow or collisions, and no
    layout-property or full-screen-filter animation remains.
12. Coda decision gate — either reject the privacy/footprint coda on the
    record, or plan it separately as its own scoped slice. Not built here.
    Done when: the decision and its reasoning are stated.
13. `docs: record process evidence and reflection`
    Done when: `PROCESS.md` and `reflections/assignment-1.md` are written
    from the real history above, and `pnpm check:evidence` passes.
14. Final preflight, deployment, and verification.
    Done when: full check green, explicit go-ahead given, live URL verified
    at both viewports.

Each checkpoint that changes tracked files gets its own focused commit. A
verification-only checkpoint that finds no required change records its
evidence without manufacturing a commit. Unrelated checkpoints are still
never combined into one commit. `PROCESS.md` is not pre-written — evidence is
preserved as the work actually happens.
