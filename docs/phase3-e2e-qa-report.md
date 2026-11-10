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
| Explicit browser refresh action independently instrumented | **NOT INDEPENDENTLY OBSERVED** | User supplied before/after captures in response to the refresh instructions; a still screenshot cannot itself prove the reload event. If strict instrumented confirmation is required, a browser trace or user confirmation is needed |
| Clean, newly authenticated session (not a new tab sharing existing session) | **NOT TESTED** | Neither screenshot proves a new isolated browser authentication |
| Two-user visual layout at the pictured desktop viewport | **PASS** | No row overlap or clipping visible in provided captures |
| All prescribed desktop viewports and Night theme | **PARTIAL** | Not captured for this follow-up |

**Updated functional verdict:** **PASS** for Phase 3's core multi-user Daily Leaderboard user-acceptance requirement (two genuinely invited accounts, server persistence, correct same-day ordering, and shared authorized display). **Full Phase 3 negative-security, fresh-session, exact-viewport and cross-day regression coverage remains PARTIAL.** The new evidence does not retroactively turn unexecuted tests into PASS.

**Release boundary:** Documentation update only in `feature/server-verified-ranking-phase3`. No credential exposure, account changes, Supabase writes, GitHub `main` changes, or Vercel Production release.
