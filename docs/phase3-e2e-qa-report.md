# Phase 3 end-to-end QA report

**Primary verdict: PASS.** A real 10-command Daily Speedrun on Vercel Preview completed through the browser. The app reported `SERVER VERIFIED RESULT` at `00:57.28`, Supabase persisted `57280` ms as the official daily best, and the Friends Leaderboard displayed the same result. The full negative and visual regression matrix is **PARTIAL**.

## Deployment and browser evidence

- Tested [Vercel Preview](https://cli-speed-typing-25i1yvwbq-jennakim.vercel.app/) on branch `feature/server-verified-ranking-phase3`, implementation commit `391e63e631a7b69be13d0ed853451840deebbb37`.
- The previous Preview was created at 20:31:55 KST on November 10, 2026, before the branch-scoped secret update shown in Vercel. The same commit was redeployed as Preview, with the build cache disabled. The [deployment details](https://vercel.com/jennakim/cli-speed-typing/4uPryi1xcnY1bKGEBsAtbo3SE2Vu) showed **Ready** at 21:08:53 KST.
- Browser navigation opened `/`, `/auth.html` and `/leaderboard.html`. The `/api/public-config` response had exactly `url` and `key`, with the intended Supabase URL and a publishable key. No server secret was observed in that response. This check covered that endpoint, with no exhaustive browser asset scan.
- A controlled disposable email identity was unavailable. With the authorized existing invited account (member A), browser sign-in showed `ACCESS GRANTED`. The test used Chrome Playwright locators and keyboard events. After selecting normal `START →`, the three-second countdown appeared. Automation read each rendered command, typed it in short bursts with 130 ms spacing between bursts, and pressed Enter. No application state, counters, clock or storage were edited.
- Observed command labels in order: `01/10 EASY`, `02/10 NORMAL`, `03/10 EASY`, `04/10 NORMAL`, `05/10 HARD`, `06/10 NORMAL`, `07/10 EASY`, `08/10 HARD`, `09/10 NORMAL`, `10/10 HARD`. The run reached `SPEEDRUN COMPLETE` and then `SERVER VERIFIED RESULT`. The local best displayed separately as `00:55.73`.
- The sanitized screenshot montage shows the lobby, mid-run progress, the 10/10 result while the server confirmation was pending, and the loaded leaderboard. The countdown and official result banner were observed in the live browser. The early result screenshot shows the local stopwatch, and the leaderboard screenshot shows the official time.

## Server and persistence

| Check | Actual evidence | Verdict |
| --- | --- | --- |
| Ranked API | Vercel Request Logs for the exact Preview host showed one `POST 200 /api/ranked-start` at 21:12:04.84 KST and ten `POST 200 /api/ranked-step` requests, ending at 21:13:02.68 KST. The application submits each step against the server-issued session, and the matching database session reached `step_index=10`, `status=finished`. Raw request/response bodies and run IDs were omitted from capture. Completion was corroborated by the result banner and database. | PASS |
| Official record | `public.ranked_runs` contained one daily best with `elapsed_ms=57280`, `command_count=10`, `verification_version=server-events-v1` and `seoul_day=2026-11-10`. The user association joined to an active invitation membership, and the saved display name matched the membership. | PASS |
| Server clock and date | The completed session's server `finished_at - started_at`, truncated to milliseconds, was exactly `57280`. The session's start date converted to `Asia/Seoul` matched the official date. | PASS |
| Friends Leaderboard | The authorized account saw rank 1 and `00:57.28`, with the matching nickname. The same row remained after opening the leaderboard in a separate tab and refreshing, including after the slower retry. Only one official record existed. | PASS |
| Separate authentication session and multi-user ordering | The separate tab reused the signed-in browser profile. A clean login session and a live multi-user ordering check were not exercised. | BLOCKED |

## Negative and regression checks

| Check | Actual evidence | Verdict |
| --- | --- | --- |
| Anonymous ranked HTTP requests | The missing-bearer case passed in the local mocked API suite. Live database roles were denied both trusted RPCs. A live Preview POST without credentials was not captured. | PARTIAL |
| Uninvited ranked start | Live Supabase RPC rejected an isolated uninvited identity with `42501 not_invited` inside a rollback-only transaction. An authenticated uninvited HTTP session was not exercised in Preview. | PARTIAL |
| Direct client writes | Live database roles `anon` and `authenticated` both received `42501` for each of INSERT, UPDATE and DELETE on `public.ranked_runs` and for both trusted RPCs. RLS was enabled on the membership and official ranking tables. Client roles lacked write grants, including column write grants, and private session schema usage. No browser REST write attempt was sent. | PASS |
| Invalid step submissions | Live Supabase RPC rejected a duplicate and out-of-order step with `22023 invalid_sequence`, an incorrect command with `22023 invalid_command`, and a foreign-owner submission with `22023 run_inactive_or_missing`. Executed inside a rollback-only transaction. | PASS |
| Abandoned and incomplete | Live RPC accepted only step 1 of a fixture session, then a new start marked that session abandoned. No official row was created by the fixture. A separate UI exit was not exercised. | PASS |
| Slower daily retry | A second official browser run completed all ten commands. Supabase confirmed `146345` ms for that session, while the single daily best and leaderboard stayed at `57280` ms. The early result snapshot showed the separate local elapsed time, `02:25.31`. | PASS |
| Practice and local personal best | A separate Practice run completed ten commands and showed `PRACTICE COMPLETE`. Supabase still showed exactly two completed official sessions and one best row. The local personal best remained `00:55.73` on the result screen. | PASS |
| Visual checks | Live Chrome at 1363 × 936 had no horizontal overflow on the inspected result screen in Light or Night. Light result buttons were aligned and both measured 150 × 52 CSS px. Theme was restored to Light. Exact 1366 × 768, 1440 × 900 and 1597 × 900 views were not exercised. | PARTIAL |
| Local automated regression | `node test.cjs` 8/8, `node qa-speedrun.cjs` 5/5, `node test-auth.cjs` 9/9, `node qa-phase3.cjs` 8/8. These checks supplement the live evidence. | PASS |

## Data retention and release boundaries

No disposable account or invitation was persisted. The isolated negative-test database fixtures were rolled back. The two verified sessions and the first official daily best created under member A were retained as requested. The Practice run added no official session or row. The report omits emails, member names, raw user/run IDs, commands, invitation codes, tokens and credentials.

GitHub `main` was `eed2cfa36bccf21ad51b2142812c61f7bbd8bc99` before the report commit. No Production deployment or promotion was requested or performed. Only this QA document is included in the feature-branch commit. The tested Preview is pinned to the implementation commit above.

The core ranking flow meets the acceptance criteria. Remaining coverage is a fresh authenticated browser session, multi-user ordering, live anonymous and uninvited HTTP denial, and visual review at the three exact desktop sizes.

## Multi-User Leaderboard E2E Verification

**Verdict at automated QA cutoff: PARTIAL.** The same-day server persistence check passed for two distinct invited accounts; the QA automation browser did not obtain an authorized invitation-member session. **Follow-up user acceptance (2026-11-10): PASS for both-member UI rendering and two-capture stability**, described below. The complete security and viewport regression matrix remains PARTIAL.

The target was the [same Vercel Preview](https://cli-speed-typing-25i1yvwbq-jennakim.vercel.app/leaderboard.html) from implementation commit `391e63e631a7b69be13d0ed853451840deebbb37`. Both the database and the Preview page showed the Seoul-local date `2026-11-10`. At baseline, two distinct Supabase Auth accounts had active invitation memberships. There was one official ranking row, A's `57280` ms daily best. B had no official row.

The secure QA-browser sign-in for B did not complete. The user then reported completing the run directly using member B. The follow-up database query found one newly completed B session with `step_index=10` and `status=finished`. Its elapsed time calculated from server timestamps was `72864` ms and matched the new official best for B. This run was manual. B's countdown, individual HTTP requests and responses, and result banner were not captured in the QA browser.

| Seoul-local date | Member | Position from database order | Official elapsed time | Screen-equivalent formatting |
| --- | --- | --- | --- | --- |
| 2026-11-10 | A | 1 | 57,280 ms | 00:57.28 |
| 2026-11-10 | B | 2 | 72,864 ms | 01:12.86 |

Both rows had `command_count=10`, `verification_version=server-events-v1`, and display names matching their corresponding active membership records. A's baseline remained unchanged while B's independent result was added. No test records were inserted through SQL. The deployed commit's leaderboard query filters by Seoul-local date and orders by elapsed time ascending, then user ID ascending as a deterministic tie-breaker. The database check used that order and verified scenario A (B slower). A reversed order or a tie was not exercised with live records.

- **PASS — Server persistence and database ordering.** Two genuine results, distinct users, one Seoul day, fastest time first in the database query.
- **BLOCKED — Authenticated rendering and refresh.** The actual Preview leaderboard loaded but showed `ACCESS DENIED` in the QA browser without a valid invited session. The two rows and nicknames were therefore not observed together in the browser. Fresh authenticated session, same-session new tab, refresh persistence in the UI, theme styling and exact viewport checks remain unverified. No authenticated screenshots or B request traces were collected.
- **PASS — Live write protection.** RLS remains enabled on `public.ranked_runs`. Both `anon` and `authenticated` lacked INSERT, UPDATE and DELETE table grants, including INSERT and UPDATE column grants. The earlier live role-denial, foreign-owner submission, incomplete-run, Practice, slower-retry and public-config checks remain documented above. No new cross-account HTTP tampering or credential exposure scan was performed.
- **Release scope.** No accounts, memberships, invitations, results, security settings or application code were changed by QA. No main-branch update, merge or Production deployment was performed. This update adds documentation only.

**User acceptance status at prior report cutoff:** The server-side comparison was ready, while the QA automation browser was blocked from seeing both rows. Subsequent user-supplied authenticated screenshots address the UI display and ordering requirement; see follow-up evidence below.


### Follow-up user acceptance — authenticated two-row leaderboard (2026-11-10)

**Scope and evidence source:** The user supplied two screenshots from Chrome at approximately **22:20:42** and **22:21:12 KST** in response to a request for screenshots before and after a refresh. Both show the same authorized Phase 3 Preview's `/leaderboard.html` with **`2026-11-10 · ASIA/SEOUL`**, an invitation-verified greeting, two different members, and **`오늘의 서버 검증 기록 2건`**. This is user-supplied visual evidence, not Work's browser automation trace. Screenshots are retained in the conversation and are not uploaded to the public GitHub repository; account display names are intentionally omitted here.

| Observed position | Sanitized member | Browser result | Supabase reference | Comparison |
| --- | --- | --- | --- | --- |
| 1 | A | `00:57.28` | 57,280 ms | Match |
| 2 | B | `01:12.86` | 72,864 ms | Match |

**Database recheck:** The connected Supabase project independently returned exactly those **two** rows dated `2026-11-10`, ordered ascending by `elapsed_ms`. Both rows had `command_count=10`, `verification_version=server-events-v1`, and active invitation memberships. This read-only query made no data changes.

| Acceptance requirement | Verdict | Grounding |
| --- | --- | --- |
| Both distinct invited users rendered together in the same browser leaderboard | **PASS** | Both screenshots visibly show two separate player rows |
| Correct ascending ordering by official time | **PASS** | Row 1: 57,280 ms; Row 2: 72,864 ms |
| Browser times correspond to server's official records | **PASS** | Values matched direct Supabase readback |
| Two consecutive captures retain the same order, rows and count | **PASS** | Both provided screenshots visibly identical for relevant data |
| Browser refresh and post-reload record persistence observed in video | **PASS — visual reload and persistence** | Subsequent user-supplied screen recording captures the leaderboard briefly resetting/reloading and the same two records repopulating; this supersedes the earlier screenshot-only limitation, though the exact keyboard shortcut is not independently logged |
| Clean, newly authenticated session (not a new tab sharing existing session) | **NOT TESTED** | Neither screenshot proves a new isolated browser authentication |
| Two-user visual layout at the pictured desktop viewport | **PASS** | No row overlap or clipping visible in provided captures |
| All prescribed desktop viewports and Night theme | **PARTIAL** | Not captured for this follow-up |

**Updated functional verdict:** **PASS** for Phase 3's core multi-user Daily Leaderboard user-acceptance requirement (two genuinely invited accounts, server persistence, correct same-day ordering, and shared authorized display). **Full Phase 3 negative-security, fresh-session, exact-viewport and cross-day regression coverage remains PARTIAL.** The new evidence does not retroactively turn unexecuted tests into PASS.

**Release boundary:** Documentation update only in `feature/server-verified-ranking-phase3`. No credential exposure, account changes, Supabase writes, GitHub `main` changes, or Vercel Production release.


### Follow-up user acceptance — recorded browser refresh (2026-11-10, about 22:30 KST)

**Verdict: PASS — visibly reloaded leaderboard retains both rankings.** The user supplied a ~22-second Mac Chrome screen recording (`.mov`) showing the same Phase 3 Preview leaderboard while signed in as an authorized invited member. Review of time-separated frames found:

- **Before reload (~0–2 s):** the leaderboard displays two rows, A in 1st at `00:57.28` and B in 2nd at `01:12.86`, along with the server-verified total of 2.
- **During reload (~2.7–3.1 s):** the page reinitializes: the ranked result area temporarily disappears and the content is not yet populated, consistent with a browser page reload and a new data request. A keyboard shortcut was not instrumented separately, so the exact `⌘+R` keystroke is not a direct artifact.
- **After reload (~3.3–5 s and subsequent frames):** the same two ranking rows, names, time values, and server-verified count of 2 are repopulated in the same order. This persists in later frames.

**Cross-check:** A read-only query against the dedicated Supabase project again returned both `2026-11-10` official daily records, `57280` and `72864` ms in ascending order, both with active invitation memberships, `command_count=10`, and `verification_version=server-events-v1`. No database changes were made.

| Follow-up requirement | Final verdict | Evidence |
| --- | --- | --- |
| Same authorized browser sees both members before reload | **PASS** | User video, pre-reload frames |
| Leaderboard visibly reinitializes and reloads | **PASS** | User video, transient unpopulated page state |
| Two server-verified rows remain after reloading | **PASS** | User video, post-reload frames |
| Correct fastest-first order and exact persisted times survive reload | **PASS** | Video and Supabase readback |
| Separate, freshly authenticated user session | **NOT TESTED** | Existing session was used |
| Exact desktop viewport matrix and Night visual checks | **PARTIAL** | Not covered by this follow-up video |

The source recording stays attached to the user conversation; **it is not committed or shared in the public GitHub repository**. The report retains sanitized outcomes without secrets, session tokens, user identities or private media.

**Updated Phase 3 functional conclusion:** The central multi-user, asynchronous daily leaderboard is **PASS**, including observable reload and persistence. The overall Phase 3 release/security/regression matrix remains **PARTIAL** until its separately listed checks are completed. This is a **documentation-only update** on `feature/server-verified-ranking-phase3`; no `main` merge, Production deployment, or Supabase writes.

## Final Fresh Session, Live HTTP Security & Responsive UI Verification

**Overall verdict: PARTIAL.** Real invited-member login and logout worked. Database permissions, expired-session rejection and record preservation were confirmed. Independent browser-profile provenance, the application-layer HTTP denials and the requested exact responsive matrix remain open.

### Test target and baseline

- [Vercel Preview](https://cli-speed-typing-25i1yvwbq-jennakim.vercel.app/) from implementation commit `391e63e631a7b69be13d0ed853451840deebbb37`.
- Seoul date during the browser and database checks was **2026-11-10**. Baseline and post-check totals were **3 ranked sessions and 2 official records**. Both official rows retained their 10-command, `server-events-v1` records at `57280` and `72864` ms.
- Preview protection remained enabled. No account, invitation, authentication configuration, ranking row, gameplay, or application code was changed by QA. The temporary expired-session fixture was rolled back. No deployment, promotion, or branch merge was performed.

### A — Authentication

| Test | Procedure and expected result | Actual evidence | Verdict |
| --- | --- | --- | --- |
| A01 — Login and leaderboard | Start unauthenticated, sign in with an existing invited account, retrieve both same-day records without a new invite. A demonstrably fresh browser context is required. | Remote Chrome at 1363 × 936 started with an empty tab inventory. Direct `/leaderboard.html` initially showed `ACCESS DENIED`. Used the email/password secure login prompt with the invited account. The leaderboard then showed invitation confirmation and rows `1 / 00:57.28` and `2 / 01:12.86`. No invite or injected authentication state was used. The browser binding did not provide independent profile creation or an initial cookie/storage inventory, so tab inventory does not prove storage isolation. | PARTIAL |
| A02 — Logout and isolation | Use app logout, revisit leaderboard, repeat in a never-authenticated independent context. | Clicked the visible logout control on `/auth.html`, observed the login form, then navigated directly to `/leaderboard.html`. It showed `ACCESS DENIED` and the table held 0 rows. Both records remained in Supabase. The additional independent context and previous-token revocation were not tested. | PARTIAL |

### B — HTTP and database security

| Test | Procedure and expected result | Actual evidence | Verdict |
| --- | --- | --- | --- |
| B01 — Unauthenticated ranked POSTs | Credential-free HTTPS client sends JSON `{}` to `/api/ranked-start` and JSON with a syntactically valid non-member fixture UUID, step 1, and placeholder command to `/api/ranked-step`. Expect application `401 authentication_required`. | Both live POSTs returned HTTP `401`, JSON error code `401`, message `Protected deployment`. Vercel rejected the requests at the deployment edge. Application handler status remains unverified in live HTTP. Session and ranking counts stayed unchanged. The automated missing-bearer handler test also passed, with mocked dependencies. | PARTIAL |
| B02 — Authenticated without invitation | Sign in with a controlled uninvited identity. Expect application HTTP `403`, denied leaderboard, no protected Data API rows and no new ranked session. | Dedicated Supabase project had 0 Auth accounts without an active membership. No controlled disposable identity was available. No account was created. Earlier rollback-only RPC `42501 not_invited` evidence remains applicable at the database layer. | BLOCKED |
| B03 — Direct write and credential protection | Inspect live roles, RLS and trusted RPC rights, and check public browser output for server credentials. | Live RLS enabled. The only ranking policy is active-member SELECT for `authenticated`. Neither `anon` nor `authenticated` has INSERT, UPDATE, DELETE, INSERT/UPDATE column grants or EXECUTE on either ranked RPC. `service_role` retains both RPC rights. Earlier runtime `42501` denials remain recorded. Live `/api/public-config` returned only `key` and `url` and the key matched the publishable prefix. A scan of the pinned `dist/` tree found no server-secret identifiers or key prefixes. Direct browser navigation to a deployed JS asset returned `ERR_BLOCKED_BY_CLIENT`, so a complete live asset and response sweep was not performed. No browser write probes were run. | PASS for database protection, PARTIAL for live exposure coverage |
| B04 — Run integrity | Validate expired, invalid, duplicate, skipped, cross-account and uninvited requests, and confirm client time cannot control the result. | A newly executed rollback-only expired-session fixture returned `22023 run_inactive_or_missing` from the actual Supabase RPC. After rollback, 3 sessions and the 2 existing best times remained. Earlier live RPC evidence covers incorrect, duplicate, skipped, cross-owner, abandoned and uninvited cases. The re-run mocked API rejects caller identity and elapsed time overrides, and earlier genuine runs proved the official time matched the server timestamps. | PASS for evidenced RPC/handler behavior. End-to-end uninvited HTTP remains B02. |

### C — Responsive and theme checks

The live browser provided a measured **1363 × 936 CSS px** viewport. Exact viewport override and mobile emulation were not available through the browser interface used. Existing official records were preserved by exercising the Practice path for the new result geometry check.

| Test | Actual result | Verdict |
| --- | --- | --- |
| C01 — 1366 × 768 | Exact viewport and its five-screen matrix were not exercised. | BLOCKED |
| C01 — 1440 × 900 | Exact viewport and its five-screen matrix were not exercised. | BLOCKED |
| C01 — 1597 × 900 | Exact viewport and its five-screen matrix were not exercised. | BLOCKED |
| C02 — Light and Night | At 1363 × 936, the body theme class changed in the lobby, Practice game and result and was inherited by the login route on reload. Those screens showed no horizontal overflow in the measurements. The authorized two-row leaderboard was inspected in Light, and the denied leaderboard in Night. Full authenticated Night leaderboard coverage is open. | PARTIAL |
| C03 — Result geometry | Completed Practice commands 01–10 through keyboard input. In both themes, button rectangles measured **150 × 52 CSS px** each, both at the same Y, with **16 px** gap and centered as a group. The Practice result rendered with the ranking and personal best placeholders. Official result presentation and local best behavior are supported by earlier evidence. Exact desktop geometry remains open. | PARTIAL |
| C04 — 390 × 844 mobile | Login and the 12-character invitation form were visible at the available desktop viewport. Mobile overflow, software keyboard behavior, touch targets and mobile leaderboard were not exercised. | BLOCKED |

The sanitized browser screenshots show both authenticated ranking rows, the denied state after logout, and the Practice result in Light and Night at the actual 1363 × 936 viewport. Screenshots are supplied separately from GitHub.

### Findings and release decision

- **Low severity, stale copy.** On the actual Preview authentication page the footer text says server ranking submission will be connected in a later stage, even though official runs already work. The leaderboard footer also displays `PENDING` on a populated leaderboard. A narrowly scoped copy update could remove the contradictory status before release.
- Re-ran all four existing suites, **30/30 passed** (8 core, 5 Speedrun, 9 auth, 8 Phase 3). Static and mocked checks are supplementary to live verification.
- The verified functional flows remain suitable for user acceptance checks. **Final QA sign-off and Production readiness are not established.** Close the independent fresh-profile/login/logout coverage, application-layer missing-auth and uninvited HTTP tests, deployed asset exposure review and the exact desktop/mobile matrix before release. No new authorization failure was demonstrated by the tests that reached the application or database.

## Phase 3 Pre-Release Final Refinement & Remaining QA

**Verdict: PARTIAL.** The copy corrections are on the Phase 3 branch, GitHub recorded a successful Vercel check for the source commit, and the Supabase permissions and official records were verified again. The protected deployment and browser checks still require an authorized browser/runtime.

### Source and deployment

- Starting branch HEAD matched `c857912616b7d44302f7e537325d1799aba51575`. GitHub comparison reported identical, with no newer commits to reconcile.
- Source commit [`8b04789`](https://github.com/jennajiminkim/CLI-Speed-Typing/commit/8b04789a0dc0839b53aea74117a675e52c8419ec) changes only HTML text in `dist/auth.html`, `dist/leaderboard.html`, and `dist/index.html`. It replaces the auth disclaimer, the authorized current-day empty message, and the leaderboard footer. The two additional lobby text edits remove the claim that official ranking is disconnected and direct users to the Friends Leaderboard. Local-only records and unavailable ghost features retain their separate treatment.
- The existing `rankContent` and `rankEmpty` hidden markup and `rankEmpty.hidden = runs.length > 0` behavior remain intact. Authentication, queries, styles, art, assets, timer, gameplay, and existing test files have no changes in the GitHub diff.
- GitHub returned **Vercel / success** for the source commit with [deployment details](https://vercel.com/jennakim/cli-speed-typing/6LPKu8ZrV2wcDguJCgpgGdMwVGFE), establishing that the existing Git integration ran. The Vercel connector listed no matching project and returned 404 on scoped project/deployment inspection. The exact new Preview host, deployment Ready metadata and visible copy were therefore not independently verified. The previous verified URL is [the earlier Preview](https://cli-speed-typing-25i1yvwbq-jennakim.vercel.app/) and was not used as evidence for the new copy. Environment scopes for `CLI_SUPABASE_URL`, `CLI_SUPABASE_PUBLISHABLE_KEY`, and `CLI_SUPABASE_SECRET_KEY` could not be verified on the new deployment. No manual deployment, promotion, environment edit or merge was performed.

### Regression evidence

The Node execution environment was unavailable and GitHub reported no Actions workflow runs for the source commit. The four requested `node` commands could not be run. A supplemental V8 execution used the existing scripts and a minimal in-memory CommonJS/Node compatibility harness against the reviewed source. All 8 assertions in `test.cjs` and all 8 static/mocked checks in `qa-phase3.cjs` passed in that harness. `qa-speedrun.cjs` and `test-auth.cjs` were not rerun. The historical 30/30 Node result above remains baseline evidence only.

### Remaining QA matrix

| Test | Actual evidence and limitation | Verdict |
| --- | --- | --- |
| C01 — Independent login | No authorized browser runtime was available for a fresh profile, invite sign-in or retrieval on the corrected deployment. The earlier signed-in session is retained as historical evidence only. | BLOCKED |
| C02 — Logout and session isolation | No new browser logout or second-context check. Earlier UI logout evidence remains recorded. No token revocation claim. Both official records were verified in Supabase. | BLOCKED for new browser check |
| D01 — Application-layer unauthenticated POSTs | No authorized Vercel browser or supported automation bypass was available. Earlier edge-generated 401 and supplemental mocked handler assertions do not establish an application-generated live `401 authentication_required` on this deployment. | BLOCKED |
| D02 — Uninvited application session | Live database inspection found zero Auth identities without an active invitation membership. No user-controlled disposable identity was available. No account was created, and no live `403 not_invited` or Data API read denial was obtained in this round. Earlier rollback-only database evidence is preserved. | BLOCKED |
| D03 — DB write and RPC security | Read-only query against the dedicated Supabase project confirmed ranking RLS, no INSERT/UPDATE/DELETE or column write privileges for `anon` or `authenticated`, no private schema usage or ranked-session SELECT for those roles, and no EXECUTE on either ranked RPC. The query returned 3 sessions and two active-member official records for Seoul day 2026-11-10, 57,280 and 72,864 ms, 10 commands each, `server-events-v1`. No database writes. | PASS |
| D04 — Live public secret exposure | No new protected Preview access to inspect live HTML, JS, API bodies or console. Reviewed text-only diff contains no credential changes. Earlier public-config evidence remains tied to the prior deployment. | BLOCKED for new deployment |
| E01/E02 — Desktop and themes | Required exact CSS viewports 1366 × 768, 1440 × 900 and 1597 × 900 in Light and Night were not exercised. The previous 1363 × 936 measurements are not substitutes. | BLOCKED |
| E03 — Result geometry | No new DOM measurement. Prior Practice measurements of 150 × 52 px buttons and 16 px gap remain historical evidence. No official runs were replayed. | BLOCKED for new measurement |
| E04 — Mobile | No 390 × 844 CSS viewport or mobile navigation/keyboard test was available. No resized screenshots were used. | BLOCKED |

**Release recommendation.** The copy defect is corrected at source and the branch is ready for Preview acceptance testing once access is available. Final user acceptance and Production release review are not ready to sign off. Verify the deployed copy and environment scope, run all four Node commands, close isolated authentication and live security checks, and complete the exact responsive matrix. No additional application defect was established in this round.
