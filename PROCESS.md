# Process overview

## What I built and how I directed it

*The Sun Never Turned Red* explains why sunset light looks warm. One slider drives the Sun's position, its route through air, wavelength transmission, the received spectrum and the explanation. A hidden observer then reveals temporary signals the page can notice about the visit.

I split uncertain work into bounded roles: planning and research passes established constraints, one implementation writer owned each slice, and fresh-context subagents reviewed code or the production browser. Corrections that needed to survive the conversation became rules in `PLAN.md`, `CLAUDE.md` or automated checks.

## The moments that mattered

### 1. I separated generation from evidence

Before any Sun interface existed, I translated the brief's interaction line into a deliberately failing built-page contract: one labelled slider, a named scene and an associated explanation. The implementation pass then produced the smallest accessible interaction that made it green without weakening the test.

Browser review later found that this green implementation produced a green sky and blue-looking Sun. Instead of asking the same agent to guess nicer colours and approve its own guess, I assigned a research subagent a narrower task: use primary sources, state assumptions and stop where evidence ran out.

A separate test-first pass turned that research into a Kasten–Young air-mass oracle and relationship checks across the full slider range. Only the air-mass oracle independently reimplemented the reference equation; the other tests checked required relationships: lowering the Sun must lengthen the route, reduce transmission and remove blue faster than red. The implementation had to satisfy those checks, while browser review remained the final visual sensor.

Evidence: [24833be...d4a29d7](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/compare/24833be...d4a29d7), then [c4a3026...213964f](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/compare/c4a3026...213964f)

### 2. I stopped repairing the wrong responsive architecture

Several CSS rescue passes removed overflow, yet screenshots still showed collisions, missing equations and a slider detached from the scene on short displays. Another breakpoint would only add an exception to the same brittle structure.

I asked fresh-context architecture and renderer-review subagents to diagnose the failure and compare alternatives, including a repaired region shell, duplicated compact and desktop compositions, SVG, Canvas and heavier renderers.

This was a controlled architecture comparison, not a traffic-based A/B test. Version A preserved the HTML/CSS scene; Version B separated one SVG optical bench from semantic HTML reading content. Both faced the same viewport and interaction matrix.

The reviews showed that SVG supplied the missing shared coordinate system without adding a package or duplicating controls. I recorded that conclusion in `PLAN.md` and `CLAUDE.md`, replaced CSS-value tests with DOM-structure and projection contracts, and discarded the passing region-shell implementation.

Projection tests checked all 91 elevations. Browser agents checked both marking viewports, short laptop heights, resize mid-interaction, keyboard input and reduced motion.

Evidence: [483841c...7fbcdae](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/compare/483841c...7fbcdae), then [fbb4555...7827bad](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/compare/fbb4555...7827bad)

### 3. I constrained the agent before requesting a dramatic privacy reveal

Planning and security reviews defined a capability boundary before implementation: session memory only; no sensitive permissions, persistent identifier, typed content, analytics, storage or transmission.

Those decisions became executable backpressure instead of prompt-only advice. Negative tests inspect the shipped source for prohibited browser APIs. Browser verification checks keyboard access, reduced motion, "Erase my trace," and reload with no retained history.

A later slice expanded the reveal to five cards and practical privacy advice without changing the boundary, while a progressive-loading test confirmed that the science lesson exists in the initial HTML. The agent could maximise drama, but could not quietly turn the warning into real tracking.

Evidence: [7e9ee5e...58d0471](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/compare/7e9ee5e...58d0471), then [81b1158](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/81b1158)
