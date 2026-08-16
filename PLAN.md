# PLAN — The Sun Never Turned Red

## Thesis

Lowering the Sun increases the atmospheric path length, which removes more
short-wavelength light from the direct beam, which changes what the visitor
sees and how it's explained — one physical cause, one visible effect.

## Core interaction

The visitor drags, touches, or keys one control (a native range input) to
set the Sun's elevation. Pointer drag, touch drag, and keyboard arrows are
equivalent ways of operating the same control — none is a second mechanic.

## Canonical state

One number, Sun elevation (0–1), is the only source of truth. It drives, in
lockstep, from that single value:

- the rendered scene (Sun position, sky)
- the atmospheric path-length representation
- the arriving-light spectrum shown to the visitor
- the explanation text

No output updates independently of that one state.

## Scientific scope and limitations

Models Rayleigh scattering at a level appropriate for a one-page explainer:
lower elevation → longer path length → more short-wavelength light
scattered out of the direct beam → redder/dimmer direct light. This is a
single-variable illustrative model (elevation → path length → spectrum),
not a radiative-transfer simulation — it does not model aerosols,
pollution, humidity, cloud, or real geographic/atmospheric data. The
explanation text must not claim more precision than the model has.

## Fixed non-goals (this cycle)

- No camera, microphone, notifications, or device-orientation access.
- No geolocation (deferred, not attempted).
- No backend, accounts, analytics, persistence, or cookies.
- No server-side data flow of any kind.
- No second interactive mechanic — every feature answers to the one
  canonical elevation state above, or it doesn't ship.
- The core lesson works completely with zero permissions granted.

## Optional-coda decision gate

A footprint/reveal coda (a bounded, in-memory `sunPath` trace of the
session) is deferred to a late decision gate, judged only once the core
above is built and verified in a browser. Build it if, and only if, it
still serves the one thesis above. If built: in-memory only, cleared on
refresh or an explicit reset, no persistence/upload/transmission, and
derived summaries (duration, range, direction) computed from the samples
at reveal time, not stored as separate fields. If it doesn't clearly serve
the thesis, it's recorded as deliberately discarded, not shipped.

## Commit sequence — one approval gate per commit

1. `docs: lock the A1 rebuild plan` — this file.
   Done when: committed, `pnpm check` green, tree clean.
2. `harness: add rebuild safeguards for context loss, verification, and test integrity` —
   minimal `CLAUDE.md` additions.
   Done when: committed, `pnpm check` unaffected and green.
3. `spec: state the Assignment 1 sun-elevation contract as a failing test` —
   the one documented red commit: one new spec file asserting the built page
   exposes the control and its outputs, and that operating the control
   changes them.
   Done when: committed with *only* that test failing, for the expected
   reason (feature doesn't exist yet) — everything else green.
4. `feat: the explainer, drivable and green against its own spec` — smallest
   vertical slice: one elevation state, the range control, pointer/touch
   reading into it, path/spectrum/explanation all driven by it.
   Done when: full `pnpm check` green, including checkpoint 3's test, and
   `pnpm preview` visibly shows the control driving all three outputs.
5. `content: sharpen the scattering explanation and visual mapping` —
   improve accuracy/clarity of copy and visuals, no new mechanic.
   Done when: `pnpm check` green, no second mechanic introduced.
6. `fix: <specific bug>` — zero or more, only for real findings from
   production-browser verification (see below).
   Done when: each named bug is fixed with `pnpm check` green after; if
   nothing needs fixing, no commit, just a recorded pass.
7. Coda gate — either two commits (`spec: state the session-trace coda
   contract as a failing test`, then `feat: add the gated, in-memory
   session-trace coda`) if accepted, or no commit if discarded.
   Done when: the judgement is stated and, if accepted, both commits land
   with `pnpm check` green at the end.
8. `docs: write PROCESS.md from the rebuild history, and the assignment-1 reflection` —
   from the real commits above only.
   Done when: `pnpm check:evidence` and `pnpm check` both green.
9. Ship — not a commit; `/ship` flips visibility and deploys.
   Done when: full check + evidence green, explicit go-ahead given, live
   URL verified at both viewports.

## Production-browser verification conditions

Before any commit claims a UI change is done: build and serve with
`pnpm build && pnpm preview` (not the dev server), open in real Chrome, and
confirm at exactly 1920×1080 and exactly 390×844: keyboard-only operation
works, pointer-drag and touch-drag both match the range control's value,
resizing mid-interaction doesn't break state, `prefers-reduced-motion` is
respected, and the console has no errors. If browser tooling isn't
available in a session, that session stops and reports the gap instead of
claiming the UI is done.
