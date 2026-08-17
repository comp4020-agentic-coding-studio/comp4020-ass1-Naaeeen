# Process overview

## What I built

*The Sun Never Turned Red* is a single-page interactive explainer about why sunsets look warm. The visitor moves one Sun-elevation slider; that value changes the Sun’s position, the length of its path through the atmosphere, which wavelengths survive, the colour reaching the observer, and the explanation on screen. It is a static client-side build, usable by mouse, touch and keyboard. A local-only coda turns the observer around and shows what this visit exposed without requesting permissions, saving data or contacting a server.

## The moments that mattered

### 1. I turned “this feels like a form” into rules the agent could not ignore

The first working version was a small 640 × 226 illustration surrounded by empty space. Asking the agent to “make it prettier” would have produced another subjective retry. I changed the harness instead. `PLAN.md` and `CLAUDE.md` began requiring a viewport-scale stage, separately named atmosphere and control regions, minimum desktop and phone proportions, overflow tolerances, a 44-pixel control target, and a rule that visual work could not be accepted unseen. A structural test checked that the pieces and their accessible roles existed, but deliberately did not pretend to measure layout. I accepted the new composition only after checking the production build at 1920 × 1080 and 390 × 844 for size, overflow, collisions, keyboard/touch behaviour and reduced motion.

Evidence: [bf134ca](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/bf134cabe528d45f1491682eec8f246ef31c170f) and [937e09b](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/937e09b005647aafcba7ac5ca4e7a977291cb6fd).

### 2. I stopped the agent from making the physics look convincing before it was defensible

An early colour rule rotated around the HSL colour wheel. Halfway through the slider it produced a green sky, and near the top it could make the Sun blue. Instead of requesting another plausible adjustment, I stopped implementation and gave a research agent a narrower job: use primary sources, compare atmospheric models, state every assumption and limitation, and leave gaps unresolved rather than inventing an answer. That led to the Kasten–Young approximation for relative air mass and a wavelength-dependent transmission model.

A separate implementation pass then worked against tests it could not weaken. The test calculates the reference air-mass curve independently rather than importing the function it judges. It also checks relationships across every slider degree: lowering the Sun must increase air mass, reduce transmission and make the received beam warmer. This is closer to metamorphic testing than screenshot matching: when no exact colour is available as an oracle, the test checks how outputs must change together. Finally, the page defines its symbols and states that the equations are physical approximations while the displayed colour is illustrative, not calibrated.

Evidence: [d4a29d7](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/d4a29d7b4d1e80b5ca33b779bfcc3e9695d7cef1), [c4a3026](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/c4a3026b6e7bac9a4cc919ac4b27d661a5906ed8) and [213964f](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/213964f09d1e4b34a475535bf2ceba2045faf5d8).

### 3. I constrained the privacy reveal before allowing the agent to build it

The dramatic option was to request camera, location or notification access and make the reveal feel more personal. That would have turned a teaching moment into real data collection. Before implementation, I added a capability boundary to `PLAN.md` and `CLAUDE.md`: no sensitive permissions, storage, cookies, analytics, fingerprint identifier, typed content or network submission. The observer aperture became an accessible gateway into four cards built only from ephemeral session facts such as elapsed time, slider use, viewport and display preferences. A negative test searches the source for forbidden browser APIs, while the visible erase action resets the in-memory summary. Reloading removes it as well. The constraint therefore survives later prompts instead of depending on the agent remembering a conversation.

Evidence: [7e9ee5](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/7e9ee5e2f92bf363d4ba04f2b0013fd11dc081c9) and [58d0471](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Naaeeen/commit/58d0471be421725217cec1e6cb845d7729b9e76e).
