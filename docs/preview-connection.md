# CLI Speed Typing Friends — Preview connection checklist

Checked 2026-11-10. This document is for the isolated feature branch. Do not change GitHub main or Vercel Production.

## Verified Supabase project
- Name: CLI Speed Typing Friends
- Project ref: zhfkjwduelavepjfacpo
- URL: https://zhfkjwduelavepjfacpo.supabase.co
- Dashboard: https://supabase.com/dashboard/project/zhfkjwduelavepjfacpo
- Region: ap-northeast-2
- Migration invite_auth_phase2 was applied successfully.
- Verified SQL access: anon has NO ranking SELECT/INSERT; authenticated has SELECT but NOT INSERT/UPDATE/DELETE; active membership required by row-level security.
- Security Advisor reports one intentional high-privilege function warning for public.claim_invite. Review its privilege boundary before Production.

## Vercel connection blocker
The connected Vercel account/team lists plandosee-web-diary2 only. Existing cli-speed-typing.vercel.app project was not accessible. Do not create a duplicate or set variables on the wrong project.

### A. Reconnect correct Vercel project
Under ChatGPT Settings > Plugins / connected apps > Vercel, authorize the account/team/project that owns cli-speed-typing.vercel.app. Verify the project appears in the connection.

### B. Set PREVIEW-ONLY environment variables in the correct project
Set CLI_SUPABASE_URL = https://zhfkjwduelavepjfacpo.supabase.co
Set CLI_SUPABASE_PUBLISHABLE_KEY = the enabled sb_publishable_ key copied from https://supabase.com/dashboard/project/zhfkjwduelavepjfacpo/settings/api-keys
Target: Preview only. Optionally scope to Git branch feature/invite-auth-phase2.
Never copy service_role, sb_secret_, private keys or access tokens into public client code or chat.

### C. Determine actual Vercel Preview hostname
Deploy the reviewed Git feature branch feature/invite-auth-phase2 in Preview (not Production).
Verify the deployment commit matches 6250a40601f024567beaa28979c370a5c050eecf or a later reviewed descendant.
Use the REAL URL supplied by Vercel. Do not guess a preview hostname.
Verify /auth.html, /leaderboard.html, /api/public-config on that Preview hostname.

### D. Configure Supabase Auth in its dashboard
Open https://supabase.com/dashboard/project/zhfkjwduelavepjfacpo/auth/url-configuration
Add exact https://ACTUAL_PREVIEW_HOST/auth.html to Redirect URLs.
For preview-only email tests, choose a trusted Preview Site URL; do not direct confirmations to the public Production game.
Under Authentication > Providers > Email, verify email/password signup and Confirm email are ON. The UI labels may vary.
Review the email confirmation template redirect configuration if you customize it.
Official documentation: https://supabase.com/docs/guides/auth/redirect-urls

### E. Live access QA (must be done before merge)
- Guest: leaderboard access denied, browser ranking writes denied.
- Authenticated but uninvited: ranking SELECT denied/empty, browser INSERT denied.
- Confirmed email + valid invite: membership granted, ranking SELECT allowed, browser INSERT still denied.
- Reused, expired and revoked invite codes rejected.
- Inactive membership denied ranking access.
- Run local engine and CI regression tests. Test separate accounts and browsers.

## Known limitation
Record submission is NOT implemented in phase 2. The server ranking remains empty until the trusted run-verification endpoint is built in phase 3.
No email-confirmation or invite-redeem end-to-end tests have passed yet. Do not merge to main or label as Production-ready.