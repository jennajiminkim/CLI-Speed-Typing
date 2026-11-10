# CLI Speed Typing — Phase 2 Invitation & Authentication Security QA

**Date:** 2026-11-10 (Asia/Seoul)  
**Environment:** Vercel Preview only; GitHub `feature/invite-auth-phase2`, commit `cbb21df555179cd83f09d8bc90257e4665d752df`  
**Supabase:** `CLI Speed Typing Friends`, ref `zhfkjwduelavepjfacpo`  
**Scope:** Invitation redemption, membership gating, direct ranked-record write denial.  
**Production / main:** No changes made as part of these QA checks.

## Executive summary

**Core Phase 2 tests: PASS (01, 02, 03).** The user performed actual browser checks, including session-authenticated API requests; the connected Supabase database was independently queried for relevant counts and privileges. These tests validate the **tested scenarios**, not a guarantee against every possible attack. The official leaderboard is intentionally still empty; server-side game completion verification is a separate Phase 3 deliverable.

## Test results

| ID | Goal | Observed evidence | Verdict |
| --- | --- | --- | --- |
| TEST 01 | Reject reused one-use 12-character invitation | In a clean Incognito session, submitting the previously consumed code kept the user on `01 / INVITE CODE` and displayed `사용할 수 없는 초대 코드입니다. 만료 또는 사용 여부를 확인해주세요.`. A Supabase count independently showed one exhausted invite and one active member. | **PASS** for browser recheck; separate simultaneous-claim test not performed |
| TEST 02 | Allow uninvited Auth sign-in but refuse friend ranking | A separate disposable account signed in and received `INVITE VERIFICATION`. Direct navigation to `/leaderboard.html` displayed `ACCESS DENIED` and `유효한 초대 권한이 없습니다.`. From that same browser session, a direct Supabase query yielded `로그인_확인=true`, `본인_회원_행_없음=true`, `순위_HTTP=200`, `반환_행_수=0`, `오류_코드=없음`. | **PASS** for session identity, missing membership and UI denial; DB-row isolation corroborated by RLS policy, but empty-table read alone is not conclusive |
| TEST 03 | Reject browser INSERT, UPDATE, DELETE on `public.ranked_runs` | **Uninvited account B:** all three operations returned **HTTP 403**, PostgreSQL **42501**. **Invited account A:** all three operations independently returned **HTTP 403**, PostgreSQL **42501**. After both runs the table contained **0 rows**. | **PASS** for direct browser write prevention from both authenticated account types |

### Evidence handling

The user supplied QA screenshots in the associated ChatGPT conversation. **This report deliberately excludes raw screenshots, emails, invite codes, session tokens and passwords** because the repository is public. Results are sanitized transcriptions of those screenshots, supported by current Supabase database checks. No personal identifiers are included.

### Supabase checks completed after disposable-account cleanup

| Check | Observed |
| --- | --- |
| Supabase Auth users | **1** (test account B deleted; A retained) |
| Active invite members | **1** |
| Exhausted one-use invitation codes | **1** |
| Official `public.ranked_runs` records | **0** |
| RLS on `public.ranked_runs` | **Enabled** |
| `anon` INSERT on `ranked_runs` | **Denied** |
| `authenticated` INSERT/UPDATE/DELETE on `ranked_runs` | **Denied** |

### Remaining security hardening (not incorrectly marked PASS)

1. **Concurrent redemption / replay races** across two simultaneously authenticated accounts, including post-claim transaction boundaries: not executed live.
2. **Uninvited direct reads of a *nonempty* ranking table**: the current table is empty. RLS policy inspection supports isolation, but the user's zero-row query alone is inconclusive. A temporary transaction-scoped witness row or comparable isolated fixture is recommended.
3. **Public `check_invite` SECURITY DEFINER RPC:** Supabase Security Advisor reports `anon_security_definer_function_executable` and `authenticated_security_definer_function_executable`. Authorization logic must remain carefully scoped; add upstream rate limiting and abuse monitoring before wider rollout.
4. **Authenticated `claim_invite` SECURITY DEFINER RPC:** Advisor reports a warning; this is an intentional elevated function for invitation consumption and requires ongoing review.
5. **Leaked-password protection:** Advisor says disabled. Consider enabling in Auth settings.
6. **Email ownership:** Confirm Email was intentionally disabled for this invite-only Preview. This makes email ownership unverified; account impersonation and recovery abuse remain risks.
7. **Sign-up itself:** Supabase Auth can be called without the UI invitation precheck; account creation itself is not invite-gated. Rank membership and official data rights remain invite-gated.
8. **Browser-automation / anti-cheat:** no server-verified run submission existed during Phase 2. Phase 3 must not simply accept a browser-supplied completion time.

## Exit decision

**Phase 2 core user journeys and tested authorization checks are complete.** Preserve them as regression acceptance requirements for Phase 3. **Not approval for a full public production launch.** The user explicitly requested starting Phase 3 after completing the disposable test-account cleanup.

## Reference links

- Source branch: https://github.com/jennajiminkim/CLI-Speed-Typing/tree/feature/invite-auth-phase2
- Existing tested Preview: https://cli-speed-typing-gt9s43mg5-jennakim.vercel.app/
- Supabase project dashboard: https://supabase.com/dashboard/project/zhfkjwduelavepjfacpo
- Supabase RLS documentation: https://supabase.com/docs/guides/database/postgres/row-level-security
