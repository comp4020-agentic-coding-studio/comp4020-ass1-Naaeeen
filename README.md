# COMP4020 static prototype template

A starter template for static-site prototypes in **COMP4020 / COMP8020 Agentic
Coding Studio**. The course provisions a repo from this template for each
deliverable --- you don't create it yourself. The `start` course skill clones it
for you; from there, build your prototype and deploy it to GitHub Pages.

## CI and Pages only turn on when you ship

Your repo starts private, and both CI jobs (`check` and `deploy`) are gated on
it being public. While private, a push to `main` runs nothing in CI ---
`pnpm check` (below) is your feedback loop until then. When you're ready, the
course's `/ship` skill flips the repo public, turns on GitHub Pages, and
dispatches the deploy for you; there's nothing to configure in the Pages
settings yourself. From that point, every push to `main` builds and deploys, and
the deploy step prints your live URL and checks it returns 200.

## What gets marked

The deployed site is the deliverable, assessed live in Chrome at two fixed
viewports --- see the course website's
[assessment page](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/assessment/#marking-environment)
for the details.

## Quick start

```sh
mise install       # supported path: install the template's Node and pnpm
pnpm install
pnpm dev        # local dev server
pnpm check      # most of what CI runs (links, secrets, evidence and deploy are CI-only)
pnpm build      # produce dist/ (what gets deployed)
pnpm preview    # serve dist/ under the Pages base path
# reproduce CI's links check before you push (against the running preview):
pnpm dlx linkinator http://localhost:4321/comp4020-ass1-Naaeeen/ --recurse --silent
```

`mise` is the course's recommended runtime manager. If you use another manager
or the official installers, that is fine: provide the Node and pnpm versions in
`mise.toml`, then run the same commands. Tutor support reproduces runtime
problems with mise.

## What's here

- `src/pages/`, `src/layouts/`, `src/styles/global.css`, `src/scripts/main.ts`
  --- a minimal starting site. Replace it.
- `astro.config.ts` --- the Pages `base` path. Getting this wrong looks fine
  locally and 404s every asset on the live URL.
- `mise.toml` --- the tested Node and pnpm versions for this template.
- `spec/` --- what the checks are for (`README.md`), the shipped invariants
  (`invariants.test.ts`), and a replaceable starter test (`starter.test.ts`);
  your own spec tests live alongside them.
- `CLAUDE.md` --- orients your coding agent: what the checks mean and how to
  work here. Yours to grow.
- `PROCESS.md` --- a template for your process overview, showing the
  cited-moment format. Replace it with your own; `pnpm check:evidence` verifies
  your citations resolve.
- `.github/workflows/checks.yml` --- the CI sensors that run on every push once
  your repo is public, and the GitHub Pages deploy.
- `.githooks/pre-commit` --- blocks any commit that contains something shaped
  like an API key, so your COMP4020 key can't end up in a public repo. Installed
  automatically by `pnpm install`.

The template is SSG-agnostic --- it ships as plain HTML/CSS/TypeScript on Vite,
and nothing in CI names a tool, so a static generator can be swapped in without
changing how it deploys. **This repo has been converted to Astro** (static
output, course default from C2). TypeScript is the course default over plain
JavaScript: the types are extra backpressure, and your agent feels it before
you do.

See the course site for how the checks map to each week of the course.
