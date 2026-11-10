# CLI Speed Typing — Phase 3 (server-verified daily friends ranking)

## Status as of 2026-11-10

**Development branch only**: `feature/server-verified-ranking-phase3`. Existing GitHub `main`, Vercel Production, and the user-approved gameplay SVG/layout are unchanged.

The Phase 2 QA report was preserved at `docs/phase2-security-qa-report.md` before creating this branch.

The dedicated Supabase `CLI Speed Typing Friends` project received migration `phase3_server_verified_ranked_runs`.

## What was implemented

1. Authenticated user begins a ranked attempt via `POST /api/ranked-start`. The Vercel server validates their Supabase Auth bearer token by calling `/auth/v1/user`.
2. A server-only secret key calls `start_ranked_run`, which verifies `invite_members.is_active`, marks earlier sessions for the same user abandoned, and creates a unique run ID in private, RLS-protected `ranked_sessions`.
3. The countdown finishes; **only after the new server session is ready** does the client's local Speedrun stopwatch begin. For a signed-out user or failed backend request, the existing local playtest still works and is NOT called official.
4. Each successful typed command triggers `POST /api/ranked-step` with run ID, sequential step and command text. The server verifies the authenticated user independently on every request. The private DB function serializes each run and checks the command index, exact canonical phrase, expiry, membership, and rough lower bound for human typing.
5. Only the 10th verified step completes a run. The server computes official `elapsed_ms` from its timestamps (never a browser-supplied total). The DB atomically upserts only a faster best per user per Seoul-local date. Both client and RLS disallow browser writes directly to `ranked_runs`.
6. Upon confirmation, the result screen displays **SERVER VERIFIED RESULT**, the official server time, and (where available) a real daily rank from `ranked_runs`. The local personal best is preserved separately.
7. The existing `leaderboard.html` still gates access by `invite_members` and reads today's server-verified bests.

## IMPORTANT: administrator setup STILL REQUIRED

Do not put the secret in GitHub, a chat, screenshots or `/api/public-config`.

- Vercel project: https://vercel.com/jennakim/cli-speed-typing
- Settings → Environment Variables
- Set **`CLI_SUPABASE_SECRET_KEY`** to a server-only **`sb_secret_...`** key for https://zhfkjwduelavepjfacpo.supabase.co
- Restrict **Environment: Preview**, ideally Git Branch `feature/server-verified-ranking-phase3` (if available).
- The existing `CLI_SUPABASE_URL` and `CLI_SUPABASE_PUBLISHABLE_KEY` must also be present on that Preview.
- Never select Production; do not copy `service_role` credentials into the frontend.
- After saving, ensure a fresh Phase 3 Preview deploy at the current commit. Environment variables do not retroactively change an existing deployment.
- If a Vercel Preview deployment is access-protected, test with an authorized Chrome/Vercel session.

Supabase secret key management: https://supabase.com/dashboard/project/zhfkjwduelavepjfacpo/settings/api-keys

## Security boundaries and limitations

- The server re-verifies the JWT via Supabase Auth for each start/step. The browser cannot specify the account ID; the RPC receives the independently verified `auth.users.id`.
- The database session table is in `private`, with RLS on and no anon/authenticated access. Ranking table remains browser read-only with existing membership-gated RLS.
- The server-only RPCs are executable by the `service_role` only; no direct anonymous/authenticated grant.
- Server-calculated time includes **network transport and processing latency**, and may not equal the local timer. The result screen explicitly explains this difference. Consistent network conditions matter for fair comparisons.
- Verification rejects inconsistent command order, duplicate submissions, expired runs, uninvited users, incorrect command text, and implausibly fast completion. **It does not prove a human physically typed the commands.** Bots can emulate protocol-compliant event timing and should not be claimed as completely preventable.
- The browser retains the existing local best if the official server is unavailable. Failed official verification never creates an official rank.
- This phase currently uses the existing static 10-command demo dataset, so the server validation phrases are intentionally aligned with those exact demo strings.
- With many friends, current rank display only checks the first 100 rows. Extend pagination before scaling.
- The server uses a privileged Supabase key. Strong deployment isolation, revocation/rotation, logs and further abuse protection are mandatory before Production.

## Live QA checklist — not yet run

1. Confirm current Phase 3 commit deployed as Vercel Preview with **three** correctly scoped `CLI_SUPABASE_*` variables. Check that no server secret is returned by `/api/public-config` or public assets.
2. Signed-out user: game remains local, no `ranked_runs` row; ranked API returns 401 with no authentication.
3. Invited user A: valid login, start and 10 commands, official completion persisted; `SERVER VERIFIED RESULT` appears; `leaderboard.html` displays a grounded best and rank.
4. Attempt a slower 10-command run the same day: only the faster official time remains; new day records are separate.
5. Practice, aborted, incomplete attempts: no official record.
6. Submit wrong command, duplicate step, skipped index, expired or foreign run ID, non-member token: all rejected. Reject forged `user_id` and `elapsed_ms` fields.
7. A/B authenticated browser clients: direct `ranked_runs` INSERT/UPDATE/DELETE remain 403/42501 even if invited.
8. Network loss during run: local gameplay finishes; no fabricated official rank. Note whether partial private sessions expire.
9. Two distinct invited accounts complete on different schedules; their official bests appear together and order by elapsed time.
10. Test 1366×768, 1440×900, 1597×900 and mobile; Light/Night theme; run `node test.cjs`, `node qa-speedrun.cjs`, `node test-auth.cjs` and `node qa-phase3.cjs`.
11. Review Supabase Security Advisors again and address inherited Phase 2 warnings before broader user rollout.

**Verdict policy:** No end-to-end PASS or Production readiness claim until real Preview/Auth/browser/server tests finish. Do not auto-merge the Phase 3 branch into `main`.
