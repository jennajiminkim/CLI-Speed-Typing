# Preview connection — invite-first signup

## Confirmed
- Supabase dedicated project: `CLI Speed Typing Friends` (`zhfkjwduelavepjfacpo`), Seoul region.
- Database migration `invite_auth_phase2` applied previously.
- New `invite_precheck_phase2` SQL RPC applied for code-first signup.
- Project Vercel page supplied by user: https://vercel.com/jennakim/cli-speed-typing
- Historical Preview URL provided by user: https://cli-speed-typing-o0yfrws7h-jennakim.vercel.app/
- Vercel Preview environment variables were shown in the user's screenshot as present; their actual runtime values have not been verified.

## Next actions
1. **Supabase Auth dashboard**: https://supabase.com/dashboard/project/zhfkjwduelavepjfacpo/auth/providers — enable email/password signups and disable Confirm Email **only if accepting unverified email risks**.
2. **Vercel Preview**: redeploy the newest commit of `feature/invite-auth-phase2` (not `main` and not Production). Existing Preview is from an older commit.
3. Verify `/api/public-config` responds with the Supabase project URL and publishable key only. Never reveal a service-role key.
4. Open `/auth.html`, choose 가입하기, check a freshly created one-use invite, then submit email, password and nickname. Review signed-in member state.
5. In another browser account, verify a used code cannot be redeemed and uninvited logins are denied all ranked records.
6. Check Supabase Security Advisor and session/RLS permissions. Complete user A/B tests before merging.

**Important:** a code precheck does not reserve the invitation, and Supabase Auth itself may allow account creation without a code. Only member authorization is invite-gated. Ranked writes stay completely disabled until Phase 3 server verification.
