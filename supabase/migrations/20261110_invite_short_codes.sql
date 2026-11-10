-- Change invite format to 12 characters, 32-symbol alphabet = 60 bits of randomness.
-- A-H,J-N,P-Z,2-9, excluding visually similar I,O,0,1.
-- The dedicated CLI Speed Typing Friends database had ZERO issued codes on inspection.
-- Apply ONLY to Supabase CLI Speed Typing Friends (ref zhfkjwduelavepjfacpo).
begin;
create or replace function public.check_invite(p_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p_code is null or upper(btrim(p_code)) !~ '^[A-HJ-NP-Z2-9]{12}$' then false
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
create or replace function public.claim_invite(p_code text, p_display_name text)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_code text := upper(btrim(coalesce(p_code,'')));
  v_name text := btrim(coalesce(p_display_name,''));
  v_attempt_count integer;
  v_claimed uuid;
begin
  if v_uid is null then return false; end if;
  if not exists (
    select 1 from auth.users u
    where u.id=v_uid and u.email_confirmed_at is not null
  ) then return false; end if;
  if exists (
    select 1 from public.invite_members m
    where m.user_id=v_uid and m.is_active
  ) then return true; end if;
  if v_code !~ '^[A-HJ-NP-Z2-9]{12}$' or v_name !~ '^[A-Za-z0-9가-힣_-]{2,16}$'
  then return false; end if;

  insert into private.invite_claim_attempts(user_id,window_start,attempt_count)
  values (v_uid,date_trunc('hour',now()),1)
  on conflict (user_id,window_start) do update
    set attempt_count=private.invite_claim_attempts.attempt_count+1
  returning attempt_count into v_attempt_count;
  if v_attempt_count > 10 then return false; end if;

  -- Atomic consume: the UPDATE row lock prevents double-use in concurrent claims.
  update private.invite_codes c
     set used_count=used_count+1
   where c.code_sha256=encode(sha256(convert_to(v_code,'UTF8')),'hex')
     and c.revoked_at is null
     and (c.expires_at is null or c.expires_at > now())
     and c.used_count < c.max_uses
  returning c.id into v_claimed;
  if v_claimed is null then return false; end if;

  insert into public.invite_members (user_id,display_name,is_active)
  values (v_uid,v_name,true);
  return true;
exception
  when unique_violation then
    -- Never expose another member's identity or private invite metadata.
    return false;
end;
$$;
revoke all on function public.claim_invite(text,text) from public, anon, authenticated;
grant execute on function public.claim_invite(text,text) to authenticated;
commit;
