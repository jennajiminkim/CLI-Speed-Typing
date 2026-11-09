# CLI Speed Typing — Speedrun Playtest

A browser-based network-topology typing game. **This repository contains a public-safe local playtest, not a shared official ranked service.**

## Play the current version
- Live: https://cli-speed-typing.vercel.app/
- Public source: https://github.com/jennajiminkim/CLI-Speed-Typing

## Implemented
- Fixed sequence of 10 fictional test commands (Easy 3, Normal 4, Hard 3).
- Three-second countdown followed by an unlimited elapsed-time stopwatch.
- Exactly matching each command and pressing Enter advances the run. The tenth completed command freezes the result time.
- Typing mistakes can be corrected; the timer continues during correction.
- PERFECT / GOOD / ERROR, combo, score and accuracy are retained as gameplay feedback. **The ranking criterion is fastest completion time, not score.**
- Fastest completed attempt is stored in the same browser, separately for each Seoul-local calendar date. Aborted runs and practice attempts do not count.
- Light/Night network topology; local responsive desktop layout; readable monospaced CLI input; 21px Ghost-panel spacing at desktop dimensions.
- The Ghost panel deliberately shows **no verified leader** because this static version has no shared leaderboard.

## Not yet implemented
No server authentication, friend leaderboard, authoritative ranking, anti-cheat verification, real leader Ghost timeline, Boss Command, command archive, or daily rotating command bank. The game uses fictional demo strings, **not real private course CLI data**.

## Run locally
Open a local static server from the project directory (e.g. `python3 -m http.server 8000 --directory dist`) and visit `http://localhost:8000`.

Tests (Node.js):
- `node test.cjs` — 8 regression suites
- `node qa-speedrun.cjs` — 5 integration scenarios

## Deployment
Vercel framework: **Other**; Root Directory: `./`; Output Directory: `dist`. The `dist/index.html` file is the entrypoint.

## Font credits
- **DOSGothic** / DOS font by **leedheo**; the author documents MIT licensing and requests attribution. Original project: https://github.com/hurss/fonts
- **DungGeunMo (둥근모꼴)** by **orioncactus (길형진)**; described as Public Domain. Reference: https://noonnu.cc/font_page/250

The public Vercel version loads compatible webfont distributions through the Noonnu/jsDelivr CDN in `dist/style.css`. The original large TTF files from the private Work package have **not** been duplicated into this public repository. These externally hosted fonts may differ slightly from the user-supplied TTF files and require network access.

## Submission status
Second-checkpoint build; implementation and automated logic tests are done, but this is not a completed production multiplayer game.
## Phase 2 — invite/auth feature branch (not production)

Invitation-based Supabase Auth and a read-only, RLS-protected friend leaderboard are being developed on `feature/invite-auth-phase2`. This functionality requires a **separate new Supabase project**, a Preview environment configuration, and live security QA before it may be used. **Official record submission is NOT implemented** in Phase 2. See [Phase 2 setup and security guide](docs/phase2-invite-auth.md). The public main-branch playtest remains local-only.
