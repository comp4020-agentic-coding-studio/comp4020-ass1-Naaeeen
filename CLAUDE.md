# COMP4020 prototype

This is your starter repo for a COMP4020 prototype: a static site written in
HTML/CSS/TypeScript that builds to plain HTML/CSS/JS and deploys to GitHub
Pages. The **deployed site is what gets marked** --- not this repo, and not "it
works on my machine". It's marked live in Chrome against the deployed URL at two
viewports --- 1920×1080 (desktop) and 390×844 (phone) --- and both count in
full, so make that artefact good at both and use the checks below to know
whether it is.

What you're building this week — the spec — is published on the course website,
and this repo's name tells you which deliverable it is. Run the course plugin's
**start** skill at the start of each week: it pulls the right spec from the
course API, carries your harness forward from last week, and helps you turn the
spec's checkable lines into tests of your own. Read the spec before you build,
and see `spec/README.md` for how the checks in this repo relate to it.

## How to work in here

- Keep the dev server running (`pnpm dev`) so you see changes as you make them.
- Before you push, run `pnpm check`. It runs most of what CI runs --- build,
  lint, and the spec --- so you catch those in seconds instead of waiting for
  the pipeline. The links check, the evidence check, the secrets scan, and the
  deploy itself only run in CI; to run the links check locally, matching
  `.github/workflows/checks.yml`, serve the build with `pnpm preview` and crawl
  the configured GitHub Pages base-path URL
  (`pnpm dlx linkinator http://localhost:4321/comp4020-ass1-Naaeeen/ --recurse --silent`,
  the same flags CI uses --- don't add `--status-code` overrides, or a link
  that warns locally still fails the pipeline) rather than pointing linkinator
  at `./dist` directly, since a root-relative crawl won't reproduce
  base-path-only link breakage.
- To see what the page actually looks like rather than what you assume it looks
  like, open it in a browser (the `agent-browser` CLI, documented on
  [the course site](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/backpressure/#agent-browser-the-rendered-page-as-ground-truth),
  works well for this). The rendered page is the truth; your mental model of it
  isn't. Dev-server behaviour doesn't count as verified: for a major UI slice,
  check the production build (`pnpm build && pnpm preview`) against the
  acceptance and evidence lists in `PLAN.md`'s visual-direction contract
  before calling it done. If this session has no browser tooling, stop and
  report the verification gap --- never claim a UI slice is done unseen.
- When a check fails, read its output before changing anything. Each check below
  names what it measures, and the failure message is the instruction: it tells
  you the file, the line, or the contract. Treat a red check as authoritative
  --- the page is wrong until the check is green, not until you decide it should
  be.
- Commit when the checks pass. Never commit an unexpectedly red state --- the
  one documented exception is a deliberately red spec-first commit (a new
  `spec/*.test.ts` failing narrowly because the feature it describes doesn't
  exist yet), with the next commit --- once approved --- being the smallest
  implementation that returns the complete suite to green. Never weaken,
  delete, or edit a test to make it pass --- fix the implementation instead.

## The checks (your sensors)

CI runs these on every push once your repo is public. GitHub's checks UI shows
two jobs, `check` and `deploy` --- not one status per sensor below --- and
within `check` the steps run in sequence (`pnpm check` chains typecheck, build,
lint, and the spec with `&&`), so an early failure like a broken build stops the
later sensors from running for that push; fix it and push again to see the rest.
While the repo is private (all week, until you ship) the CI jobs stay skipped
--- `pnpm check` is the same roster on your machine, and it's the faster loop
anyway. They aren't hoops. Each is a different way of finding out something true
about the site that you can't reliably see by looking at it.

They also carry a mark at a crit: the sweep runs fifteen minutes after your
cutoff, and green checks there are worth half that week's shipped mark. Still
running counts as not green, so ship with time for CI to finish.

- **typecheck** --- `astro check` runs first in `pnpm check`, so a type error
  stops the roster before the build even starts. The types are extra
  backpressure: a red here is the compiler telling you a claim in the code is
  false.
- **build** --- the site must build (`pnpm build`). A build failure means the
  deployed site is broken or stale, so nothing else matters until this is green.
- **deploy / online** --- the live GitHub Pages URL must load and return the
  page you expect. An asset that 404s on the deployed URL counts as broken even
  if it loads locally.
- **spec** --- `spec/invariants.test.ts` asserts what's true of any good
  website, whatever the week's brief asks; the tests you write for the week's
  own spec run alongside it (any `spec/*.test.ts`). A failure names the contract
  you haven't met yet.
- **lint** --- `stylelint` for CSS, `oxlint` for TypeScript. Flags code that's
  wrong, fragile, or non-idiomatic. Read the rule it names.
- **tests** --- any other tests you write, wherever you put them (co-located
  with your source is fine, not just `spec/`), must pass. Vitest picks up both
  this and the spec suite in one `vitest run`, the last step of `pnpm check`. A
  failing test is a claim about the site that's no longer true.
- **evidence** (`pnpm check:evidence`) --- checks your process evidence:
  `PROCESS.md`'s citations resolve to real commits, the current deliverable's
  exact reflection is in `reflections/` (worked out from this repo's name
  against the public course API), and your `CLAUDE.md` is present. Evidence
  gates the deploy --- `deploy` needs `check` to pass, so failing evidence
  blocks the deploy alongside everything else. See
  [Your process is part of the mark](#your-process-is-part-of-the-mark) below,
  and the course website's
  [assessment page](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/assessment/#what-you-submit)
  for what counts as evidence.
- **links** --- internal links must resolve. A broken link is a dead end you
  didn't mean to ship.
- **secrets** --- the repo is scanned for committed credentials. Never put a
  key, token, or password in a tracked file. If one leaks, rotate it. A local
  pre-commit hook (`.githooks/pre-commit`, installed by `pnpm install`) also
  blocks any commit containing something shaped like an API key --- by the time
  CI sees a key it's already pushed, so the hook is the sensor that matters.

Nothing here measures **accessibility** or **performance** --- wiring those
sensors (`axe-core`, Lighthouse, or whatever you choose) is your work, and later
in the course the spec will ask you to show how you tested both. When you do,
read a green performance result honestly: it's a lab estimate from one run on a
CI machine, not proof the site is fast for real users.

## The stack is swappable

This repo currently uses Astro in static-output mode (the starter template
originally shipped plain HTML/CSS/TypeScript on Vite; this repo has moved off
that). That's a default, not a rule (unless the week's spec says otherwise).
You can swap to a different static generator, because nothing in CI names a
tool --- the whole contract is:

- `pnpm build` emits the complete site into `dist/`
- the `package.json` scripts (`check`, `check:evidence`, `build`) keep working
- whatever lands in `dist/` still passes the invariants in `spec/`

Two things bite in a swap. The deployed site lives under a path
(`…github.io/<repo>/`), so configure your generator's base path --- this
template's Vite config uses relative asset URLs to sidestep that, but most
generators (Astro included) need `base` set explicitly, and getting it wrong
looks fine locally while every asset 404s on the live URL. And commit the
updated `pnpm-lock.yaml`: CI installs with `--frozen-lockfile`.

## Your process is part of the mark

The deployed page is only half of it. How you got there is marked too: your
commit history, your agent files, and the decisions visible across them. The
checks above can't see any of that, so a person reads it directly --- which
means building legibly is part of building well.

- **Commit as you go, at real logical checkpoints** --- not artificial
  file-count splits. Small, frequent commits are the record of how the work
  came together, and that record is read, not just the final state. A trail that
  grew alongside the code is the strongest evidence of your process; a single
  dump the night before is the weakest.
- **Keep a process overview** (`PROCESS.md`). A short reading-guide, not an
  essay: what you built, the moments that mattered --- each pointing at a
  commit, a `CLAUDE.md` change, or a prompt and the commit it produced --- and
  where to look in the history. It points a marker at the evidence; it doesn't
  stand in for it, and claims the history doesn't back don't count. The
  `PROCESS.md` in this repo is a template showing the shape and the citation
  format (link text the commit hash or range, target the commit or compare URL);
  `pnpm check:evidence` verifies your citations resolve to real commits before
  you ship. Markers follow those citations and don't trawl the repo for evidence
  you didn't cite.
- **Write your reflection in `reflections/`** --- a short markdown file in this
  repo, named for the deliverable it answers, so the number in the filename is
  the number in this repo's name (`crit-1.md` in `comp4020-crit1-<you>`,
  `assignment-1.md` in `comp4020-ass1-<you>`); `reflections/README.md` has the
  full rule. `pnpm check:evidence` checks the exact current name against the
  course API, not merely the presence of any well-named file. It answers the two
  standing prompts: the breakthrough that moved the work forward, and what this
  work changed about the developer you want to be. It stays out of the deployed
  site. It's due at the cutoff, and if it isn't in the repo by then the week
  doesn't count as shipped, however good the prototype is.
- **This file is process evidence.** The harness you build to direct the agent,
  this `CLAUDE.md` and any `AGENTS.md`, is itself read as part of how you
  worked. Keep it honest and current (see below).

You don't need a name, a student number, or any identity file in the repo: we
know whose repo it is. Spend the effort on the work.

## This file is yours

This CLAUDE.md is a starting point, not a fixed rulebook. As you learn what your
prototype needs --- a convention to hold the agent to, a sensor that keeps
catching you out, a fact about the stack the agent keeps getting wrong --- write
it down here. Growing this file is the work of harness engineering, and the gap
between this boilerplate and your own version is part of what your prototype
says about the developer you're becoming.

## Carried forward from Crit 1

General conventions that held up last week, kept regardless of this week's
stack or brief:

- Every page uses consistent semantic navigation and exactly one `<h1>`.
- Run `pnpm check` before accepting implementation changes.
- Avoid remote fonts and unnecessary external assets.

## This cycle's rebuild (Assignment 1)

- `PLAN.md` is the source of truth for this rebuild's scope and its
  single-physics-mechanic decision --- including that the core explainer works
  with zero permissions granted and the now-approved session-trace coda stays
  a local-only, same-document reveal. If a prompt or a proposed feature
  conflicts with this, stop and surface the conflict --- don't silently
  resolve it either way. The detailed visual contract lives there too, not
  here; this file carries only the standing rules.
- The artefact is a full-screen atmospheric explainer, not a small form or
  card page.
- The atmosphere field is reserved for the scene itself. The spectrum readout
  and the three-step science model belong to the rail's instrument deck,
  stacking on narrow screens and docking to the rail on wide ones; don't float
  them as independent absolute panels over the sky.
- No new mechanic, permission, or heavy rendering dependency (Canvas, WebGL,
  a 3D or animation library) without an explicit scope or architecture gate
  first --- never as an incidental addition mid-slice.
- The coda may observe only the ephemeral signals listed in `PLAN.md`. Never
  add storage, analytics, a fingerprint identifier, raw pointer coordinates,
  typed content, network submission, or a real sensitive permission request.
  `Erase this trace` must clear the in-memory summary and return to the Sun.
- "Hidden" means an easter egg in the visual hierarchy, not inaccessible:
  the aperture trigger remains a named native button with keyboard access and
  a visible focus state. The transition must be finite and interruptible, and
  reduced motion must reach the identical information without particle travel.
- Visual acceptance needs measured boxes and screenshots from the production
  build, not a source reading. Both marking viewports (1920×1080, 390×844),
  the 320px reflow floor, a short laptop, and an ultrawide stress case are
  blocking checks. Resize mid-use must preserve the current elevation and
  coda state; keyboard, coarse-pointer, and reduced-motion paths must retain
  the same information.
- If a responsive/layout bug appears in a major UI slice, do not start by
  nudging isolated top/right/width values. First inspect the production build
  in a real browser, name the colliding regions, and decide whether the failure
  is structural. If narrative blocks and illustration geometry are fighting for
  the same absolute-positioned space, fix the structure before polishing the
  art.
- For this repo specifically, absolute positioning is reserved for the physical
  illustration layer. The page has stable scene, HUD, and rail regions; an
  element may not change semantic/layout role at a breakpoint (for example, a
  rail child must not be teleported into the sky with `position: absolute`).
  Narrative text, equations, spectrum, control, and explanation use bounded
  grid/flex flow and may not compete with the Sun/beam collision domain.
- Breakpoints are content-driven and only rearrange whole regions. Use media
  queries for macro composition and container queries for local typography or
  panel treatment. Do not accumulate isolated coordinate fixes per device.
- The desktop scene may be a one-viewport composition. The compact layout is
  allowed to scroll vertically: preserve an intentional reading order and put
  deeper physics after the core scene/control instead of shrinking every item
  to force the whole lesson into `100dvh`. Horizontal reading scroll remains a
  blocking failure.
- Responsive tests assert semantic region ownership and visitor-visible browser
  relationships. Do not lock exact CSS declarations or breakpoint literals
  with regexes; those tests reward patch accumulation while missing a broken
  composition.
- After a resume, a compaction, or any context loss, re-read `PLAN.md`,
  `git status`, and recent `git log` before acting. Never reconstruct a lost
  instruction from memory --- ask instead.
- One main writer per implementation slice. Subagents may investigate or
  review independently, but must not make parallel, overlapping edits.
- Write tests for the visitor-visible contract: what the visitor does, and
  what visibly changes in response --- not an assumed internal function or
  API shape.
- A report isn't done until it says what's verified, what failed, and what's
  still unverified, not just what was attempted. A commit hash labelled
  "full" is the complete 40-character value from `git rev-parse`, not a
  short form.
- Don't pre-write `PROCESS.md` moments before the commit that earns them
  exists.
