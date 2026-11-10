-- Phase 2: invite-first registration precheck.
-- Install only on the dedicated CLI Speed Typing Friends Supabase project.
-- The check is intentionally NOT a membership grant. The authenticated,
-- atomic claim_invite remains the sole membership grant and consumes codes.
-- 128-bit random codes make online guessing impractical; rate limiting at
-- the gateway should still be added before public-scale signups.
begin;

create or replace function public.check_invite(p_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p_code is null or upper(btrim(p_code)) !~ '^[A-F0-9]{32}$' then false
    else exists (
      select 1
      from private.invite_codes c
      where c.code_sha256 =
          encode(sha256(convert_to(upper(btrim(p_code)),'UTF8')),'hex')
        and c.revoked_at is null
        and (c.expires_at is null or c.expires_at > now())
        and c.used_count < c.max_uses
    )
  end;
$$;

revoke all on function public.check_invite(text) from public, anon, authenticated;
grant execute on function public.check_invite(text) to anon, authenticated;
commit;
