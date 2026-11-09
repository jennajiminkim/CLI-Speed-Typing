# Phase 2 — Invite-only friends access

This development branch provides email-verified invitation membership and a server-protected, READ-ONLY leaderboard scaffold. It does NOT submit gameplay records or claim official ranking.

## Deployment and isolation
- Branch: feature/invite-auth-phase2. Do not merge or deploy to Production before review.
- Use a NEW dedicated Supabase project for CLI Speed Typing Friends. Do not reuse PlanDoSee or the earlier security practice database.
- Create the project only after choosing the Supabase organization and confirming any price.
- Apply supabase/migrations/20261110_invite_auth.sql to the dedicated project only.
- Configure Vercel PREVIEW environment variables:
  CLI_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
  CLI_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
- Configure Supabase Auth email/password with email confirmations ENABLED.
- Allow the Preview URL ending in /auth.html as an Auth redirect URL.
- /api/public-config returns only the public URL/publishable key. NEVER include a service_role or sb_secret_ key.
- Browser imports @supabase/supabase-js version 2.119.0 from a version-pinned CDN; Preview needs internet connectivity for this library.

## User flow
1. Clicking Leaderboard from the lobby opens the protected leaderboard.html page.
2. Guests see ACCESS DENIED and a link to auth.html.
3. Sign up by providing email/password, a 32-hex-character invite code format, and a 2–16 character nickname. Receive a verification email. The code is NOT consumed at signup, and merely signing up grants no membership.
4. After email confirmation, sign in. Enter the invite code and nickname once more. The authenticated claim_invite database function consumes the one-use code atomically and creates active membership.
5. Only active invite members can SELECT server-ranked runs. Records remain empty until Phase 3.
6. Existing local Speedrun play, guest practice, local best, UI assets, and Light/Night display are unaffected. No public client can post an official run.

## Administrator invitation creation
Generate unique random 128-bit codes OFFLINE with macOS command:
  openssl rand -hex 16

Do NOT commit codes/passwords/emails to the public repository, and do NOT paste live codes or secrets into chat.
In the dedicated Supabase SQL editor, privately replace the placeholder below with a random code before executing:
  insert into private.invite_codes(code_sha256,max_uses,expires_at)
  values (encode(sha256(convert_to(upper('REPLACE_WITH_32_HEX_CHARS'),'UTF8')),'hex'),1,now()+interval '14 days');
This stores only the digest. Each code is single use and expires. The administrator can revoke a code by setting revoked_at.

## Security boundaries
- public.invite_members: RLS SELECT only for the caller's own row, no browser writes.
- private.invite_codes, private.invite_claim_attempts: unavailable to anon/authenticated roles.
- public.claim_invite: authenticated-only SECURITY DEFINER RPC with auth.uid, verified-email check, high-entropy random invite code, hourly attempt limit 10, atomic claim; private rows are never returned.
- public.ranked_runs: SELECT only for active invite members; no INSERT/UPDATE/DELETE permission or policy for any browser client (including invited accounts).
- The actual security boundary is database RLS, NOT UI hiding.
- Nicknames are public ranking labels; emails are never shown on ranking pages.
- Uninvited accounts may technically exist in Supabase Auth, but have no membership, ranking read, or official record write authorization.

## Required live QA after configuring the new project
1. Guest: direct leaderboard opens ACCESS DENIED. Direct REST SELECT yields no rows and POST denied.
2. Logged-in uninvited account: not a member, no ranking data, no record write.
3. Verified invited account: claim once, own member row readable, leaderboard SELECT allowed, browser INSERT denied.
4. Second account reusing used code: claim false; no membership.
5. Revoked/expired invite: false. Unverified email: cannot claim.
6. Two simultaneous claims for the same one-use code: maximum one successful member.
7. Above 10 attempts per hour: denied; inactive member denied ranking access.
8. Two independent invited accounts access the page; results remain empty until Phase 3.
9. Run node test.cjs, node qa-speedrun.cjs, node test-auth.cjs and inspect Light/Night, mobile, error and confirmation flows.
10. Check Supabase security advisors. Test with disposable accounts and codes.

## Phase 3
Implement a trusted server endpoint to verify run ownership, 10 exact commands, timings, completion, repeated/replayed events and daily best updates BEFORE privileged writing to ranked_runs. Do not allow direct browser writes to claimed times. Add signup/email rate-limiting, anti-abuse checks, and dependency CSP review before public rollout.
