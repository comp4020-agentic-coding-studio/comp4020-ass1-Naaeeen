# Process overview

## What I built

*The Sun Never Turned Red* is a static interactive explainer about atmospheric scattering. One elevation control drives the Sun's position, the length of its route through the atmosphere, the spectrum that survives, and the plain-language explanation beside it. Pressing the observer opens a local-only privacy coda: five cards reveal what an ordinary page can infer from this visit without requesting sensitive permissions or sending data away.

## The moments that mattered

### 1. I made the agent work against a contract before asking it to build

The obvious start was a broad prompt for a polished sunset simulation. Instead, I first separated the brief, plan, harness and tests. `PLAN.md` fixed one mechanic, explicit non-goals and small approval checkpoints. `CLAUDE.md` then required production-build verification, prohibited weakening a test to make it pass, and allowed one documented red commit followed by the smallest green implementation. I converted the brief's interaction requirement into a deliberately failing DOM contract before any Sun interface existed. This gave later agents something durable to obey after context changes. I knew the sequence was honest because the contract failed for the missing control, then passed without being edited when the accessible slider and changing output were implemented.

Evidence: [3bab5a3](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/3bab5a3), [bf182b1](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/bf182b1), [24833be](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/24833be), [d4a29d7](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/d4a29d7)

### 2. I replaced plausible colour with a model that could prove itself wrong

An early version moved correctly but produced a green sky and a blue-looking Sun. Rather than tune colours until one screenshot looked believable, I paused implementation and separated physics research from coding. The new model linked elevation to Kasten-Young relative air mass, wavelength-dependent Rayleigh scattering and transmission. Its air-mass test independently reimplemented the reference equation; other tests checked physical relationships across every degree, such as air mass increasing toward the horizon and shorter wavelengths being removed more strongly. I accepted the result only after those checks and representative production-browser states agreed, while the interface clearly labelled the model qualitative rather than calibrated.

Evidence: [c4a3026](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/c4a3026), [213964f](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/213964f)

### 3. I stopped repairing the wrong layout and replaced its architecture

Several responsive CSS fixes removed overflow but screenshots still showed collisions, missing equations and controls detached from the scene. Another breakpoint would only protect the same brittle arrangement. I used fresh-context reviews to identify competing absolute-positioned collision domains, compared alternative structures, and recorded a replacement contract before editing. The old HTML-overlay scene was then discarded: all physical geometry moved into one bounded `1200 x 720` SVG coordinate system, while controls, equations and explanations returned to semantic document flow. Projection tests checked every elevation from 0 to 90 degrees, and browser checks covered resizing, short screens and phone/desktop layouts. I accepted the rebuild when geometry stayed bounded, equations remained available, and the elevation survived a resize.

Evidence: [fbb4555](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/fbb4555), [80a268f](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/80a268f), [ecfae69](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/ecfae69), [7827bad](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/7827bad)

### 4. I constrained the privacy reveal before allowing it to become dramatic

A real permission request or fingerprint would have made the coda more theatrical but would contradict its point. Before implementation, I added a capability boundary: no camera, microphone, location, notifications, storage, analytics, fingerprint identifier, network submission, typed content or raw pointer coordinates. The implementation stayed inside that box and built five cards from ephemeral browser and session observations. Negative tests search for the forbidden APIs, while browser checks confirm that erase and reload clear the trace. This made the surprise stronger without making the page itself a privacy trap.

Evidence: [7e9ee5e](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/7e9ee5e), [58d0471](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/58d0471), [273868e](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/273868e)
