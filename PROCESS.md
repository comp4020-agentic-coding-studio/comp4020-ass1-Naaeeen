# Process overview

## What I built

*The Sun Never Turned Red* is a static interactive explainer about atmospheric scattering. One elevation control drives the Sun's position, the length of its route through the atmosphere, the spectrum that survives, and the plain-language explanation beside it. Pressing the observer opens a local-only privacy coda: five cards reveal what an ordinary page can infer from this visit without requesting sensitive permissions or sending data away.

## The moments that mattered

### 1. I turned the brief into a harness before asking for polish

The tempting start was "make me a beautiful sunset simulation." I did not do that first. I split the work into separate passes: one fixed scope in `PLAN.md`, one hardened `CLAUDE.md`, and one wrote the first failing contract from the brief. That contract only asked whether the page had one real control, one scene, and one changing output. Later implementation passes could change style, but they still had to satisfy that external contract. I knew this was honest because the contract failed while the page still had no real interaction, then passed unchanged once the slider and live output existed.

Evidence: [3bab5a3](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/3bab5a3), [bf182b1](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/bf182b1), [24833be](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/24833be), [d4a29d7](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/d4a29d7)

### 2. I stopped tuning plausible colour and switched to a model that could reject itself

An early build passed its original checks and still showed a green sky and a blue-looking Sun. More prompting for realistic colour would only have made the same weak model prettier. Instead, I separated responsibilities. A bounded research pass gathered the physics. A different pass wrote tests from that research instead of reusing the implementation formulas. The new model linked elevation to Kasten-Young relative air mass, Rayleigh scattering, and transmission. Its tests checked relationships the code could fail: lower elevation means more air mass, less transmission, and faster loss of short wavelengths. I accepted the result only when the old behaviour failed those checks and the new one passed both tests and browser states.

Evidence: [c4a3026](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/c4a3026), [213964f](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/213964f)

### 3. I stopped patching the wrong layout and rebuilt the presentation architecture

Several responsive patches removed one overflow case at a time, but screenshots still showed collisions, detached controls, and missing explanation on other screens. That was evidence that the architecture was brittle, not that I needed one more breakpoint. I used fresh-context reviews to inspect the failures, compared keeping the overlay approach against rebuilding around one coordinate system, and wrote the replacement acceptance conditions before editing. The result was a full swap: the atmospheric bench moved into one bounded `1200 x 720` SVG, while controls, equations and explanations returned to normal document flow. I accepted the rebuild when projection tests covered 0 to 90 degrees and browser checks kept interaction plus explanation visible together.

Evidence: [fbb4555](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/fbb4555), [80a268f](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/80a268f), [ecfae69](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/ecfae69), [7827bad](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/7827bad)

### 4. I defined what the privacy reveal was not allowed to do before I made it dramatic

The privacy coda could have been louder if it had requested real permissions or stored a fingerprint. That would also have undermined the point. Before implementation, I wrote a capability boundary: no camera, microphone, location, notifications, storage, analytics, fingerprint identifier, network submission, typed content or raw pointer coordinates. Only after that boundary existed did I build the reveal. The five cards therefore come from local, ephemeral session observations rather than harvested personal data. I knew this stayed honest because negative tests search for forbidden APIs and browser checks confirm that erase and reload remove the trace completely.

Evidence: [7e9ee5e](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/7e9ee5e), [58d0471](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/58d0471), [273868e](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/273868e)
