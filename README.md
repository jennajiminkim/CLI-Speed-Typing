# CLI Speed Typing — UI revision v1.1

Existing private playtest, revised 2026-11-05. This is not a server-verified Daily Challenge.

## Implemented
- Reference-based 70/30 topology lobby, isometric reusable SVG devices, Light/Night composition.
- Fixed SCORE / ACCURACY / COMBO / JUDGMENT HUD; READY, PERFECT, GOOD, ERROR.
- Error state temporarily overrides last completed judgment. Correcting an error restores the last completed judgment; typo history remains for GOOD eligibility.
- PERFECT increases combo. GOOD resets combo. Exact Enter only advances.
- 3-second countdown, then 90 seconds. No pause API, controls or visibility pause.
- Deadline uses elapsed monotonic and wall time, whichever advances farther. Delayed countdown callbacks do not postpone the start. This is a client clock, not anti-cheat authority.
- Exit confirmation keeps timer running; aborted rounds never update local best. Refresh discards active round, with no score write.
- Original score and accuracy formula preserved: completed chars / 1.5 × (completed chars / (completed chars + errors))².
- Motion reduction disables animations/transitions. No asynchronous judgment reset callbacks.

## Existing limitations retained
- Twelve fictional sample phrases; not the private CLI dataset.
- ROUTING fixed. Daily domain rotation is not implemented in the original playtest.
- Local best only. No friend leaderboard, server start verification, per-user account system, Boss Command or Command Collection.
- Ghost is a clearly labeled synthetic 3.2 chars/sec comparison, not today's actual leader.
- Hosting remains owner-private; private training data is excluded from source and static deployment.
- SVG equipment is a reproduction in code, not pixel-identical artwork. Original 5x7 pixel glyphs differ from the unnamed reference typeface.

## Files
- dist/index.html: lobby, HUD, input, race, countdown, result and exit dialog structure.
- dist/app.js: reusable SVG shapes, topology placement and existing browser UI controller.
- dist/engine.js: exact original input/scoring behavior; removed pause/resume API.
- dist/style.css: reference proportions, theme tokens, fixed judgment slot, responsive layout and reduced motion.
- dist/pixel.ttf and dist/FONT-LICENSE.txt: project-created glyphs, MIT license and web embedding metadata.
- test.cjs: six self-contained behavior/regression suites (no prior Git history required).

Run `node test.cjs` from this checkout. Browser validation uses the normal interface; no gameplay test override is shipped.

## Public repository note
This repository contains the static public-safe playtest, **not** the complete planned CLI game. No authenticated friend leaderboard, authoritative anti-cheat service, private course dataset, or user accounts are implemented. Do not treat the fictional prompts as verified executable CLI commands.
