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
