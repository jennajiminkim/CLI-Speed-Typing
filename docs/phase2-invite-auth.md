# Phase 2 — Invite-first friends access

## Status and isolation

This is a **development branch**, not production. Project: CLI Speed Typing Friends (Supabase ref `zhfkjwduelavepjfacpo`). Existing Production and GitHub `main` remain unchanged.

Current workflow: **Invite code → email/password/nickname signup → session → atomic invitation redemption → member-only leaderboard**. Email-link confirmation is intentionally optional in the product, but must be disabled in the Supabase Auth dashboard before this flow can be tested. Email address ownership will NOT be verified in that configuration. This reduces friction but brings impersonation, password-reset, and account-recovery risks. Use only within a small trusted group.

No verified gameplay record submission exists yet. The leaderboard remains read-only and empty until Phase 3.

## Preview configuration

Existing Vercel Preview link (commit d9accac, historical preview):
https://cli-speed-typing-o0yfrws7h-jennakim.vercel.app/

Vercel project:
https://vercel.com/jennakim/cli-speed-typing

Preview environment variables, already displayed as configured in the user's Vercel settings screenshot:
- `CLI_SUPABASE_URL=https://zhfkjwduelavepjfacpo.supabase.co`
- `CLI_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`

Exact values and runtime behavior **have not been independently verified**. Never use service_role or secret keys in browsers.

Because the source code is updated after the listed preview commit, **redeploy the latest development branch** and get the new Preview URL before final testing. Environment variables added after a deployment require a fresh deployment to apply.

### Supabase Auth manual setting still required

Visit https://supabase.com/dashboard/project/zhfkjwduelavepjfacpo/auth/providers

Under Email provider, enable email/password signup and disable **Confirm Email** to allow immediate signed-in sessions on email/password signup. Supabase Auth configuration is not editable with the connected Supabase project tools; change this in the dashboard. Check whether the project is restricted to invited members before sharing the URL. Emails are unverified, so invite codes remain the authorization boundary. Do not disable confirmation until accepting the associated risk.

Email redirects are not essential for immediate signup with Confirm Email disabled. If email confirmations are later re-enabled, explicitly set Site URL and allowed Redirect URLs at:
https://supabase.com/dashboard/project/zhfkjwduelavepjfacpo/auth/url-configuration

## Security model

1. `public.check_invite`: a public RPC checks a high-entropy 128-bit invite against the private digest, expiration and usage limits. **It does not consume or reserve the code** and **does not grant access**.
2. `auth.signUp`: creates a password-based Auth account. When Confirm Email is disabled, it returns a session that can be used to redeem the code.
3. `public.claim_invite`: authenticated-only RPC verifies the session, consumes exactly one available use and creates the member record. This retains the original member permission gate.
4. `public.ranked_runs`: membership-gated RLS SELECT; browser clients have **no direct write permission**.
5. A user can still create an Auth account by calling Supabase Auth directly without entering a code. Such an account is **not authorized for shared leaderboard read/write**. Preventing account creation itself (rather than just access) needs an additional server-side Auth hook or trusted registration service.
6. Public precheck is not rate-limited on its own; high-entropy codes reduce guessing risk, but gateway abuse and email/password signup rate-limits must be addressed before a public launch.
7. No invite is stored in `localStorage`, query string or public repository.

## Invite issuance (administrator only)

Current format: 12 uppercase characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (60 bits of randomness). Generate privately with `node scripts/generate-invite-code.cjs`, then copy the generated **hashed SQL INSERT** into the dedicated project's SQL editor. Never commit or share the live code in chat. Use one code per friend, single-use, 14-day expiry.

## Live acceptance tests (not yet executed)

- Unauthenticated visitor cannot retrieve any ranked records or insert them.
- Valid invite precheck allows the signup form; wrong, expired, revoked and used codes are rejected.
- Email/password signup immediately returns a session only after Confirm Email is disabled.
- The authenticated claim atomically consumes the invite and creates member access.
- Reusing a consumed code with another account fails.
- Signing up without using a code through Supabase Auth does **not** grant a member record or ranked-data access.
- A member can read the leaderboard while still being **unable to directly insert** ranked runs.
- Failures after creating a user leave them without shared-record permissions; they may sign in and redeem a valid code.
- Light/Night layouts and existing gameplay remain intact.
- Run `node test.cjs`, `node qa-speedrun.cjs`, `node test-auth.cjs`, and inspect Supabase security advisor warnings.

## Pending

- Confirm Email dashboard toggle.
- Test-invite generation and user A/B live signups.
- New Vercel Preview from the latest development commit.
- Actual browser tests of the precheck, signup, atomic consume and RLS rules.
- Hardening against email impersonation, account recovery abuse and registration flooding.

Do not merge into `main` or expose to general users until live tests and security review are done.


## Invitation format update — 12 characters (2026-11-10)

The latest development branch uses **12-character uppercase codes** from a 32-symbol alphabet: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`. I, O, 0 and 1 are excluded for legibility in the retro font. A secure uniformly generated code contains **60 bits** of randomness. The earlier 32-hex format is no longer accepted after migration `supabase/migrations/20261110_invite_short_codes.sql`. No invite codes had been issued in the dedicated project when this change was prepared.

The invite and claim input widths are limited to **312 CSS pixels** (responsive down to available mobile width), including their action buttons; other signup and game controls remain unchanged.

### Generate a one-use invitation locally

In a private terminal at the repository root, run `node scripts/generate-invite-code.cjs`. It prints a random 12-character code (share privately) and an `INSERT` SQL statement containing only the **SHA-256 digest**. Run that SQL in the project's private Supabase SQL Editor. Never commit or paste the secret code or terminal output into this public GitHub repository. Use one code per person, single-use and 14-day expiry by default.

The existing authenticated `claim_invite` RPC still enforces one-use atomic consumption and a per-account attempt limit. The public precheck does **not** yet have server-side per-IP rate limiting; before expanding beyond a small trusted group, add gateway rate limiting and abuse monitoring. Prechecking a code does not reserve it; it is consumed only after a successful authenticated claim.
