-- CLI Speed Typing phase 2: invite membership and read-only shared ranking scaffold.
-- Install ONLY on a dedicated CLI Speed Typing Supabase project.
-- Do not run against PlanDoSee or another existing app's database.
begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.invite_codes (
  id uuid primary key default gen_random_uuid(),
  code_sha256 text not null unique check (length(code_sha256)=64),
  max_uses integer not null default 1 check (max_uses between 1 and 100),
  used_count integer not null default 0 check (used_count >= 0 and used_count <= max_uses),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists private.invite_claim_attempts (
  user_id uuid not null references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  attempt_count integer not null default 0,
  primary key (user_id, window_start)
);

create table if not exists public.invite_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (
    char_length(display_name) between 2 and 16
    and display_name ~ '^[A-Za-z0-9가-힣_-]+$'
  ),
  is_active boolean not null default true,
  joined_at timestamptz not null default now()
);

-- Stage 3 will write only server-verified records through a trusted server endpoint.
-- Browser clients receive SELECT only; NO INSERT/UPDATE/DELETE permissions.
create table if not exists public.ranked_runs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  seoul_day date not null,
  elapsed_ms integer not null check (elapsed_ms > 0 and elapsed_ms <= 36000000),
  command_count integer not null check (command_count = 10),
  verification_version text not null,
  created_at timestamptz not null default now(),
  unique (user_id, seoul_day)
);
create index if not exists ranked_runs_day_fast_idx
  on public.ranked_runs (seoul_day, elapsed_ms, user_id);

alter table public.invite_members enable row level security;
alter table public.ranked_runs enable row level security;

revoke all on table public.invite_members, public.ranked_runs from public, anon, authenticated;
grant select on public.invite_members to authenticated;
grant select on public.ranked_runs to authenticated;

drop policy if exists invite_members_read_own on public.invite_members;
create policy invite_members_read_own
  on public.invite_members for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists ranked_runs_read_members_only on public.ranked_runs;
create policy ranked_runs_read_members_only
  on public.ranked_runs for select to authenticated
  using (
    exists (
      select 1 from public.invite_members as m
      where m.user_id=(select auth.uid()) and m.is_active=true
    )
  );

-- This is the ONLY browser-invokable privileged procedure. It never exposes
-- private invitation rows and requires a verified email + valid bearer invite.
-- RLS protects the public data even if the client bypasses its UI.
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
  if v_code !~ '^[A-F0-9]{32}$' or v_name !~ '^[A-Za-z0-9가-힣_-]{2,16}$'
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
revoke all on function public.claim_invite(text,text) from public, anon;
grant execute on function public.claim_invite(text,text) to authenticated;
commit;

-- No codes are inserted automatically. Generate an individual 128-bit code offline,
-- e.g. openssl rand -hex 16, then insert ONLY the SHA-256 digest into private.invite_codes.
